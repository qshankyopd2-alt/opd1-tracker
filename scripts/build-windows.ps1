param(
    [string]$Python = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$cargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
if (-not (Test-Path -LiteralPath (Join-Path $cargoBin "cargo.exe"))) {
    throw "Rust Cargo was not found in $cargoBin"
}
$env:PATH = "$cargoBin;$env:PATH"
$env:RUSTFLAGS = "--remap-path-prefix=$env:USERPROFILE=/rust-user --remap-path-prefix=$root=/project"

function Assert-NativeSuccess([string]$Step) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE"
    }
}

& (Join-Path $PSScriptRoot "build-backend.ps1") -Python $Python
Assert-NativeSuccess "Building bundled backend"
& (Join-Path $PSScriptRoot "test-frozen-backend.ps1") -Python (Join-Path $root ".build\backend-venv\Scripts\python.exe")
Assert-NativeSuccess "Testing bundled backend"

Push-Location (Join-Path $root "frontend")
try {
    npm ci
    Assert-NativeSuccess "Installing frontend dependencies"
    npm run build
    Assert-NativeSuccess "Building frontend"
    npm run tauri build
    Assert-NativeSuccess "Building Tauri installer"
} finally {
    Pop-Location
}

$bundle = Join-Path $root "frontend\src-tauri\target\release\bundle\nsis"
if (-not (Test-Path -LiteralPath $bundle)) {
    throw "NSIS output directory was not produced: $bundle"
}
$installer = Get-ChildItem -LiteralPath $bundle -Filter "*.exe" -File |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1
if (-not $installer) {
    throw "No NSIS installer was produced in $bundle"
}

$forbiddenNames = @(
    "encounters.json", "rr_history.json", "sessions.json", "session.json",
    "settings.json", "match_meta.json", ".env", "backend.log"
)
$runtime = Join-Path $root "frontend\src-tauri\binaries\opd1-backend"
$leaks = Get-ChildItem -LiteralPath $runtime -Recurse -File |
    Where-Object { $forbiddenNames -contains $_.Name }
if ($leaks) {
    throw "Release rejected because user data was found: $($leaks.FullName -join ', ')"
}

$hash = Get-FileHash -LiteralPath $installer.FullName -Algorithm SHA256
Write-Host "Installer: $($installer.FullName)"
Write-Host "SHA256: $($hash.Hash)"
