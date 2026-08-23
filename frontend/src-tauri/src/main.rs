#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{mpsc, Mutex};
use std::thread;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, RunEvent, State};
use uuid::Uuid;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct BackendConnection {
    url: String,
    token: String,
    version: String,
}

#[derive(Deserialize)]
struct BackendReady {
    port: u16,
}

struct Backend {
    child: Mutex<Option<Child>>,
    connection: Mutex<Option<BackendConnection>>,
    error: Mutex<Option<String>>,
}

#[tauri::command]
fn backend_connection(state: State<Backend>) -> Result<BackendConnection, String> {
    if let Some(connection) = state.connection.lock().unwrap().clone() {
        return Ok(connection);
    }
    Err(state
        .error
        .lock()
        .unwrap()
        .clone()
        .unwrap_or_else(|| "Backend is still starting.".into()))
}

#[cfg(debug_assertions)]
fn python_executable() -> String {
    std::env::var("OPD1_PYTHON")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| {
            if cfg!(windows) {
                "python".into()
            } else {
                "python3".into()
            }
        })
}

enum LaunchTarget {
    Frozen(PathBuf),
    #[cfg(debug_assertions)]
    Source(PathBuf),
}

fn launch_target(app: &AppHandle) -> Result<LaunchTarget, String> {
    #[cfg(debug_assertions)]
    {
        let source = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../backend");
        if source.join("desktop.py").is_file() {
            return Ok(LaunchTarget::Source(source));
        }
    }

    let executable = app
        .path()
        .resolve("backend-runtime/opd1-backend.exe", BaseDirectory::Resource)
        .map_err(|error| format!("Could not resolve bundled backend: {error}"))?;
    if executable.is_file() {
        Ok(LaunchTarget::Frozen(executable))
    } else {
        Err(format!(
            "Bundled backend is missing: {}",
            executable.display()
        ))
    }
}

fn command_for(target: &LaunchTarget) -> Command {
    match target {
        LaunchTarget::Frozen(executable) => {
            let mut command = Command::new(executable);
            if let Some(parent) = executable.parent() {
                command.current_dir(parent);
            }
            command
        }
        #[cfg(debug_assertions)]
        LaunchTarget::Source(directory) => {
            let mut command = Command::new(python_executable());
            command.arg("desktop.py").current_dir(directory);
            command
        }
    }
}

fn append_launcher_log(log_dir: &Path, message: &str) {
    let _ = fs::create_dir_all(log_dir);
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_dir.join("launcher.log"))
    {
        let _ = writeln!(file, "{message}");
    }
}

fn spawn_backend(app: &AppHandle) -> Result<(Child, BackendConnection), String> {
    let target = launch_target(app)?;
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Could not resolve application data: {error}"))?;
    let data_dir = app_data.join("data");
    let log_dir = app_data.join("logs");
    fs::create_dir_all(&data_dir)
        .map_err(|error| format!("Could not create data directory: {error}"))?;
    fs::create_dir_all(&log_dir)
        .map_err(|error| format!("Could not create log directory: {error}"))?;

    let token = Uuid::new_v4().simple().to_string();
    let version = app.package_info().version.to_string();
    let log = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_dir.join("backend-process.log"))
        .map_err(|error| format!("Could not open backend log: {error}"))?;
    let stderr = log
        .try_clone()
        .map_err(|error| format!("Could not prepare backend log: {error}"))?;

    let mut command = command_for(&target);
    command
        .env("BACKEND_PORT", "0")
        .env("OPD1_API_TOKEN", &token)
        .env("OPD1_APP_VERSION", &version)
        .env("OPD1_DATA_DIR", &data_dir)
        .env("OPD1_LOG_DIR", &log_dir)
        .env("SCOUT_QUIET", "1")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::from(stderr));
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }

    let mut child = command
        .spawn()
        .map_err(|error| format!("Could not start bundled backend: {error}"))?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Backend output pipe was not created.".to_string())?;
    let (ready_tx, ready_rx) = mpsc::channel::<Result<u16, String>>();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        let mut log = log;
        let mut announced = false;
        for line in reader.lines() {
            match line {
                Ok(line) => {
                    let _ = writeln!(log, "{line}");
                    if !announced {
                        if let Some(payload) = line.strip_prefix("OPD1_READY ") {
                            match serde_json::from_str::<BackendReady>(payload) {
                                Ok(ready) => {
                                    announced = true;
                                    let _ = ready_tx.send(Ok(ready.port));
                                }
                                Err(error) => {
                                    let _ = ready_tx.send(Err(format!(
                                        "Backend returned invalid readiness data: {error}"
                                    )));
                                    return;
                                }
                            }
                        }
                    }
                }
                Err(error) => {
                    let _ = ready_tx.send(Err(format!("Could not read backend output: {error}")));
                    return;
                }
            }
        }
        if !announced {
            let _ = ready_tx.send(Err("Backend exited before it became ready.".into()));
        }
    });

    let port = match ready_rx.recv_timeout(Duration::from_secs(30)) {
        Ok(Ok(port)) => port,
        Ok(Err(error)) => {
            let _ = child.kill();
            let _ = child.wait();
            return Err(error);
        }
        Err(_) => {
            let _ = child.kill();
            let _ = child.wait();
            return Err("Backend did not become ready within 30 seconds.".into());
        }
    };

    Ok((
        child,
        BackendConnection {
            url: format!("http://127.0.0.1:{port}"),
            token,
            version,
        },
    ))
}

fn stop_backend(mut child: Child) {
    drop(child.stdin.take());
    for _ in 0..50 {
        match child.try_wait() {
            Ok(Some(_)) => return,
            Ok(None) => thread::sleep(Duration::from_millis(100)),
            Err(_) => break,
        }
    }
    let _ = child.kill();
    let _ = child.wait();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .manage(Backend {
            child: Mutex::new(None),
            connection: Mutex::new(None),
            error: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![backend_connection])
        .setup(|app| {
            let handle = app.handle().clone();
            let log_dir = handle
                .path()
                .app_data_dir()
                .map(|path| path.join("logs"))
                .unwrap_or_else(|_| PathBuf::from("."));
            let state: State<Backend> = handle.state();
            match spawn_backend(&handle) {
                Ok((child, connection)) => {
                    append_launcher_log(&log_dir, &format!("backend ready at {}", connection.url));
                    *state.child.lock().unwrap() = Some(child);
                    *state.connection.lock().unwrap() = Some(connection);
                }
                Err(error) => {
                    append_launcher_log(&log_dir, &format!("backend startup failed: {error}"));
                    *state.error.lock().unwrap() = Some(error);
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building OPD1 Tracker")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                let state: State<Backend> = app.state();
                if let Some(child) = state.child.lock().unwrap().take() {
                    stop_backend(child);
                };
            }
        });
}
