# Electron Security Audit Prompt

You are conducting a comprehensive security audit of an Electron application. Investigate the codebase for each of the 20 security topics from the official Electron security documentation and produce a detailed proposal of changes.

## Instructions

For each security topic below:
1. Search the codebase for relevant patterns, configurations, and code
2. Identify any violations or areas of concern
3. Document your findings with specific file paths and line numbers

## Security Topics to Investigate

### 1. Only Load Secure Content
**Search for:** HTTP URLs, insecure protocol usage
- Check `loadURL()` calls for `http://` instead of `https://`
- Search HTML files for `<script src="http://...">` or `<link href="http://...">` 
- Look for `ws://` instead of `wss://`, `ftp://` instead of `ftps://`
- Check for any hardcoded insecure URLs in configuration files

### 2. Node.js Integration for Remote Content
**Search for:** nodeIntegration settings in BrowserWindow configurations
- Find all `new BrowserWindow()` calls and check `webPreferences`
- Look for `nodeIntegration: true` especially where remote content is loaded
- Check for `nodeIntegrationInWorker: true`
- Verify that windows loading remote URLs have Node.js integration disabled
- Check `<webview>` tags for `nodeIntegration` attribute

### 3. Context Isolation
**Search for:** contextIsolation settings
- Find all `BrowserWindow` and `WebContentsView` configurations
- Look for `contextIsolation: false` (should be `true` or omitted for default)
- Verify preload scripts use `contextBridge` properly
- Check that renderer code doesn't assume access to Node.js globals

### 4. Process Sandboxing
**Search for:** sandbox settings
- Look for `sandbox: false` in webPreferences
- Check if sandboxing is enabled globally via `app.enableSandbox()`
- Verify no renderer processes are unsandboxed unnecessarily
- Note: disabling contextIsolation also disables sandboxing

### 5. Session Permission Requests
**Search for:** Permission handling implementation
- Look for `setPermissionRequestHandler()` usage
- Check if permissions (notifications, geolocation, camera, etc.) are handled explicitly
- Verify URLs are validated before granting permissions
- Look for any sessions loading remote content without permission handlers

### 6. webSecurity Setting
**Search for:** webSecurity disabled
- Find `webSecurity: false` in any BrowserWindow configuration
- Check `<webview>` tags for `disablewebsecurity` attribute
- This should never be disabled in production

### 7. Content Security Policy (CSP)
**Search for:** CSP implementation
- Check for `<meta http-equiv="Content-Security-Policy">` in HTML files
- Look for CSP headers set via `webRequest.onHeadersReceived()`
- Verify CSP rules are restrictive (e.g., `script-src 'self'`)
- Flag overly permissive CSP like `'*'` or `'unsafe-inline'` / `'unsafe-eval'`

### 8. allowRunningInsecureContent
**Search for:** Mixed content settings
- Look for `allowRunningInsecureContent: true` in webPreferences
- This should never be enabled

### 9. Experimental Features
**Search for:** Experimental Chromium features
- Find `experimentalFeatures: true` in webPreferences
- Document any usage and assess if truly necessary

### 10. enableBlinkFeatures
**Search for:** Blink feature flags
- Look for `enableBlinkFeatures` in webPreferences
- Document which features are enabled and why

### 11. WebView allowpopups
**Search for:** WebView popup permissions
- Find `<webview>` tags with `allowpopups` attribute
- Assess if popup creation is necessary

### 12. WebView Options Verification
**Search for:** WebView creation handling
- Look for `will-attach-webview` event handlers
- Check if webPreferences are validated before WebView creation
- Verify preload scripts and URLs are validated

### 13. Navigation Restrictions
**Search for:** Navigation handling
- Look for `will-navigate` event handlers
- Check if navigation is restricted to known/trusted URLs
- Verify URL validation uses proper URL parsing (not just string comparison)
- Look for `app.on('web-contents-created')` handlers

### 14. New Window Creation
**Search for:** Window creation controls
- Look for `setWindowOpenHandler()` implementations
- Check if new window creation is restricted
- Verify URLs are validated before allowing window creation

### 15. shell.openExternal Usage
**Search for:** External URL/file opening
- Find all `shell.openExternal()` calls
- Check if user-controlled data is passed to `openExternal()`
- Verify URLs are validated/allowlisted before opening

### 16. Electron Version
**Search for:** Electron version in use
- Check `package.json` for Electron version
- Compare against latest stable release
- Note any known vulnerabilities in the current version

### 17. IPC Message Sender Validation
**Search for:** IPC handler implementations
- Find all `ipcMain.handle()` and `ipcMain.on()` calls
- Check if `event.senderFrame` or `event.sender` is validated
- Verify sensitive operations validate the sender's origin
- Look for handlers that return sensitive data without validation

### 18. file:// Protocol Usage
**Search for:** File protocol usage
- Look for `loadFile()` or `loadURL('file://...')` calls
- Check for custom protocol registration via `protocol.handle()`
- Assess if file:// can be replaced with a custom protocol

### 19. Electron Fuses
**Search for:** Fuse configuration
- Check build configuration for `@electron/fuses` usage
- Look for fuse settings like `runAsNode`, `nodeCliInspect`
- Review which fuses could be disabled for additional security

### 20. Exposed Electron APIs
**Search for:** API exposure in preload scripts
- Find all `contextBridge.exposeInMainWorld()` calls
- Check for raw `ipcRenderer` exposure (dangerous)
- Verify callbacks don't leak IPC event objects
- Ensure only necessary, sanitized APIs are exposed

### 21. Update Topics
**Read** [Electron's latest security best practices](https://www.electronjs.org/docs/latest/tutorial/security)
- Is there anything missing from this prompt?
- Is anything in this prompt out of date?
- Suggest prompt updates

## Output Format

For each topic, provide:

```markdown
## [Topic Number]. [Topic Name]

### Current State
- Files examined: [list of relevant files]
- Findings: [what you found]

### Issues Identified
1. [Issue description]
   - File: [path/to/file.js]
   - Line: [line number]
   - Code: `[problematic code snippet]`

### Risk Level
[Critical / High / Medium / Low / None]

### Notes
[Any additional context or recommendations]
```

## Final Deliverable

After investigating all 20 topics, provide:

1. **Executive Summary**: Overview of security posture with critical findings highlighted
2. **Priority Matrix**: Issues ranked by risk level and effort to fix

Begin the audit by exploring the project structure to understand the codebase layout, then systematically investigate each security topic.
