# business-email-app-electon

## Monitoring the app and bundled backend (Ubuntu + Windows)

This section explains how to monitor the packaged app and the bundled local backend so you (on Ubuntu) or a Windows recipient can confirm the app and backend are running and troubleshoot issues.

Health endpoint
- The bundled demo backend exposes a small health endpoint used by the renderer: `GET http://127.0.0.1:5678/health` which responds with `ok` when the backend is up.
- Quick check (Linux or Windows PowerShell):

Linux / WSL / Mac (terminal):
```bash
curl -sS http://127.0.0.1:5678/health || echo "backend not responding"
```

Windows (PowerShell):
```powershell
Invoke-RestMethod -UseBasicParsing http://127.0.0.1:5678/health
```

If the health check fails, the frontend won't be able to call the webhook endpoints. See troubleshooting below.

Monitoring on Ubuntu (you)
- If you start the AppImage from a terminal you will see stdout/stderr printed there. This is the fastest way to catch errors:
```bash
./BusinessEmail-0.1.0.AppImage
# or from release/linux-unpacked
./release/linux-unpacked/business-email-electron
```
- Check the backend port is listening:
```bash
ss -ltnp | grep 5678
# or
sudo lsof -iTCP -sTCP:LISTEN -P -n | grep 5678
```
- Find the running processes:
```bash
ps aux | grep -i business-email
ps aux | grep -i node   # if running an unpacked node backend
```
- If you want the app to run as a background (user) service, you can create a `systemd --user` unit that launches the AppImage or the packaged binary. This lets you use `systemctl --user status` to monitor it.

