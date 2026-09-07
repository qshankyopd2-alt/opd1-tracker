!macro NSIS_HOOK_PREINSTALL
  ; Runtime data lives in Tauri app_data_dir, outside $INSTDIR.
  ; Remove stale program files before copying the new build.
  RMDir /r "$INSTDIR"
  CreateDirectory "$INSTDIR"
!macroend
