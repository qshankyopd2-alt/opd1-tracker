$frontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location -LiteralPath $frontendDir
$env:VITE_DESIGN_MODE = 'true'
npm run tauri dev
