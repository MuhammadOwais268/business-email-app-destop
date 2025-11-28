# Release checklist for BusinessEmail

Use this template when creating a GitHub Release. Paste into the release description and edit version-specific fields.

## Release {{version}} - Checklist

- [ ] Built artifacts produced by CI: AppImage, .deb, NSIS `.exe` and portable ZIP
- [ ] SHA256 checksums published and verified (attached as `checksums.sha256`)
- [ ] Release notes include: short summary, changes, known issues
- [ ] Attach binaries (AppImage, .deb, .exe) — CI should attach automatically on tag builds
- [ ] Verify Windows `.exe` by downloading from Actions and running on a clean Windows machine or VM
- [ ] If distributing widely: code-sign the Windows installer and re-run CI
- [ ] Add quick install instructions (link to README or include short steps)

## Quick install links
- AppImage: `BusinessEmail-<version>.AppImage`
- Debian: `business-email-electron_<version>_amd64.deb`
- Windows: `BusinessEmail-Setup-<version>.exe` (NSIS)

## Notes
- If you see GLIBCXX errors on Linux, prefer the AppImage produced by the CI runner or build using the provided Docker builder image for portability.
- Keep the `checksums.sha256` file attached to the release so recipients can verify integrity.
