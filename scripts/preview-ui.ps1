param(
    [ValidateSet('Preview', 'Original')][string]$Mode = 'Preview',
    [string]$OriginalRoot = (Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) 'OPD1 Tracker'),
    [switch]$Run
)
$ErrorActionPreference = 'Stop'
$previewRoot = Split-Path $PSScriptRoot -Parent
$stateDir = Join-Path $previewRoot '.build\ui-preview'
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
$stateFile = Join-Path $stateDir 'session.json'

if (-not $Run) {
    if (Test-Path -LiteralPath $stateFile) {
        $saved = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
        $runner = Get-Process -Id $saved.id -ErrorAction SilentlyContinue
        if ($runner -and $runner.StartTime.ToUniversalTime().Ticks.ToString() -eq $saved.started) {
            $processes = @(Get-CimInstance Win32_Process)
            $owned = [System.Collections.Generic.List[int]]::new()
            $owned.Add($runner.Id)
            for ($i = 0; $i -lt $owned.Count; $i++) {
                foreach ($child in $processes | Where-Object { $_.ParentProcessId -eq $owned[$i] }) {
                    if (-not $owned.Contains([int]$child.ProcessId)) { $owned.Add([int]$child.ProcessId) }
                }
            }
            # Only descendants of our verified runner; never stop an existing user session.
            for ($i = $owned.Count - 1; $i -ge 0; $i--) {
                Stop-Process -Id $owned[$i] -Force -ErrorAction SilentlyContinue
            }
        }
    }
    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"", '-Run', '-Mode', $Mode, '-OriginalRoot', "`"$OriginalRoot`"")
    $runner = Start-Process powershell.exe -ArgumentList $arguments -WindowStyle Hidden -PassThru
    @{ id = $runner.Id; started = $runner.StartTime.ToUniversalTime().Ticks.ToString(); mode = $Mode } |
        ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
    Write-Output "$Mode launched. Log: $(Join-Path $stateDir "$Mode.log")"
    exit
}

$sourceRoot = if ($Mode -eq 'Preview') { $previewRoot } else { (Resolve-Path -LiteralPath $OriginalRoot).Path }
if (-not (Test-Path -LiteralPath (Join-Path $sourceRoot 'frontend\package.json'))) { throw 'Tracker source checkout not found.' }
$port = if ($Mode -eq 'Preview') { 3011 } else { 3012 }
$configPath = Join-Path $stateDir "$Mode.json"
@{
    identifier = "com.opd1.tracker.review.$($Mode.ToLowerInvariant())"
    build = @{ devUrl = "http://127.0.0.1:$port"; beforeDevCommand = "npm run dev -- --port $port" }
    app = @{ windows = @(@{ label = 'main'; title = "OPD1 Tracker - $Mode"; width = 1200; height = 700; minWidth = 1200; minHeight = 700; resizable = $false }) }
} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $configPath -Encoding UTF8
$env:VITE_DESIGN_MODE = 'true'
$env:PATH = "$(Join-Path $env:USERPROFILE '.cargo\bin');$env:PATH"
$env:OPD1_PYTHON = Join-Path $previewRoot '.build\backend-venv\Scripts\python.exe'
Set-Location -LiteralPath (Join-Path $sourceRoot 'frontend')
& npm.cmd run tauri -- dev --no-watch --config $configPath *> (Join-Path $stateDir "$Mode.log")
exit $LASTEXITCODE
