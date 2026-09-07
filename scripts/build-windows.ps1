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
$rustFlags = @(
    "--remap-path-prefix=$env:USERPROFILE=/rust-user",
    "--remap-path-prefix=$root=/project"
)
$env:CARGO_ENCODED_RUSTFLAGS = [string]::Join([char]0x1f, $rustFlags)
Remove-Item Env:RUSTFLAGS -ErrorAction SilentlyContinue

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

# A broken legacy uninstaller should not block the replacement installer.
# The preinstall hook below removes the old program directory after this page.
$nsisRoot = Join-Path $root "frontend\src-tauri\target\release\nsis\x64"
$nsisSource = Join-Path $nsisRoot "installer.nsi"
if (-not (Test-Path -LiteralPath $nsisSource)) {
    throw "NSIS script was not produced: $nsisSource"
}
$nsisText = Get-Content -LiteralPath $nsisSource -Raw -Encoding UTF8
$fallbackPattern = '      MessageBox MB_ICONEXCLAMATION "\$\(unableToUninstall\)"\r?\n      Abort'
$fallbackMatches = [regex]::Matches($nsisText, $fallbackPattern)
if ($fallbackMatches.Count -ne 1) {
    throw "Expected one NSIS uninstall fallback block, found $($fallbackMatches.Count)"
}
$nsisText = [regex]::Replace($nsisText, $fallbackPattern, "      Goto reinst_done", 1)
$utf8 = New-Object System.Text.UTF8Encoding($true)
[IO.File]::WriteAllText($nsisSource, $nsisText, $utf8)

$makensis = Join-Path $env:LOCALAPPDATA "tauri\NSIS\makensis.exe"
if (-not (Test-Path -LiteralPath $makensis)) {
    throw "makensis was not found: $makensis"
}
$patchedInstaller = Join-Path $nsisRoot "nsis-output.exe"
Remove-Item -LiteralPath $patchedInstaller -Force -ErrorAction SilentlyContinue
Push-Location $nsisRoot
try {
    & $makensis "/V2" "installer.nsi"
    Assert-NativeSuccess "Rebuilding patched NSIS installer"
} finally {
    Pop-Location
}
if (-not (Test-Path -LiteralPath $patchedInstaller)) {
    throw "Patched NSIS installer was not produced: $patchedInstaller"
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
Copy-Item -LiteralPath $patchedInstaller -Destination $installer.FullName -Force

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
