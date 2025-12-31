import { app, BrowserWindow, session } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { startServer, stopServer } from './server';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let serverPort: number = 0;

const createWindow = async () => {
  // Start the embedded Nitro server (or get dev server port)
  try {
    serverPort = await startServer();
    console.log(`Server available on port ${serverPort}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    app.quit();
    return;
  }

  // Security: Deny all permission requests by default
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    console.warn('Denied permission request:', permission);
    callback(false); // Deny all by default
  });

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Security: Restrict navigation to localhost only
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    // Only allow navigation to localhost/127.0.0.1
    if (!['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
      event.preventDefault();
      console.warn('Blocked navigation to:', url);
    }
  });

  // Security: Control new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const parsedUrl = new URL(url);
    // Deny all new windows, or only allow specific localhost URLs
    if (['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
      return { action: 'allow' };
    }
    console.warn('Blocked window.open to:', url);
    return { action: 'deny' };
  });

  // Load from the server
  if (!app.isPackaged) {
    // Development: Use web-ui's Vite dev server
    mainWindow.loadURL(`http://localhost:${serverPort}`);
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Use embedded Nitro server
    mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  await stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  await stopServer();
});
