<#
Simple helper for Windows recipients to run the portable .exe from PowerShell
Usage: Open PowerShell, cd to the folder containing the .exe and run:
  .\scripts\run-windows.ps1 -ExePath .\business-email-electron.exe
#>
param(
  [string]$ExePath = ".\business-email-electron.exe"
)

if (Test-Path $ExePath) {
  Write-Host "Running: $ExePath -- output will appear in this PowerShell window"
  & $ExePath
} else {
  Write-Error "File not found: $ExePath. Pass path as -ExePath 'C:\\path\\to\\app.exe'"
  exit 1
}
