import crypto from "node:crypto";
import path from "node:path";
import { app, utilityProcess, type UtilityProcess } from "electron";
import getPort from "get-port";
import log from "electron-log";

export function generateSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

let nitroProcess: UtilityProcess | null = null;

export async function startServer(secret: string): Promise<number> {
  const isDev = !app.isPackaged;

  if (isDev) {
    // In development, web-ui runs its own dev server on port 3000
    // We don't start a server here, just return the port where web-ui is running
    // ELECTRON_AUTH is left off so using web-ui in a browser still works.
    return 3000;
  }

  // Get available port for production, preferring 3000
  const serverPort = await getPort({ port: 3000 });

  // Production: Start embedded Nitro server as utility process
  const serverDir = path.join(process.resourcesPath, ".output", "server");
  const workerPath = path.join(__dirname, "nitro-worker.js");

  // See Nitro Node.js Runtime docs for how to use the server built by web-ui/
  // https://nitro.build/deploy/runtimes/node
  nitroProcess = utilityProcess.fork(workerPath, [], {
    env: {
      ...process.env,
      ELECTRON_APP_PATH: app.getPath("userData"),
      NODE_ENV: "production",
      ELECTRON_AUTH_REQUIRED: "true",
      ELECTRON_AUTH_SECRET: secret,
      NITRO_PORT: serverPort.toString(),
      NITRO_HOST: "127.0.0.1",
      NITRO_SERVER_DIR: serverDir,
    },
    stdio: "pipe",
  });

  // Pipe stdout/stderr to electron-log
  nitroProcess.stdout?.on("data", (data: Buffer) => {
    const str = data.toString().trim();
    if (str) log.info("[nitro]", str);
  });

  nitroProcess.stderr?.on("data", (data: Buffer) => {
    const str = data.toString().trim();
    if (str) log.error("[nitro]", str);
  });

  nitroProcess.on("spawn", () => {
    log.info("[nitro] Utility process spawned");
  });

  nitroProcess.on("exit", (code) => {
    log.info(`[nitro] Process exited with code ${code}`);
    nitroProcess = null;
  });

  await waitForServer(serverPort);

  log.info(`Nitro server started on 127.0.0.1:${serverPort}`);
  return serverPort;
}

async function waitForServer(port: number, maxAttempts = 50): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      log.info(`Server not ready yet on port ${port}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server failed to start on port ${port}`);
}

export async function stopServer(): Promise<void> {
  if (nitroProcess) {
    nitroProcess.kill();
    nitroProcess = null;
  }
}
