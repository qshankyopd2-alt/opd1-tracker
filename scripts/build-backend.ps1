param(
    [string]$Python = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$venv = Join-Path $root ".build\backend-venv"
$venvPython = Join-Path $venv "Scripts\python.exe"

function Assert-NativeSuccess([string]$Step) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE"
    }
}

if (-not $Python) {
    $Python = (& py -3.12 -c "import sys; print(sys.executable)").Trim()
}
if (-not (Test-Path -LiteralPath $Python)) {
    throw "Python 3.12 x64 was not found: $Python"
}

if (-not (Test-Path -LiteralPath $venvPython)) {
    & $Python -m venv $venv
    Assert-NativeSuccess "Creating backend build environment"
}

& $venvPython -m pip install --disable-pip-version-check --requirement (Join-Path $root "backend\requirements-build.txt")
Assert-NativeSuccess "Installing backend build dependencies"
& $venvPython -m pip check
Assert-NativeSuccess "Checking backend dependencies"
& $venvPython -c "import struct; assert struct.calcsize('P') == 8; from zoneinfo import ZoneInfo; print(ZoneInfo('UTC'))"
Assert-NativeSuccess "Checking Python architecture and timezone data"
& $venvPython -m pytest `
    (Join-Path $root "backend\tests\test_saved_players.py") `
    (Join-Path $root "backend\tests\test_live_name_refresh.py") `
    (Join-Path $root "backend\tests\test_live_party_detection.py") `
    (Join-Path $root "backend\tests\test_live_match_cache.py") `
    -q
Assert-NativeSuccess "Testing backend release logic"

$dist = Join-Path $root "frontend\src-tauri\binaries"
$work = Join-Path $root ".build\pyinstaller-work"
$spec = Join-Path $root ".build\pyinstaller-spec"

& $venvPython -m PyInstaller `
    --clean `
    --noconfirm `
    --onedir `
    --console `
    --noupx `
    --name "opd1-backend" `
    --distpath $dist `
    --workpath $work `
    --specpath $spec `
    --collect-all "tzdata" `
    --collect-all "ably" `
    --collect-all "pypresence" `
    --collect-all "valclient" `
    --collect-submodules "websockets" `
    --hidden-import "cryptography.hazmat.primitives.serialization.pkcs12" `
    (Join-Path $root "backend\desktop.py")
Assert-NativeSuccess "Building frozen backend"

$exe = Join-Path $dist "opd1-backend\opd1-backend.exe"
if (-not (Test-Path -LiteralPath $exe)) {
    throw "PyInstaller did not create $exe"
}

$forbidden = @(
    "encounters.json", "rr_history.json", "sessions.json", "session.json",
    "settings.json", "match_meta.json", ".env", "backend.log"
)
$leaks = Get-ChildItem -LiteralPath (Split-Path -Parent $exe) -Recurse -File |
    Where-Object { $forbidden -contains $_.Name }
if ($leaks) {
    throw "Personal-data files entered the backend runtime: $($leaks.FullName -join ', ')"
}

$smokeData = Join-Path $root ".build\backend-smoke-data"
$version = [System.IO.File]::ReadAllText((Join-Path $root "VERSION")).Trim()
if (Test-Path -LiteralPath $smokeData) {
    Remove-Item -LiteralPath $smokeData -Recurse -Force
}
New-Item -ItemType Directory -Path $smokeData | Out-Null
$process = $null
try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $exe
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.EnvironmentVariables["BACKEND_PORT"] = "0"
    $psi.EnvironmentVariables["OPD1_API_TOKEN"] = "build-smoke-token"
    $psi.EnvironmentVariables["OPD1_APP_VERSION"] = $version
    $psi.EnvironmentVariables["OPD1_DATA_DIR"] = $smokeData
    $psi.EnvironmentVariables["OPD1_LOG_DIR"] = $smokeData
    $process = [System.Diagnostics.Process]::Start($psi)
    $line = $process.StandardOutput.ReadLine()
    if (-not $line.StartsWith("OPD1_READY ")) {
        if (-not $process.HasExited) { $process.Kill() }
        throw "Frozen backend did not emit readiness: $line $($process.StandardError.ReadToEnd())"
    }
    $ready = $line.Substring(11) | ConvertFrom-Json
    $healthUrl = "http://127.0.0.1:$($ready.port)/api/health"
    $unauthorized = 0
    try {
        Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 10 | Out-Null
    } catch {
        $unauthorized = [int]$_.Exception.Response.StatusCode
    }
    $health = Invoke-RestMethod -Uri $healthUrl -Headers @{"X-OPD1-Token"="build-smoke-token"} -TimeoutSec 10
    if ($unauthorized -ne 401 -or -not $health.ok -or $health.appVersion -ne $version) {
        throw "Frozen backend smoke test failed (unauthorized=$unauthorized, health=$($health.ok), version=$($health.appVersion))"
    }
} finally {
    if ($process) {
        try { $process.StandardInput.Close() } catch {}
        if (-not $process.WaitForExit(10000)) { $process.Kill(); $process.WaitForExit() }
    }
}

Write-Host "Bundled backend: $exe"
