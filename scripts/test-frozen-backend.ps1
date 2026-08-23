param(
    [string]$Python = "",
    [string]$Executable = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not $Python) {
    $Python = (& py -3.10 -c "import sys; print(sys.executable)").Trim()
}
if (-not $Executable) {
    $Executable = Join-Path $root "frontend\src-tauri\binaries\opd1-backend\opd1-backend.exe"
}
if (-not (Test-Path -LiteralPath $Python)) {
    throw "Test Python was not found: $Python"
}
if (-not (Test-Path -LiteralPath $Executable)) {
    throw "Frozen backend was not found: $Executable"
}

$token = "release-test-token"
$version = [System.IO.File]::ReadAllText((Join-Path $root "VERSION")).Trim()
$testData = Join-Path $root ".build\frozen-test-$PID"
New-Item -ItemType Directory -Path $testData | Out-Null
$process = $null
try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Executable
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.EnvironmentVariables["BACKEND_PORT"] = "0"
    $psi.EnvironmentVariables["OPD1_API_TOKEN"] = $token
    $psi.EnvironmentVariables["OPD1_APP_VERSION"] = $version
    $psi.EnvironmentVariables["OPD1_DATA_DIR"] = $testData
    $psi.EnvironmentVariables["OPD1_LOG_DIR"] = $testData
    $psi.EnvironmentVariables["DATA_SOURCE"] = "demo"
    $process = [System.Diagnostics.Process]::Start($psi)
    $line = $process.StandardOutput.ReadLine()
    if (-not $line -or -not $line.StartsWith("OPD1_READY ")) {
        if (-not $process.HasExited) { $process.Kill() }
        throw "Frozen backend did not become ready: $line $($process.StandardError.ReadToEnd())"
    }
    $ready = $line.Substring(11) | ConvertFrom-Json
    $env:OPD1_TEST_BASE_URL = "http://127.0.0.1:$($ready.port)"
    $env:OPD1_TEST_API_TOKEN = $token
    & $Python -m pytest (Join-Path $root "backend\tests\backend_test.py") -q
    if ($LASTEXITCODE -ne 0) {
        throw "Frozen backend integration tests failed with exit code $LASTEXITCODE"
    }
} finally {
    Remove-Item Env:OPD1_TEST_BASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:OPD1_TEST_API_TOKEN -ErrorAction SilentlyContinue
    if ($process) {
        try { $process.StandardInput.Close() } catch {}
        if (-not $process.WaitForExit(10000)) { $process.Kill(); $process.WaitForExit() }
    }
    if (Test-Path -LiteralPath $testData) {
        Remove-Item -LiteralPath $testData -Recurse -Force
    }
}