Monitoring on Windows (.exe)
- Open Task Manager (Ctrl+Shift+Esc) → Details tab and look for `business-email-electron.exe` (or similar). You can monitor CPU/memory and end the process there.
- From PowerShell to list processes:
```powershell
Get-Process | Where-Object {$_.ProcessName -like '*business*' -or $_.Path -like '*business-email*'}
```
- View Windows Event Viewer for application errors: Start → type "Event Viewer" → Windows Logs → Application. If the app crashes, you may see .NET/Win32 crash entries or application errors.
- If you want a simple logfile location, run the .exe from PowerShell (double-clicking won't show stdout):
```powershell
# run from the folder containing the exe to see stdout/stderr
.\business-email-electron.exe
```

Where logs and resources live (packaged app)
- Linux unpacked: `release/linux-unpacked/` — the executable is `business-email-electron` and bundled backend binary is under `resources/backend/<platform>/server`.
- AppImage: mount/unpack AppImage with `--appimage-extract` or run it directly and watch the terminal to see console output.
- Windows portable: logs will appear on the console if you run the `.exe` from a cmd/powershell prompt. If installed via the NSIS installer the start menu shortcut will typically launch the app without a visible console.

Troubleshooting (common issues and fixes)
- AppImage does not run (permission):
```bash
chmod +x BusinessEmail-0.1.0.AppImage
./BusinessEmail-0.1.0.AppImage
```
- GLIBCXX / libstdc++ mismatch errors when running binaries built on one host and executed on another: build artifacts in CI (GitHub Actions) or use the official electron-builder Docker image to produce portable artifacts. See the Docker snippet earlier in this README.
- Backend not accessible (health check fails):
	- Ensure nothing else is listening on port 5678.
	- Confirm the bundled backend binary exists in resources (for unpacked builds):
		- `ls release/linux-unpacked/resources/backend/linux/` (Linux)
	- Run the backend binary by itself to inspect stdout and errors:
		- `./release/linux-unpacked/resources/backend/linux/server`
- Windows SmartScreen / Defender warns on unsigned .exe: acquire a code-signing certificate and configure `electron-builder` to sign Windows installers. Without signing, recipients will need to choose "More info" → "Run anyway" in the SmartScreen dialog.
- Missing dependencies when installing `.deb`: run `sudo apt -f install` to auto-fix dependencies.

Distributing to another person (Ubuntu and Windows guidance)
- Windows recipient:
	- Best: give them the NSIS installer `.exe` from the Releases page — double-click to install. Recommend code-signing for wide distribution.
	- Alternative: give them the portable `.zip` with the `.exe` and ask them to run it from a PowerShell prompt to see logs.

- Ubuntu recipient:
	- Best: give them the AppImage for the easiest plug-and-play experience. Tell them to `chmod +x` and double-click or run from a terminal.
	- Alternative: give them the `.deb` and ask them to run `sudo dpkg -i business-email-electron_*.deb` and `sudo apt -f install`.

Packaging & where Windows `.exe` comes from
- Windows installers are produced by the GitHub Actions workflow in `.github/workflows/build.yml` on a `windows-latest` runner. When the workflow finishes:
	- Go to GitHub → Actions → select the workflow run → Artifacts → download `windows-release` ZIP. The `.exe` will be inside the `release/` folder of that ZIP.
	- If you create a Release tag (e.g., `v0.1.0`) the `release-on-tag` workflow will attach the built `.exe` to the GitHub Release automatically.

Checksums and verifying artifacts
- Create SHA256 sums and publish them with the release so recipients can verify integrity:
```bash
sha256sum BusinessEmail-0.1.0.AppImage > BusinessEmail-0.1.0.AppImage.sha256
sha256sum business-email-electron_0.1.0_amd64.deb > business-email-electron_0.1.0_amd64.deb.sha256
```

Useful debug commands (copy-paste)
- Check backend port on Linux:
```bash
ss -ltnp | grep 5678
```
- Tail syslog / journalctl for desktop session errors (Ubuntu):
```bash
journalctl --user -f
journalctl -f            # system logs (requires sudo for some entries)
```
- Show process tree and children (helpful to check if Electron spawned backend):
```bash
pstree -p $(pgrep -f business-email-electron | head -n1)
```

Next steps and optional improvements
- Code-signing: to avoid SmartScreen on Windows we can add a code-signing step in CI. You would need to provide a PFX certificate and set secrets in GitHub Actions.
- Auto-update: configure electron-builder's auto-update provider (GitHub Releases or a custom server) to enable in-app updates.
- System integration: for a robust production install consider creating a systemd user service that starts the backend and the Electron app on login for Linux users.

If you want, I can now update the GitHub Release notes with the checksums and an attached AppImage/.exe after the CI run finishes. I can also add a short `run-locally.sh` script to the repo that runs the AppImage and tail-follows logs — tell me which you prefer and I'll add it.

Helper scripts (run and capture logs)
-----------------------------------
Two small helper scripts are included under `scripts/` to make it easier to run the packaged app and capture stdout/stderr when testing or sharing with non-technical recipients.

- `scripts/run-locally.sh` (Linux)
	- Runs the AppImage (default `./BusinessEmail-0.1.0.AppImage`) if present, or the unpacked binary at `release/linux-unpacked/business-email-electron`.
	- Usage:
```bash
./scripts/run-locally.sh                # runs ./BusinessEmail-0.1.0.AppImage if present
./scripts/run-locally.sh /path/to/file.AppImage
```

- `scripts/run-windows.ps1` (Windows PowerShell)
	- Runs the portable `.exe` from PowerShell and prints stdout/stderr to the console so recipients can see errors.
	- Usage (PowerShell):
```powershell
# from the directory containing the exe
.\scripts\run-windows.ps1 -ExePath .\business-email-electron.exe
```

Notes:
- Make the Linux script executable after pulling from git:
```bash
chmod +x ./scripts/run-locally.sh
```
- The scripts are meant to help during QA and when sharing artifacts with others; they do not replace proper logging or a production installer/service.
Business Email Electron PoC

This folder contains a minimal Electron + React (Vite) proof-of-concept that implements a search input and an editable results table. It mirrors the original Streamlit app's search -> edit flow as a starting point for conversion.

Quick start (dev):

1. Open a terminal in this folder:

```bash
cd /home/owais/Downloads/business-email-app-electron
```

2. Install dependencies:

```bash
npm install
```

3. Start the renderer dev server in one terminal:

```bash
npm run dev:renderer
```

4. Start Electron in another terminal:

```bash
npm run dev:electron
```

Notes:
- For the PoC the renderer performs POST requests directly to your n8n webhooks at `http://localhost:5678`. Ensure n8n is running and the endpoint `POST /webhook/ai-business-lookup` is available.
- Packaging and further features (batch update, email composer, robust data grid) will be implemented next.

Build & packaging (CI and local)

This repository includes a GitHub Actions workflow that builds and packages the app for Linux and Windows and uploads the produced artifacts as workflow artifacts. The workflow file is at `.github/workflows/build.yml` and can be triggered automatically on push or manually (workflow_dispatch).

How the CI build works (high-level):
- On `ubuntu-latest` the workflow runs `npm ci` and `npm run build` and produces Linux artifacts (`AppImage` and `.deb`) under the `release/` folder.
- On `windows-latest` the workflow runs `npm ci` and `npm run build` and produces Windows artifacts (NSIS installer and portable) under `release/`.

Triggering the CI build (GitHub):
1. Push your repo to GitHub (branch `main` or `master`) or open the Actions tab and run the workflow manually via "Run workflow".
2. After the workflow finishes, download the artifacts from the workflow run (Actions → select run → Artifacts → `linux-release` / `windows-release`).

Releases
--------
When you push a release tag (for example `v0.1.0`) the repository workflow will create a GitHub Release and attach the built installers. You can download the Windows installer (`.exe`) or the Linux AppImage/`.deb` from the Releases page:

- Releases URL for this project: https://github.com/MuhammadOwais268/business-email-app-destop/releases

If you don't see the `.exe` on Releases, check Actions → the release workflow run → Artifacts (`windows-release`) and download the artifact ZIP — the `.exe` will be inside the `release/` folder in that ZIP.

Local Docker build for Linux (optional, avoids glibc/libstdc++ mismatch):
If you prefer to build locally for reliable Linux artifacts (recommended to avoid GLIBCXX issues), use the official electron-builder Docker image. From the project root:
```bash
docker run --rm \
	-v "${PWD}:/project" \
	-v ~/.cache/electron:/root/.cache/electron \
	-e DISPLAY=$DISPLAY \
	electronuserland/builder:latest \
	bash -lc "npm ci && npm run build"
```

What to give your users (recommended):
- Windows: provide the NSIS installer `.exe` (user double-clicks to install) or portable `.zip` with the application executable.
- Linux: provide the `AppImage` (single executable users can run) or `.deb` for Debian/Ubuntu users.

How to use the packaged outputs (copy these into release notes you give the user):

Windows (NSIS installer)
1. Download `YourApp-Setup.exe` from the release link.
2. Double-click and follow the installer.
3. Run the App from Start Menu or Desktop shortcut.

Windows (portable)
1. Download the portable `.zip` and unzip it.
2. Double-click the `.exe` file inside. If Defender warns, choose "More info" → "Run anyway".

Ubuntu / Debian (AppImage - easiest)
1. Download `BusinessEmail-*.AppImage`.
2. Open a terminal in the download folder and run:
```bash
chmod +x BusinessEmail-0.1.0.AppImage
./BusinessEmail-0.1.0.AppImage
```
	 Or right-click → Properties → Permissions → allow execute, then double-click.

Ubuntu / Debian (deb - native install)
1. Download `business-email-electron_*.deb`.
2. Install with:
```bash
sudo dpkg -i business-email-electron_0.1.0_amd64.deb
sudo apt -f install   # fix missing dependencies if prompted
```

Notes about runtime/backend
- If the app communicates with local webhooks (the PoC uses `http://localhost:5678`), non-technical users need either a remote webhook endpoint or a bundled backend shipped with the app. Let me know if you want a bundled demo backend for distribution.

Checksums & trust
- Create SHA256 checksums for artifacts and publish them alongside the release:
```bash
sha256sum BusinessEmail-0.1.0.AppImage > BusinessEmail-0.1.0.AppImage.sha256
```
- For Windows installers, code-signing prevents SmartScreen warnings. If you want, I can add signing configuration (you need a code-signing certificate).

If you'd like, I can now:
- (A) Push the GitHub Actions workflow into your repository (done) and help run it on GitHub (you'll need to push to GitHub); or
- (B) Create a Docker script + run a local Docker build here to produce an AppImage for you (I need Docker available on the machine); or
- (C) Add an automated GitHub Release step to the workflow to publish artifacts directly to Releases when you create a Release tag.

Tell me which of A/B/C you want next and I will proceed.

# business-email-app-electon
# business-email-app-electon

## Download & Install (Windows and Linux)

This app is distributed as platform-native installers and packages produced by the project's CI/release pipeline. The easiest way to give the app to another person is to attach the appropriate installer to a GitHub Release.

System requirements (end users)
- 64-bit (x86_64) Windows 10/11 or modern Ubuntu/Debian (64-bit). The AppImage and .deb provided target x86_64.
- No Node.js required for end users — the packaged installers include the Node/Electron runtime and a bundled demo backend where applicable.
- For Linux: AppImage works on most distributions. If you build locally, a newer libstdc++ (GLIBCXX_3.4.29+) may be required — use CI or the Docker builder for widest compatibility.

Where to download
- GitHub Releases (recommended): https://github.com/MuhammadOwais268/business-email-app-destop/releases
- CI Artifacts (Actions → select run → Artifacts → download `linux-release` / `windows-release` ZIP) if a Release is not attached.

Windows installation options
- NSIS installer `.exe` (recommended for non-technical users)
	1. Download `BusinessEmail-Setup-x.y.z.exe` from Releases.
	2. Double-click and follow the installer UI.
	3. Run the app from the Start Menu.

- Portable `.zip` (tech-savvy users)
	1. Download and unzip the portable archive.
	2. Open PowerShell in the folder and run the helper to see logs:
```powershell
.\scripts\run-windows.ps1 -ExePath .\business-email-electron.exe
```

Linux installation options
- AppImage (plug-and-play)
	1. Download `BusinessEmail-<version>.AppImage` from Releases.
	2. Make it executable and run:
```bash
chmod +x BusinessEmail-<version>.AppImage
./BusinessEmail-<version>.AppImage
```

- `.deb` (Ubuntu/Debian native package)
	1. Download `business-email-electron_<version>_amd64.deb`.
	2. Install:
```bash
sudo dpkg -i business-email-electron_<version>_amd64.deb
sudo apt -f install   # fix missing deps
```

Verifying the installation
- Health endpoint: after the app starts, the bundled backend listens on `http://127.0.0.1:5678/health` and should return `ok`.
	- Quick check (Linux):
```bash
curl -sS http://127.0.0.1:5678/health
```
- Check the app/process:
	- Linux: `ps aux | grep business-email` or `ss -ltnp | grep 5678`
	- Windows: Task Manager or `Get-Process` in PowerShell.

Checksums and security
- Always publish SHA256 checksums with each release and verify them locally:
```bash
sha256sum BusinessEmail-<version>.AppImage > BusinessEmail-<version>.AppImage.sha256
sha256sum business-email-electron_<version>_amd64.deb > business-email-electron_<version>_amd64.deb.sha256
```
- Windows installers should be code-signed to avoid SmartScreen warnings — provide a PFX certificate and configure `electron-builder` when you are ready to sign releases.

Common install problems & quick fixes
- AppImage won't start: ensure executable bit is set (`chmod +x`) and run from terminal to see stdout/stderr.
- `.deb` missing dependencies: run `sudo apt -f install` after `dpkg -i`.
- SmartScreen blocks `.exe`: instruct recipients to use "More info" → "Run anyway" or sign the installer.
- GLIBCXX errors when running locally-built binaries: build artifacts in CI or use the Docker builder image to produce widely compatible artifacts.

If you'd like, I can add a small Release template and checklist (include checksums, platform notes, and a short install guide) that you can paste into each GitHub Release description. Tell me and I'll add it to the repo.
