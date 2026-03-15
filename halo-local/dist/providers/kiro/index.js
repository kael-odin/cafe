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

// src/providers/kiro/kiro.provider.ts
import * as crypto from "crypto";
import * as http from "http";
import * as https from "https";
import * as os2 from "os";
import * as url from "url";

// src/providers/kiro/types.ts
var KIRO_MODELS = [
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    description: "Balanced performance for coding, writing, and general tasks"
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    description: "Fast responses for quick tasks and chat"
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    description: "Previous generation, still powerful and reliable"
  },
  {
    id: "claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    description: "Legacy model for backward compatibility"
  }
];
var DEFAULT_KIRO_MODEL = "claude-sonnet-4-5";
var KIRO_MODEL_NAMES = {
  "auto": "Auto",
  "claude-sonnet-4-5": "Claude Sonnet 4.5",
  "claude-haiku-4-5": "Claude Haiku 4.5",
  "claude-sonnet-4": "Claude Sonnet 4",
  "claude-opus-4-5": "Claude Opus 4.5",
  "claude-3.7-sonnet": "Claude 3.7 Sonnet",
  "deepseek-v3": "DeepSeek V3.2",
  "minimax-m2": "MiniMax M2.1",
  "qwen3-coder-next": "Qwen3 Coder Next"
};

