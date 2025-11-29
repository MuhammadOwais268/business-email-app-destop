const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let backendProc = null;

function waitForPort(host, port, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function attempt() {
      const sock = new net.Socket();
      sock.setTimeout(1000);
      sock.once('connect', () => {
        sock.destroy();
        resolve(true);
      });
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(attempt, 200);
      });
      sock.once('timeout', () => {
        sock.destroy();
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(attempt, 200);
      });
      sock.connect(port, host);
    })();
  });
}

function startBundledBackend() {
  try {
    const execName = process.platform === 'win32' ? 'server.exe' : 'server';
    const backendPath = path.join(process.resourcesPath, 'backend', execName);
    // Only attempt to start if the file exists
    const fs = require('fs');
    if (!fs.existsSync(backendPath)) {
      console.log('Bundled backend not found at', backendPath);
      return Promise.resolve();
    }

    backendProc = spawn(backendPath, [], {
      cwd: path.dirname(backendPath),
      env: { ...process.env },
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    backendProc.stdout.on('data', (d) => console.log('[backend]', d.toString()));
    backendProc.stderr.on('data', (d) => console.error('[backend]', d.toString()));

    // wait for local health endpoint
    return waitForPort('127.0.0.1', 5678, 8000).catch((err) => {
      console.warn('Backend did not become ready in time:', err.message);
    });
  } catch (e) {
    console.error('Failed to start bundled backend', e);
    return Promise.resolve();
  }
}

function startDevBackend() {
  try {
    const backendPath = path.join(__dirname, '../backend/server.js');
    backendProc = spawn('node', [backendPath], {
      cwd: path.dirname(backendPath),
      env: { ...process.env },
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    backendProc.stdout.on('data', (d) => console.log('[backend]', d.toString()));
    backendProc.stderr.on('data', (d) => console.error('[backend]', d.toString()));

    // wait for local health endpoint
    return waitForPort('127.0.0.1', 5678, 8000).catch((err) => {
      console.warn('Backend did not become ready in time:', err.message);
    });
  } catch (e) {
    console.error('Failed to start development backend', e);
    return Promise.resolve();
  }
}

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

app.whenReady().then(async () => {
  if (app.isPackaged) {
    // start bundled backend when packaged
    await startBundledBackend();
  } else {
    // start backend in development mode
    await startDevBackend();
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  if (backendProc) {
    console.log('Stopping backend server...');
    backendProc.kill();
  }
});
