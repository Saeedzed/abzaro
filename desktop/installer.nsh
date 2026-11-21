!macro customInstall
  ; Preserve existing installations and do not uninstall them with Abzaro.
  IfFileExists "$PROGRAMFILES64\LibreOffice\program\soffice.exe" doneOffice 0
  IfFileExists "$PROGRAMFILES32\LibreOffice\program\soffice.exe" doneOffice 0
  DetailPrint "Installing LibreOffice (required for local Word to PDF)..."
  ExecWait 'msiexec.exe /i "$INSTDIR\resources\LibreOffice.msi" /qn /norestart' $0
  ${If} $0 != 0
  ${AndIf} $0 != 3010
    MessageBox MB_OK|MB_ICONEXCLAMATION "LibreOffice installation failed (error $0). Install it from libreoffice.org and try again."
  ${EndIf}
  doneOffice:
!macroend
