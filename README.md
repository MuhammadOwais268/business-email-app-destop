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
