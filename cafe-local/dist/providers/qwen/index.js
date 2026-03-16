// ../node_modules/open/index.js
import process6 from "node:process";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify as promisify5 } from "node:util";
import childProcess from "node:child_process";
import fs5, { constants as fsConstants2 } from "node:fs/promises";

// ../node_modules/wsl-utils/index.js
import process2 from "node:process";
import fs4, { constants as fsConstants } from "node:fs/promises";

// ../node_modules/is-wsl/index.js
import process from "node:process";
import os from "node:os";
import fs3 from "node:fs";

// ../node_modules/is-inside-container/index.js
import fs2 from "node:fs";

// ../node_modules/is-docker/index.js
import fs from "node:fs";
var isDockerCached;
function hasDockerEnv() {
  try {
    fs.statSync("/.dockerenv");
    return true;
  } catch {
    return false;
  }
}
function hasDockerCGroup() {
  try {
    return fs.readFileSync("/proc/self/cgroup", "utf8").includes("docker");
  } catch {
    return false;
  }
}
function isDocker() {
  if (isDockerCached === void 0) {
    isDockerCached = hasDockerEnv() || hasDockerCGroup();
  }
  return isDockerCached;
}

// ../node_modules/is-inside-container/index.js
var cachedResult;
var hasContainerEnv = () => {
  try {
    fs2.statSync("/run/.containerenv");
    return true;
  } catch {
    return false;
  }
};
function isInsideContainer() {
  if (cachedResult === void 0) {
    cachedResult = hasContainerEnv() || isDocker();
  }
  return cachedResult;
}

// ../node_modules/is-wsl/index.js
var isWsl = () => {
  if (process.platform !== "linux") {
    return false;
  }
  if (os.release().toLowerCase().includes("microsoft")) {
    if (isInsideContainer()) {
      return false;
    }
    return true;
  }
  try {
    if (fs3.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft")) {
      return !isInsideContainer();
    }
  } catch {
  }
  if (fs3.existsSync("/proc/sys/fs/binfmt_misc/WSLInterop") || fs3.existsSync("/run/WSL")) {
    return !isInsideContainer();
  }
  return false;
};
var is_wsl_default = process.env.__IS_WSL_TEST__ ? isWsl : isWsl();

