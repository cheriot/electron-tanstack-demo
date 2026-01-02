import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers';

test('should launch packaged app and verify title', async () => {
  // Find the latest build in the out directory
  const latestBuild = findLatestBuild('out');

  // Parse the Electron app to get the executable path
  const appInfo = parseElectronApp(latestBuild);

  // Launch the packaged Electron app with args to enable remote debugging
  const electronApp = await electron.launch({
    executablePath: appInfo.executable,
    args: ['--remote-debugging-port=9222'],
    timeout: 60000,
  });

  // Get the first window (it may already be created)
  const window = await electronApp.firstWindow();

  // Wait for the page to load
  await window.waitForLoadState('domcontentloaded', { timeout: 30000 });

  // Verify the page title
  const title = await window.title();
  expect(title).toBe('TanStack Start Starter');

  // Close the app
  await electronApp.close();
});
