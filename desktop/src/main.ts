import { app, BrowserWindow, session } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import log from "electron-log";
import { generateSecret, startServer, stopServer } from "./server";

// Single source of truth for server URL
function getServerUrl(port: number): string {
  return app.isPackaged
    ? `http://127.0.0.1:${port}`
    : `http://localhost:${port}`;
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let serverPort = 0;

const createWindow = async () => {
  // Generate auth secret and start the embedded Nitro server
  const secret = generateSecret();
  try {
    serverPort = await startServer(secret);
    log.info(`Server available on port ${serverPort}`);
  } catch (error) {
    log.error("Failed to start server:", error);
    app.quit();
    return;
  }

  // Much of the code below is for security. See Electron's security best practices for detail.
  // https://www.electronjs.org/docs/latest/tutorial/security)

  const serverUrl = getServerUrl(serverPort);

  // Inject auth header into all requests to our server
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${serverUrl}/*`] },
    (details, callback) => {
      details.requestHeaders["X-Electron-Auth"] = secret;
      callback({ requestHeaders: details.requestHeaders });
    },
  );

  // Security: Deny all permission requests by default
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      log.warn("Denied permission request:", permission);
      callback(false); // Deny all by default
    },
  );

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Security: Restrict navigation to localhost only
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const parsedUrl = new URL(url);
    // Only allow navigation to localhost/127.0.0.1
    if (!["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
      event.preventDefault();
      log.warn("Blocked navigation to:", url);
    }
  });

  // Security: Control new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const parsedUrl = new URL(url);
    // Deny all new windows, or only allow specific localhost URLs
    if (["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
      return { action: "allow" };
    }
    log.warn("Blocked window.open to:", url);
    return { action: "deny" };
  });

  // Load from the server
  mainWindow.loadURL(serverUrl);
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", async () => {
  await stopServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", async () => {
  await stopServer();
});