// src/providers/kiro/kiro.provider.ts
var KIRO_AUTH_PORTAL_URL = "https://app.kiro.dev";
var KIRO_DEFAULT_REGION = "us-east-1";
var KIRO_REFRESH_URL_TEMPLATE = "https://prod.{region}.auth.desktop.kiro.dev/refreshToken";
var KIRO_TOKEN_URL_TEMPLATE = "https://prod.{region}.auth.desktop.kiro.dev/oauth/token";
var KIRO_API_HOST_TEMPLATE = "https://q.{region}.amazonaws.com";
var TOKEN_REFRESH_THRESHOLD_MS = 10 * 60 * 1e3;
var KIRO_CALLBACK_PORT = 3128;
var VALID_CALLBACK_PATHS = ["/oauth/callback", "/signin/callback"];
var CALLBACK_TIMEOUT_MS = 3e5;
var KIRO_IDE_VERSION = "0.7.45";
var HIDDEN_MODELS = {
  "claude-3.7-sonnet": "CLAUDE_3_7_SONNET_20250219_V1_0"
};
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}
function generateCodeChallenge(codeVerifier) {
  return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
}
function generateState() {
  return crypto.randomBytes(16).toString("hex");
}
function getMachineFingerprint() {
  try {
    const hostname2 = os2.hostname();
    const username = os2.userInfo().username;
    const uniqueString = `${hostname2}-${username}-kiro-gateway`;
    return crypto.createHash("sha256").update(uniqueString).digest("hex");
  } catch {
    return crypto.createHash("sha256").update("default-kiro-gateway").digest("hex");
  }
}
function getKiroApiHeaders(accessToken) {
  const fingerprint = getMachineFingerprint();
  return {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "User-Agent": `aws-sdk-js/1.0.27 ua/2.1 os/win32#10.0.19044 lang/js md/nodejs#22.21.1 api/codewhispererstreaming#1.0.27 m/E KiroIDE-${KIRO_IDE_VERSION}-${fingerprint}`,
    "x-amz-user-agent": `aws-sdk-js/1.0.27 KiroIDE-${KIRO_IDE_VERSION}-${fingerprint}`,
    "x-amzn-codewhisperer-optout": "true",
    "x-amzn-kiro-agent-mode": "vibe",
    "amz-sdk-invocation-id": crypto.randomUUID(),
    "amz-sdk-request": "attempt=1; max=3"
  };
}
function getRefreshHeaders() {
  const fingerprint = getMachineFingerprint();
  return {
    "Content-Type": "application/json",
    "User-Agent": `KiroIDE-${KIRO_IDE_VERSION}-${fingerprint}`
  };
}
function httpsRequest(urlStr, options) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: options.method,
        headers: options.headers
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk.toString();
        });
        res.on("end", () => {
          try {
            const data = body ? JSON.parse(body) : null;
            resolve({ statusCode: res.statusCode || 0, data });
          } catch {
            resolve({ statusCode: res.statusCode || 0, data: body });
          }
        });
      }
    );
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}
function resolveUrl(template, region) {
  return template.replace("{region}", region);
}
var pendingAuth = null;
var KiroProvider = class {
  constructor() {
    this.type = "kiro";
    this.displayName = "Kiro";
  }
  /**
   * Check if Kiro is configured
   */
  isConfigured(config) {
    const kiroConfig = config["kiro"];
    return !!(kiroConfig?.loggedIn && kiroConfig?.accessToken);
  }
  /**
   * Get backend configuration for API calls.
   *
   * Returns apiType: 'kiro' so the Halo router uses KiroAdapter, which speaks
   * the native Kiro/AWS CodeWhisperer protocol directly — no third-party proxy needed.
   *
   * profileArn is required for Social Login (Kiro Desktop auth) and is included
   * in every generateAssistantResponse payload.
   */
  getBackendConfig(config) {
    const kiroConfig = config["kiro"];
    if (!kiroConfig?.loggedIn || !kiroConfig?.accessToken) {
      return null;
    }
    const region = kiroConfig.region || KIRO_DEFAULT_REGION;
    const apiHost = resolveUrl(KIRO_API_HOST_TEMPLATE, region);
    return {
      url: `${apiHost}/generateAssistantResponse`,
      key: kiroConfig.accessToken,
      model: kiroConfig.model || DEFAULT_KIRO_MODEL,
      headers: getKiroApiHeaders(kiroConfig.accessToken),
      apiType: "kiro",
      profileArn: kiroConfig.profileArn
    };
  }
  /**
   * Get current model
   */
  getCurrentModel(config) {
    const kiroConfig = config["kiro"];
    return kiroConfig?.model || null;
  }
  /**
   * Get available models
   */
  async getAvailableModels(config) {
    const kiroConfig = config["kiro"];
    if (kiroConfig?.availableModels?.length) {
      return kiroConfig.availableModels;
    }
    return KIRO_MODELS.map((m) => m.id);
  }
  /**
   * Get user info from config
   */
  getUserInfo(config) {
    const kiroConfig = config["kiro"];
    return kiroConfig?.user || null;
  }
  // ========== OAuth Flow ==========
  /**
   * Start OAuth login flow
   *
   * Implements kiro-cli social login:
   * 1. Generate PKCE pair
   * 2. Start local callback server
   * 3. Open browser to Kiro auth portal
   */
  async startLogin() {
    try {
      console.log("[KiroProvider] Starting social login flow with PKCE");
      this.cleanupPendingAuth();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const state = generateState();
      const { server, port } = await this.startCallbackServer();
      pendingAuth = {
        state,
        codeVerifier,
        codeChallenge,
        callbackPort: port,
        server,
        expiresAt: Date.now() + CALLBACK_TIMEOUT_MS
      };
      const redirectUri = `http://localhost:${KIRO_CALLBACK_PORT}`;
      const loginUrl = `${KIRO_AUTH_PORTAL_URL}/signin?state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256&redirect_uri=${encodeURIComponent(redirectUri)}&redirect_from=kirocli`;
      await open_default(loginUrl);
      console.log("[KiroProvider] Login URL opened, waiting for callback on port", port);
      return {
        success: true,
        data: {
          loginUrl,
          state
        }
      };
    } catch (error) {
      console.error("[KiroProvider] Start login error:", error);
      this.cleanupPendingAuth();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start login"
      };
    }
  }
  /**
   * Complete OAuth login by waiting for callback
   */
  async completeLogin(state) {
    if (!pendingAuth || pendingAuth.state !== state) {
      return {
        success: false,
        error: "No pending authentication or state mismatch"
      };
    }
    try {
      console.log("[KiroProvider] Waiting for auth callback...");
      const tokenData = await this.waitForCallback();
      this.cleanupPendingAuth();
      console.log("[KiroProvider] Got tokens, fetching models...");
      const region = KIRO_DEFAULT_REGION;
      let availableModels;
      let modelNames;
      try {
        const result2 = await this.fetchModels(tokenData.accessToken, region, tokenData.profileArn);
        availableModels = result2.ids;
        modelNames = result2.names;
      } catch (err) {
        console.warn("[KiroProvider] Failed to fetch models, using defaults:", err);
        availableModels = KIRO_MODELS.map((m) => m.id);
        modelNames = { ...KIRO_MODEL_NAMES };
      }
      const defaultModel = availableModels.includes(DEFAULT_KIRO_MODEL) ? DEFAULT_KIRO_MODEL : availableModels[0] || DEFAULT_KIRO_MODEL;
      console.log("[KiroProvider] Login complete, models:", availableModels.length);
      const result = {
        success: true,
        user: {
          name: "Kiro User"
        },
        _tokenData: {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt,
          uid: ""
        },
        _availableModels: availableModels,
        _modelNames: modelNames,
        _defaultModel: defaultModel
      };
      return { success: true, data: result };
    } catch (error) {
      console.error("[KiroProvider] Complete login error:", error);
      this.cleanupPendingAuth();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to complete login"
      };
    }
  }
  /**
   * Refresh token (no-op, actual refresh uses refreshTokenWithConfig)
   */
  async refreshToken() {
    return { success: true };
  }
  /**
   * Check if token is valid (no-op, actual check uses checkTokenWithConfig)
   */
  async checkToken() {
    return { success: true, data: { valid: true } };
  }
  /**
   * Logout
   */
  async logout() {
    this.cleanupPendingAuth();
    console.log("[KiroProvider] Logout requested");
    return { success: true };
  }
  // ========== Token Management (called by AISourceManager) ==========
  /**
   * Check token validity with config
   */
  checkTokenWithConfig(config) {
    const kiroConfig = config["kiro"];
    if (!kiroConfig?.accessToken || !kiroConfig.tokenExpires) {
      return { valid: false, needsRefresh: false };
    }
    const now = Date.now();
    const expiresIn = Math.max(0, kiroConfig.tokenExpires - now);
    return {
      valid: now < kiroConfig.tokenExpires,
      expiresIn,
      needsRefresh: now > kiroConfig.tokenExpires - TOKEN_REFRESH_THRESHOLD_MS
    };
  }
  /**
   * Refresh token with config
   *
   * Uses Kiro Desktop auth endpoint:
   * POST https://prod.{region}.auth.desktop.kiro.dev/refreshToken
   * Body: { "refreshToken": "..." }
   * Headers: Content-Type: application/json, User-Agent: KiroIDE-{version}-{fingerprint}
   */
  async refreshTokenWithConfig(config) {
    const kiroConfig = config["kiro"];
    if (!kiroConfig?.refreshToken) {
      return {
        success: false,
        error: "No refresh token available"
      };
    }
    try {
      console.log("[KiroProvider] Refreshing token via Kiro Desktop endpoint...");
      const region = kiroConfig.region || KIRO_DEFAULT_REGION;
      const refreshUrl = resolveUrl(KIRO_REFRESH_URL_TEMPLATE, region);
      const response = await httpsRequest(refreshUrl, {
        method: "POST",
        headers: getRefreshHeaders(),
        body: JSON.stringify({
          refreshToken: kiroConfig.refreshToken
        })
      });
      if (response.statusCode !== 200 || !response.data?.accessToken) {
        throw new Error(`Token refresh failed: HTTP ${response.statusCode} - ${JSON.stringify(response.data)}`);
      }
      const data = response.data;
      const expiresIn = data.expiresIn || 3600;
      console.log("[KiroProvider] Token refreshed successfully, expires in", expiresIn, "seconds");
      return {
        success: true,
        data: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || kiroConfig.refreshToken,
          expiresAt: Date.now() + (expiresIn - 60) * 1e3
          // 60s buffer like kiro-gateway
        }
      };
    } catch (error) {
      console.error("[KiroProvider] Token refresh error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed"
      };
    }
  }
  /**
   * Refresh provider configuration (fetch updated models)
   */
  async refreshConfig(config) {
    const kiroConfig = config["kiro"];
    if (!kiroConfig?.loggedIn || !kiroConfig.accessToken) {
      return { success: false, error: "Not logged in" };
    }
    try {
      const region = kiroConfig.region || KIRO_DEFAULT_REGION;
      const { ids: availableModels, names: modelNames } = await this.fetchModels(
        kiroConfig.accessToken,
        region,
        kiroConfig.profileArn
      );
      let model = kiroConfig.model;
      if (!availableModels.includes(model)) {
        model = availableModels.includes(DEFAULT_KIRO_MODEL) ? DEFAULT_KIRO_MODEL : availableModels[0] || DEFAULT_KIRO_MODEL;
      }
      console.log(`[KiroProvider] Refreshed: ${availableModels.length} models, using: ${model}`);
      return {
        success: true,
        data: {
          kiro: {
            ...kiroConfig,
            availableModels,
            modelNames,
            model
          }
        }
      };
    } catch (error) {
      console.error("[KiroProvider] refreshConfig error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Refresh failed"
      };
    }
  }
  // ========== Internal Methods ==========
  /**
   * Start a local HTTP server to receive the OAuth callback.
   * Binds to 127.0.0.1:3128 (fixed port, same as kiro-cli).
   * Returns the server instance and the port number.
   */
  startCallbackServer() {
    return new Promise((resolve, reject) => {
      const server = http.createServer();
      server.listen(KIRO_CALLBACK_PORT, "127.0.0.1", () => {
        const addr = server.address();
        if (!addr || typeof addr === "string") {
          server.close();
          reject(new Error("Failed to bind callback server"));
          return;
        }
        console.log("[KiroProvider] Callback server started on port", addr.port);
        resolve({ server, port: addr.port });
      });
      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          reject(new Error(`Port ${KIRO_CALLBACK_PORT} is already in use. Please close any other application using this port.`));
        } else {
          reject(err);
        }
      });
    });
  }
  /**
   * Wait for the OAuth callback on the local server.
   *
   * Portal redirects based on login method:
   * - Social (Google/GitHub): http://localhost:3128/oauth/callback?code=...&state=...&login_option=google
   * - AWS IAM Identity Center: http://localhost:3128/signin/callback?code=...&state=...&login_option=awsidc
   * We then exchange code + code_verifier for tokens via POST /oauth/token.
   */
  waitForCallback() {
    return new Promise((resolve, reject) => {
      if (!pendingAuth) {
        reject(new Error("No pending authentication"));
        return;
      }
      const { server, state: expectedState, codeVerifier, callbackPort, expiresAt } = pendingAuth;
      const timeout = setTimeout(() => {
        reject(new Error("Login timeout - no callback received within 5 minutes"));
      }, expiresAt - Date.now());
      server.on("request", async (req, res) => {
        const reqUrl = url.parse(req.url || "", true);
        const callbackPath = reqUrl.pathname || "";
        if (!VALID_CALLBACK_PATHS.includes(callbackPath) || req.method !== "GET") {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        clearTimeout(timeout);
        console.log("[KiroProvider] Received callback on", callbackPath);
        const query = reqUrl.query;
        const code = query.code;
        const returnedState = query.state;
        if (!returnedState || returnedState !== expectedState) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8", "Connection": "close" });
          res.end("<h2>Login failed: state mismatch</h2>");
          reject(new Error(`OAuth state mismatch: expected "${expectedState}", got "${returnedState}"`));
          return;
        }
        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8", "Connection": "close" });
          res.end("<h2>Login failed: no authorization code</h2>");
          reject(new Error("OAuth callback missing authorization code"));
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Connection": "close" });
        res.end(getSuccessHtml());
        try {
          const loginOption = query.login_option || "";
          let redirectUri = `http://localhost:${callbackPort}${callbackPath}`;
          if (loginOption) {
            redirectUri += `?login_option=${encodeURIComponent(loginOption)}`;
          }
          const tokenData = await this.exchangeCodeForTokens(code, codeVerifier, redirectUri);
          resolve(tokenData);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
  /**
   * Exchange authorization_code for tokens.
   *
   * POST https://prod.{region}.auth.desktop.kiro.dev/oauth/token
   * Body (JSON): { grant_type, code, code_verifier, redirect_uri }
   * redirect_uri = http://localhost:3128/oauth/callback (with /oauth/callback path)
   *
   * Response: { accessToken, refreshToken, expiresIn, profileArn }
   */
  async exchangeCodeForTokens(code, codeVerifier, redirectUri) {
    const region = KIRO_DEFAULT_REGION;
    const tokenUrl = resolveUrl(KIRO_TOKEN_URL_TEMPLATE, region);
    console.log("[KiroProvider] Exchanging code for tokens, redirect_uri:", redirectUri);
    const response = await httpsRequest(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Kiro-CLI"
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri
      })
    });
    if (response.statusCode !== 200 || !response.data?.accessToken) {
      throw new Error(
        `Token exchange failed: HTTP ${response.statusCode} - ${JSON.stringify(response.data)}`
      );
    }
    const data = response.data;
    const expiresIn = data.expiresIn || 3600;
    console.log("[KiroProvider] Token exchange successful, expires in", expiresIn, "seconds");
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || "",
      expiresAt: Date.now() + (expiresIn - 60) * 1e3,
      profileArn: data.profileArn
    };
  }
  /**
   * Fetch available models from Kiro API
   *
   * GET https://q.{region}.amazonaws.com/ListAvailableModels?origin=AI_EDITOR
   * With optional profileArn query param for Kiro Desktop auth
   */
  async fetchModels(accessToken, region, profileArn) {
    const apiHost = resolveUrl(KIRO_API_HOST_TEMPLATE, region);
    let modelsUrl = `${apiHost}/ListAvailableModels?origin=AI_EDITOR`;
    if (profileArn) {
      modelsUrl += `&profileArn=${encodeURIComponent(profileArn)}`;
    }
    const response = await httpsRequest(modelsUrl, {
      method: "GET",
      headers: getKiroApiHeaders(accessToken)
    });
    if (response.statusCode !== 200) {
      throw new Error(`Failed to fetch models: HTTP ${response.statusCode}`);
    }
    const data = response.data;
    if (!data?.models?.length) {
      throw new Error("No models returned from API");
    }
    const ids = [];
    const names = {};
    for (const model of data.models) {
      const modelId = model.modelId;
      if (modelId === "auto")
        continue;
      ids.push(modelId);
      names[modelId] = KIRO_MODEL_NAMES[modelId] || modelId;
    }
    for (const [hiddenId] of Object.entries(HIDDEN_MODELS)) {
      if (!ids.includes(hiddenId)) {
        ids.push(hiddenId);
        names[hiddenId] = KIRO_MODEL_NAMES[hiddenId] || hiddenId;
      }
    }
    return { ids, names };
  }
  /**
   * Clean up pending auth state
   */
  cleanupPendingAuth() {
    if (pendingAuth) {
      try {
        pendingAuth.server.close();
      } catch {
      }
      pendingAuth = null;
    }
  }
};
function getSuccessHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Kiro Login</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container { text-align: center; padding: 40px; }
    .check { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin-bottom: 10px; }
    p { opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="check">&#10003;</div>
    <h1>Login Successful</h1>
    <p>You can close this window and return to Halo.</p>
  </div>
</body>
</html>`;
}
var providerInstance = null;
function getKiroProvider() {
  if (!providerInstance) {
    providerInstance = new KiroProvider();
  }
  return providerInstance;
}
export {
  KiroProvider,
  getKiroProvider
};
