use std::path::PathBuf;

fn main() {
    let manifest =
        PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").expect("missing manifest directory"));
    let backend = manifest.join("binaries/opd1-backend/opd1-backend.exe");
    println!("cargo:rerun-if-changed={}", backend.display());

    if std::env::var("PROFILE").as_deref() == Ok("release") && !backend.is_file() {
        panic!("bundled backend is missing; run scripts/build-backend.ps1 first");
    }

    tauri_build::build()
}
