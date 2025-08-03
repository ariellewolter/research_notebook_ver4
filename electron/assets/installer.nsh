!macro customInstall
  ; Ensure desktop shortcut has proper icon
  CreateShortCut "$DESKTOP\Research Notebook.lnk" "$INSTDIR\Research Notebook.exe" "" "$INSTDIR\Research Notebook.exe" 0
  
  ; Ensure start menu shortcut has proper icon
  CreateShortCut "$SMPROGRAMS\Research Notebook\Research Notebook.lnk" "$INSTDIR\Research Notebook.exe" "" "$INSTDIR\Research Notebook.exe" 0
  
  ; Set proper icon for shortcuts
  SetOutPath "$INSTDIR"
  File "electron/assets/app-icon.ico"
!macroend

!macro customUnInstall
  ; Clean up desktop shortcut
  Delete "$DESKTOP\Research Notebook.lnk"
  
  ; Clean up start menu shortcuts
  RMDir /r "$SMPROGRAMS\Research Notebook"
  
  ; Clean up icon file
  Delete "$INSTDIR\app-icon.ico"
!macroend

; Ensure proper icon association
!macro customShortcutIcon
  SetOutPath "$INSTDIR"
  File "electron/assets/app-icon.ico"
  
  ; Set icon for desktop shortcut
  CreateShortCut "$DESKTOP\Research Notebook.lnk" "$INSTDIR\Research Notebook.exe" "" "$INSTDIR\app-icon.ico" 0
  
  ; Set icon for start menu shortcut
  CreateShortCut "$SMPROGRAMS\Research Notebook\Research Notebook.lnk" "$INSTDIR\Research Notebook.exe" "" "$INSTDIR\app-icon.ico" 0
!macroend 