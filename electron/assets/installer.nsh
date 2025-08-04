!macro customInstall
  ; Ensure desktop shortcut has proper icon
  CreateShortCut "$DESKTOP\Research Notebook.lnk" "$INSTDIR\Research Notebook.exe" "" "$INSTDIR\Research Notebook.exe" 0
  
  ; Ensure start menu shortcut has proper icon
  CreateShortCut "$SMPROGRAMS\Research Notebook\Research Notebook.lnk" "$INSTDIR\Research Notebook.exe" "" "$INSTDIR\Research Notebook.exe" 0
  
  ; Set proper icon for shortcuts
  SetOutPath "$INSTDIR"
  File "electron/assets/app-icon.ico"
  
  ; Register file associations for PDF files
  WriteRegStr HKCR ".pdf" "" "ResearchNotebook.PDF"
  WriteRegStr HKCR "ResearchNotebook.PDF" "" "PDF Document"
  WriteRegStr HKCR "ResearchNotebook.PDF\DefaultIcon" "" "$INSTDIR\app-icon.ico,0"
  WriteRegStr HKCR "ResearchNotebook.PDF\shell\open\command" "" '"$INSTDIR\Research Notebook.exe" "%1"'
  WriteRegStr HKCR "ResearchNotebook.PDF\shell\print\command" "" '"$INSTDIR\Research Notebook.exe" "%1"'
  
  ; Register MIME type
  WriteRegStr HKCR "MIME\Database\Content Type\application\pdf" "Extension" ".pdf"
  WriteRegStr HKCR "MIME\Database\Content Type\application\pdf" "CLSID" "{25336920-03F9-11cf-8FD0-00AA00686F13}"
  
  ; Register custom URL scheme protocol
  WriteRegStr HKCR "researchnotebook" "" "URL:Research Notebook Protocol"
  WriteRegStr HKCR "researchnotebook" "URL Protocol" ""
  WriteRegStr HKCR "researchnotebook\DefaultIcon" "" "$INSTDIR\app-icon.ico,0"
  WriteRegStr HKCR "researchnotebook\shell\open\command" "" '"$INSTDIR\Research Notebook.exe" "%1"'
!macroend

!macro customUnInstall
  ; Clean up desktop shortcut
  Delete "$DESKTOP\Research Notebook.lnk"
  
  ; Clean up start menu shortcuts
  RMDir /r "$SMPROGRAMS\Research Notebook"
  
  ; Clean up icon file
  Delete "$INSTDIR\app-icon.ico"
  
  ; Clean up file associations
  DeleteRegKey HKCR ".pdf"
  DeleteRegKey HKCR "ResearchNotebook.PDF"
  DeleteRegKey HKCR "MIME\Database\Content Type\application\pdf"
  
  ; Clean up custom URL scheme protocol
  DeleteRegKey HKCR "researchnotebook"
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