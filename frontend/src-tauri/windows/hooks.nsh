!macro NSIS_HOOK_PREINSTALL
  ; Runtime data lives in Tauri app_data_dir, outside $INSTDIR.
  ; Let the standard Tauri guard handle a running process before cleanup.
  !insertmacro CheckIfAppIsRunning "opd1-tracker.exe" "OPD1 Tracker"
  ; Remove stale program files before copying the new build.
  RMDir /r "$INSTDIR"
  CreateDirectory "$INSTDIR"
!macroend
