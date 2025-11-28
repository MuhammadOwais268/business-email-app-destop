# Windows: download the .exe from Actions and run with logs

If the release does not contain the `.exe` or you want to fetch the built installer directly from the CI run, follow these steps.

1. Go to GitHub → Actions → select the latest build run for the `build.yml` or the release tag.
2. Under `Artifacts`, download `windows-release` (ZIP). Extract it locally.
3. You will find the NSIS `.exe` and/or a portable `.exe` in the `release/` folder inside the ZIP.

Run and capture logs (PowerShell):

```powershell
# from the folder containing the exe
# run and keep the window open so you can read stdout/stderr
.\scripts\run-windows.ps1 -ExePath .\release\business-email-electron\business-email-electron.exe
```

If SmartScreen blocks the unsigned installer, instruct users to click "More info" and then "Run anyway". For a production release, sign the installer using a code-signing certificate and re-run the CI.