// ../node_modules/wsl-utils/index.js
var wslDrivesMountPoint = /* @__PURE__ */ (() => {
  const defaultMountPoint = "/mnt/";
  let mountPoint;
  return async function() {
    if (mountPoint) {
      return mountPoint;
    }
    const configFilePath = "/etc/wsl.conf";
    let isConfigFileExists = false;
    try {
      await fs4.access(configFilePath, fsConstants.F_OK);
      isConfigFileExists = true;
    } catch {
    }
    if (!isConfigFileExists) {
      return defaultMountPoint;
    }
    const configContent = await fs4.readFile(configFilePath, { encoding: "utf8" });
    const configMountPoint = /(?<!#.*)root\s*=\s*(?<mountPoint>.*)/g.exec(configContent);
    if (!configMountPoint) {
      return defaultMountPoint;
    }
    mountPoint = configMountPoint.groups.mountPoint.trim();
    mountPoint = mountPoint.endsWith("/") ? mountPoint : `${mountPoint}/`;
    return mountPoint;
  };
})();
var powerShellPathFromWsl = async () => {
  const mountPoint = await wslDrivesMountPoint();
  return `${mountPoint}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`;
};
var powerShellPath = async () => {
  if (is_wsl_default) {
    return powerShellPathFromWsl();
  }
  return `${process2.env.SYSTEMROOT || process2.env.windir || String.raw`C:\Windows`}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
};

// ../node_modules/define-lazy-prop/index.js
function defineLazyProperty(object, propertyName, valueGetter) {
  const define = (value) => Object.defineProperty(object, propertyName, { value, enumerable: true, writable: true });
  Object.defineProperty(object, propertyName, {
    configurable: true,
    enumerable: true,
    get() {
      const result = valueGetter();
      define(result);
      return result;
    },
    set(value) {
      define(value);
    }
  });
  return object;
}

// ../node_modules/default-browser/index.js
import { promisify as promisify4 } from "node:util";
import process5 from "node:process";
import { execFile as execFile4 } from "node:child_process";

// ../node_modules/default-browser-id/index.js
import { promisify } from "node:util";
import process3 from "node:process";
import { execFile } from "node:child_process";
var execFileAsync = promisify(execFile);
async function defaultBrowserId() {
  if (process3.platform !== "darwin") {
    throw new Error("macOS only");
  }
  const { stdout } = await execFileAsync("defaults", ["read", "com.apple.LaunchServices/com.apple.launchservices.secure", "LSHandlers"]);
  const match = /LSHandlerRoleAll = "(?!-)(?<id>[^"]+?)";\s+?LSHandlerURLScheme = (?:http|https);/.exec(stdout);
  const browserId = match?.groups.id ?? "com.apple.Safari";
  if (browserId === "com.apple.safari") {
    return "com.apple.Safari";
  }
  return browserId;
}

// ../node_modules/run-applescript/index.js
import process4 from "node:process";
import { promisify as promisify2 } from "node:util";
import { execFile as execFile2, execFileSync } from "node:child_process";
var execFileAsync2 = promisify2(execFile2);
async function runAppleScript(script, { humanReadableOutput = true, signal } = {}) {
  if (process4.platform !== "darwin") {
    throw new Error("macOS only");
  }
  const outputArguments = humanReadableOutput ? [] : ["-ss"];
  const execOptions = {};
  if (signal) {
    execOptions.signal = signal;
  }
  const { stdout } = await execFileAsync2("osascript", ["-e", script, outputArguments], execOptions);
  return stdout.trim();
}

// ../node_modules/bundle-name/index.js
async function bundleName(bundleId) {
  return runAppleScript(`tell application "Finder" to set app_path to application file id "${bundleId}" as string
tell application "System Events" to get value of property list item "CFBundleName" of property list file (app_path & ":Contents:Info.plist")`);
}

// ../node_modules/default-browser/windows.js
import { promisify as promisify3 } from "node:util";
import { execFile as execFile3 } from "node:child_process";
var execFileAsync3 = promisify3(execFile3);
var windowsBrowserProgIds = {
  MSEdgeHTM: { name: "Edge", id: "com.microsoft.edge" },
  // The missing `L` is correct.
  MSEdgeBHTML: { name: "Edge Beta", id: "com.microsoft.edge.beta" },
  MSEdgeDHTML: { name: "Edge Dev", id: "com.microsoft.edge.dev" },
  AppXq0fevzme2pys62n3e0fbqa7peapykr8v: { name: "Edge", id: "com.microsoft.edge.old" },
  ChromeHTML: { name: "Chrome", id: "com.google.chrome" },
  ChromeBHTML: { name: "Chrome Beta", id: "com.google.chrome.beta" },
  ChromeDHTML: { name: "Chrome Dev", id: "com.google.chrome.dev" },
  ChromiumHTM: { name: "Chromium", id: "org.chromium.Chromium" },
  BraveHTML: { name: "Brave", id: "com.brave.Browser" },
  BraveBHTML: { name: "Brave Beta", id: "com.brave.Browser.beta" },
  BraveDHTML: { name: "Brave Dev", id: "com.brave.Browser.dev" },
  BraveSSHTM: { name: "Brave Nightly", id: "com.brave.Browser.nightly" },
  FirefoxURL: { name: "Firefox", id: "org.mozilla.firefox" },
  OperaStable: { name: "Opera", id: "com.operasoftware.Opera" },
  VivaldiHTM: { name: "Vivaldi", id: "com.vivaldi.Vivaldi" },
  "IE.HTTP": { name: "Internet Explorer", id: "com.microsoft.ie" }
};
var _windowsBrowserProgIdMap = new Map(Object.entries(windowsBrowserProgIds));
var UnknownBrowserError = class extends Error {
};
async function defaultBrowser(_execFileAsync = execFileAsync3) {
  const { stdout } = await _execFileAsync("reg", [
    "QUERY",
    " HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice",
    "/v",
    "ProgId"
  ]);
  const match = /ProgId\s*REG_SZ\s*(?<id>\S+)/.exec(stdout);
  if (!match) {
    throw new UnknownBrowserError(`Cannot find Windows browser in stdout: ${JSON.stringify(stdout)}`);
  }
  const { id } = match.groups;
  const dotIndex = id.lastIndexOf(".");
  const hyphenIndex = id.lastIndexOf("-");
  const baseIdByDot = dotIndex === -1 ? void 0 : id.slice(0, dotIndex);
  const baseIdByHyphen = hyphenIndex === -1 ? void 0 : id.slice(0, hyphenIndex);
  return windowsBrowserProgIds[id] ?? windowsBrowserProgIds[baseIdByDot] ?? windowsBrowserProgIds[baseIdByHyphen] ?? { name: id, id };
}

// ../node_modules/default-browser/index.js
var execFileAsync4 = promisify4(execFile4);
var titleize = (string) => string.toLowerCase().replaceAll(/(?:^|\s|-)\S/g, (x) => x.toUpperCase());
async function defaultBrowser2() {
  if (process5.platform === "darwin") {
    const id = await defaultBrowserId();
    const name = await bundleName(id);
    return { name, id };
  }
  if (process5.platform === "linux") {
    const { stdout } = await execFileAsync4("xdg-mime", ["query", "default", "x-scheme-handler/http"]);
    const id = stdout.trim();
    const name = titleize(id.replace(/.desktop$/, "").replace("-", " "));
    return { name, id };
  }
  if (process5.platform === "win32") {
    return defaultBrowser();
  }
  throw new Error("Only macOS, Linux, and Windows are supported");
}

// ../node_modules/open/index.js
var execFile5 = promisify5(childProcess.execFile);
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var localXdgOpenPath = path.join(__dirname, "xdg-open");
var { platform, arch } = process6;
async function getWindowsDefaultBrowserFromWsl() {
  const powershellPath = await powerShellPath();
  const rawCommand = String.raw`(Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice").ProgId`;
  const encodedCommand = Buffer.from(rawCommand, "utf16le").toString("base64");
  const { stdout } = await execFile5(
    powershellPath,
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-EncodedCommand",
      encodedCommand
    ],
    { encoding: "utf8" }
  );
  const progId = stdout.trim();
  const browserMap = {
    ChromeHTML: "com.google.chrome",
    BraveHTML: "com.brave.Browser",
    MSEdgeHTM: "com.microsoft.edge",
    FirefoxURL: "org.mozilla.firefox"
  };
  return browserMap[progId] ? { id: browserMap[progId] } : {};
}
var pTryEach = async (array, mapper) => {
  let latestError;
  for (const item of array) {
    try {
      return await mapper(item);
    } catch (error) {
      latestError = error;
    }
  }
  throw latestError;
};
var baseOpen = async (options) => {
  options = {
    wait: false,
    background: false,
    newInstance: false,
    allowNonzeroExitCode: false,
    ...options
  };
  if (Array.isArray(options.app)) {
    return pTryEach(options.app, (singleApp) => baseOpen({
      ...options,
      app: singleApp
    }));
  }
  let { name: app, arguments: appArguments = [] } = options.app ?? {};
  appArguments = [...appArguments];
  if (Array.isArray(app)) {
    return pTryEach(app, (appName) => baseOpen({
      ...options,
      app: {
        name: appName,
        arguments: appArguments
      }
    }));
  }
  if (app === "browser" || app === "browserPrivate") {
    const ids = {
      "com.google.chrome": "chrome",
      "google-chrome.desktop": "chrome",
      "com.brave.Browser": "brave",
      "org.mozilla.firefox": "firefox",
      "firefox.desktop": "firefox",
      "com.microsoft.msedge": "edge",
      "com.microsoft.edge": "edge",
      "com.microsoft.edgemac": "edge",
      "microsoft-edge.desktop": "edge"
    };
    const flags = {
      chrome: "--incognito",
      brave: "--incognito",
      firefox: "--private-window",
      edge: "--inPrivate"
    };
    const browser = is_wsl_default ? await getWindowsDefaultBrowserFromWsl() : await defaultBrowser2();
    if (browser.id in ids) {
      const browserName = ids[browser.id];
      if (app === "browserPrivate") {
        appArguments.push(flags[browserName]);
      }
      return baseOpen({
        ...options,
        app: {
          name: apps[browserName],
          arguments: appArguments
        }
      });
    }
    throw new Error(`${browser.name} is not supported as a default browser`);
  }
  let command;
  const cliArguments = [];
  const childProcessOptions = {};
  if (platform === "darwin") {
    command = "open";
    if (options.wait) {
      cliArguments.push("--wait-apps");
    }
    if (options.background) {
      cliArguments.push("--background");
    }
    if (options.newInstance) {
      cliArguments.push("--new");
    }
    if (app) {
      cliArguments.push("-a", app);
    }
  } else if (platform === "win32" || is_wsl_default && !isInsideContainer() && !app) {
    command = await powerShellPath();
    cliArguments.push(
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-EncodedCommand"
    );
    if (!is_wsl_default) {
      childProcessOptions.windowsVerbatimArguments = true;
    }
    const encodedArguments = ["Start"];
    if (options.wait) {
      encodedArguments.push("-Wait");
    }
    if (app) {
      encodedArguments.push(`"\`"${app}\`""`);
      if (options.target) {
        appArguments.push(options.target);
      }
    } else if (options.target) {
      encodedArguments.push(`"${options.target}"`);
    }
    if (appArguments.length > 0) {
      appArguments = appArguments.map((argument) => `"\`"${argument}\`""`);
      encodedArguments.push("-ArgumentList", appArguments.join(","));
    }
    options.target = Buffer.from(encodedArguments.join(" "), "utf16le").toString("base64");
  } else {
    if (app) {
      command = app;
    } else {
      const isBundled = !__dirname || __dirname === "/";
      let exeLocalXdgOpen = false;
      try {
        await fs5.access(localXdgOpenPath, fsConstants2.X_OK);
        exeLocalXdgOpen = true;
      } catch {
      }
      const useSystemXdgOpen = process6.versions.electron ?? (platform === "android" || isBundled || !exeLocalXdgOpen);
      command = useSystemXdgOpen ? "xdg-open" : localXdgOpenPath;
    }
    if (appArguments.length > 0) {
      cliArguments.push(...appArguments);
    }
    if (!options.wait) {
      childProcessOptions.stdio = "ignore";
      childProcessOptions.detached = true;
    }
  }
  if (platform === "darwin" && appArguments.length > 0) {
    cliArguments.push("--args", ...appArguments);
  }
  if (options.target) {
    cliArguments.push(options.target);
  }
  const subprocess = childProcess.spawn(command, cliArguments, childProcessOptions);
  if (options.wait) {
    return new Promise((resolve, reject) => {
      subprocess.once("error", reject);
      subprocess.once("close", (exitCode) => {
        if (!options.allowNonzeroExitCode && exitCode > 0) {
          reject(new Error(`Exited with code ${exitCode}`));
          return;
        }
        resolve(subprocess);
      });
    });
  }
  subprocess.unref();
  return subprocess;
};
var open = (target, options) => {
  if (typeof target !== "string") {
    throw new TypeError("Expected a `target`");
  }
  return baseOpen({
    ...options,
    target
  });
};
function detectArchBinary(binary) {
  if (typeof binary === "string" || Array.isArray(binary)) {
    return binary;
  }
  const { [arch]: archBinary } = binary;
  if (!archBinary) {
    throw new Error(`${arch} is not supported`);
  }
  return archBinary;
}
function detectPlatformBinary({ [platform]: platformBinary }, { wsl }) {
  if (wsl && is_wsl_default) {
    return detectArchBinary(wsl);
  }
  if (!platformBinary) {
    throw new Error(`${platform} is not supported`);
  }
  return detectArchBinary(platformBinary);
}
var apps = {};
defineLazyProperty(apps, "chrome", () => detectPlatformBinary({
  darwin: "google chrome",
  win32: "chrome",
  linux: ["google-chrome", "google-chrome-stable", "chromium"]
}, {
  wsl: {
    ia32: "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    x64: ["/mnt/c/Program Files/Google/Chrome/Application/chrome.exe", "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"]
  }
}));
defineLazyProperty(apps, "brave", () => detectPlatformBinary({
  darwin: "brave browser",
  win32: "brave",
  linux: ["brave-browser", "brave"]
}, {
  wsl: {
    ia32: "/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe",
    x64: ["/mnt/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe", "/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe"]
  }
}));
defineLazyProperty(apps, "firefox", () => detectPlatformBinary({
  darwin: "firefox",
  win32: String.raw`C:\Program Files\Mozilla Firefox\firefox.exe`,
  linux: "firefox"
}, {
  wsl: "/mnt/c/Program Files/Mozilla Firefox/firefox.exe"
}));
defineLazyProperty(apps, "edge", () => detectPlatformBinary({
  darwin: "microsoft edge",
  win32: "msedge",
  linux: ["microsoft-edge", "microsoft-edge-dev"]
}, {
  wsl: "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
}));
defineLazyProperty(apps, "browser", () => "browser");
defineLazyProperty(apps, "browserPrivate", () => "browserPrivate");
var open_default = open;

// src/providers/qwen/qwen.provider.ts
import * as crypto from "crypto";
var QWEN_CLIENT_ID = "f0304373b74a44d2b584a3fb70ca9e56";
var QWEN_DEVICE_CODE_URL = "https://chat.qwen.ai/api/v1/oauth2/device/code";
var QWEN_TOKEN_URL = "https://chat.qwen.ai/api/v1/oauth2/token";
var QWEN_SCOPES = "openid profile email model.completion";
var QWEN_DEFAULT_API_BASE = "https://portal.qwen.ai";
var POLL_TIMEOUT_MS = 3e5;
var TOKEN_REFRESH_THRESHOLD_MS = 30 * 60 * 1e3;
var QWEN_DEFAULT_MODEL = "coder-model";
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}
function generateCodeChallenge(codeVerifier) {
  return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
}
var pendingAuth = null;
var cachedApiBase = QWEN_DEFAULT_API_BASE;
var QwenProvider = class {
  constructor() {
    this.type = "qwen";
    this.displayName = "Qwen";
  }
  /**
   * Check if Qwen is configured
   */
  isConfigured(config) {
    const qwenConfig = config["qwen"];
    return !!(qwenConfig?.loggedIn && qwenConfig?.accessToken);
  }
  /**
   * Get backend configuration for API calls
   */
  getBackendConfig(config) {
    const qwenConfig = config["qwen"];
    if (!qwenConfig?.loggedIn || !qwenConfig?.accessToken) {
      return null;
    }
    const apiBase = cachedApiBase || QWEN_DEFAULT_API_BASE;
    console.log("[QwenProvider] Using API endpoint:", apiBase);
    return {
      url: `${apiBase}/v1/chat/completions`,
      key: qwenConfig.accessToken,
      model: qwenConfig.model || QWEN_DEFAULT_MODEL,
      headers: {
        "User-Agent": "QwenCode/0.10.3 (darwin; arm64)",
        "X-DashScope-AuthType": "qwen-oauth",
        "X-DashScope-CacheControl": "enable",
        "X-DashScope-UserAgent": "QwenCode/0.10.3 (darwin; arm64)"
      },
      apiType: "chat_completions"
    };
  }
  /**
   * Get current model
   */
  getCurrentModel(config) {
    const qwenConfig = config["qwen"];
    return qwenConfig?.model || null;
  }
  /**
   * Get available models
   */
  async getAvailableModels(config) {
    const qwenConfig = config["qwen"];
    if (qwenConfig?.availableModels?.length) {
      return qwenConfig.availableModels;
    }
    return this.getDefaultModels();
  }
  /**
   * Default models - Qwen Code only supports a single unified model
   */
  getDefaultModels() {
    return ["coder-model"];
  }
  /**
   * Get user info from config
   */
  getUserInfo(config) {
    const qwenConfig = config["qwen"];
    return qwenConfig?.user || null;
  }
  // ========== OAuth Flow ==========
  /**
   * Start OAuth login flow
   */
  async startLogin() {
    try {
      console.log("[QwenProvider] Starting device code flow with PKCE");
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const response = await fetch(QWEN_DEVICE_CODE_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: QWEN_CLIENT_ID,
          scope: QWEN_SCOPES,
          code_challenge: codeChallenge,
          code_challenge_method: "S256"
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to request device code: ${response.status}`);
      }
      const data = await response.json();
      pendingAuth = {
        deviceCode: data.device_code,
        userCode: data.user_code,
        verificationUri: data.verification_uri,
        expiresAt: Date.now() + data.expires_in * 1e3,
        interval: Math.max(data.interval || 3, 3),
        codeVerifier
      };
      const loginUrl = `${data.verification_uri}?user_code=${data.user_code}&client=qwen-code`;
      await open_default(loginUrl);
      console.log("[QwenProvider] Device code flow started, user code:", data.user_code);
      return {
        success: true,
        data: {
          loginUrl,
          state: data.user_code,
          userCode: data.user_code,
          verificationUri: data.verification_uri
        }
      };
    } catch (error) {
      console.error("[QwenProvider] Start login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start login"
      };
    }
  }
  /**
   * Complete OAuth login by polling for token
   */
  async completeLogin(state) {
    if (!pendingAuth || pendingAuth.userCode !== state) {
      return {
        success: false,
        error: "No pending authentication or state mismatch"
      };
    }
    try {
      console.log("[QwenProvider] Polling for authorization...");
      const startTime = Date.now();
      while (Date.now() - startTime < POLL_TIMEOUT_MS) {
        if (Date.now() > pendingAuth.expiresAt) {
          pendingAuth = null;
          return {
            success: false,
            error: "Device code expired"
          };
        }
        await new Promise((resolve) => setTimeout(resolve, pendingAuth.interval * 1e3));
        const response = await fetch(QWEN_TOKEN_URL, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            client_id: QWEN_CLIENT_ID,
            device_code: pendingAuth.deviceCode,
            code_verifier: pendingAuth.codeVerifier
          })
        });
        const data = await response.json();
        if (data.status === "success" && data.access_token) {
          const accessToken = data.access_token;
          const refreshToken = data.refresh_token || "";
          const expiresIn = data.expires_in || 21600;
          const resourceUrl = data.resource_url || "portal.qwen.ai";
          cachedApiBase = `https://${resourceUrl}`;
          pendingAuth = null;
          console.log("[QwenProvider] Got access token, resource_url:", resourceUrl);
          const models = this.getDefaultModels();
          const modelNames = this.getModelDisplayNames(models);
          const result = {
            success: true,
            user: {
              name: "Qwen User"
            },
            _tokenData: {
              accessToken,
              refreshToken,
              expiresAt: Date.now() + expiresIn * 1e3,
              uid: ""
            },
            _availableModels: models,
            _modelNames: modelNames,
            _defaultModel: QWEN_DEFAULT_MODEL
          };
          return { success: true, data: result };
        }
        if (data.error === "authorization_pending") {
          continue;
        }
        if (data.error === "slow_down") {
          pendingAuth.interval += 2;
          continue;
        }
        if (data.error === "expired_token") {
          pendingAuth = null;
          return {
            success: false,
            error: "Device code expired. Please try again."
          };
        }
        if (data.error === "access_denied") {
          pendingAuth = null;
          return {
            success: false,
            error: "Access denied. User cancelled the authorization."
          };
        }
        if (!data.access_token && !data.error) {
          continue;
        }
        pendingAuth = null;
        return {
          success: false,
          error: data.error_description || data.error || "Unknown error"
        };
      }
      pendingAuth = null;
      return {
        success: false,
        error: "Timeout waiting for authorization"
      };
    } catch (error) {
      console.error("[QwenProvider] Complete login error:", error);
      pendingAuth = null;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to complete login"
      };
    }
  }
  /**
   * Refresh token
   */
  async refreshToken() {
    return { success: true };
  }
  /**
   * Check if token is valid
   */
  async checkToken() {
    return { success: true, data: { valid: true } };
  }
  /**
   * Logout
   */
  async logout() {
    pendingAuth = null;
    cachedApiBase = QWEN_DEFAULT_API_BASE;
    return { success: true };
  }
  // ========== Token Management (called by AISourceManager) ==========
  /**
   * Check token validity with config
   */
  checkTokenWithConfig(config) {
    const qwenConfig = config["qwen"];
    if (!qwenConfig?.accessToken || !qwenConfig.tokenExpires) {
      return { valid: false, needsRefresh: false };
    }
    const now = Date.now();
    const expiresIn = Math.max(0, qwenConfig.tokenExpires - now);
    return {
      valid: now < qwenConfig.tokenExpires,
      expiresIn,
      needsRefresh: now > qwenConfig.tokenExpires - TOKEN_REFRESH_THRESHOLD_MS
    };
  }
  /**
   * Refresh token with config
   * Uses rotating refresh tokens - each refresh returns a new refresh_token
   */
  async refreshTokenWithConfig(config) {
    const qwenConfig = config["qwen"];
    if (!qwenConfig?.refreshToken) {
      return {
        success: false,
        error: "No refresh token available"
      };
    }
    try {
      console.log("[QwenProvider] Refreshing token...");
      const response = await fetch(QWEN_TOKEN_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: QWEN_CLIENT_ID,
          refresh_token: qwenConfig.refreshToken
        })
      });
      const data = await response.json();
      if (data.status === "success" && data.access_token) {
        const expiresIn = data.expires_in || 21600;
        if (data.resource_url) {
          cachedApiBase = `https://${data.resource_url}`;
        }
        console.log("[QwenProvider] Token refreshed successfully");
        return {
          success: true,
          data: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || qwenConfig.refreshToken,
            expiresAt: Date.now() + expiresIn * 1e3
          }
        };
      }
      throw new Error(data.error_description || data.error || "Token refresh failed");
    } catch (error) {
      console.error("[QwenProvider] Token refresh error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed"
      };
    }
  }
  /**
   * Refresh config (fetch updated models, etc.)
   */
  async refreshConfig(config) {
    const qwenConfig = config["qwen"];
    if (!qwenConfig?.accessToken) {
      return { success: false, error: "Not logged in" };
    }
    const models = this.getDefaultModels();
    const modelNames = this.getModelDisplayNames(models);
    return {
      success: true,
      data: {
        "qwen": {
          ...qwenConfig,
          availableModels: models,
          modelNames
        }
      }
    };
  }
  // ========== Helper Methods ==========
  /**
   * Get model display names
   */
  getModelDisplayNames(models) {
    const displayNames = {
      "coder-model": "Qwen 3.5 Plus"
    };
    const result = {};
    for (const model of models) {
      result[model] = displayNames[model] || model;
    }
    return result;
  }
};
var providerInstance = null;
function getQwenProvider() {
  if (!providerInstance) {
    providerInstance = new QwenProvider();
  }
  return providerInstance;
}
export {
  QwenProvider,
  getQwenProvider
};
