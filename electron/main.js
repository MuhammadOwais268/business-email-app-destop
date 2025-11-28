const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = 'http://localhost:5173';

  // In development, load the Vite dev server. In production (packaged), load the
  // built index.html from the app's resources.
  if (!app.isPackaged) {
    win.loadURL(devUrl);
    // helpful for debugging during development
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // packaged: index.html will be in the resources path
    const indexPath = path.join(__dirname, '../dist/index.html');
    win.loadFile(indexPath).catch((err) => {
      console.error('Failed to load index.html from', indexPath, err);
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
