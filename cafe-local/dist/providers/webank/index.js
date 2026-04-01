// src/providers/webank/webank.provider.ts
import { BrowserWindow, ipcMain } from "electron";

// src/providers/webank/types.ts
var WEBANK_MODELS = [
  {
    id: "glm-4.7",
    name: "GLM-4.7",
    description: "GLM 4.7 model"
  },
  {
    id: "deepseek-v3-2",
    name: "DeepSeek-V3.2",
    description: "DeepSeek V3.2 model"
  }
];
var DEFAULT_WEBANK_MODEL = "glm-4.7";
var WEBANK_MODEL_NAMES = {
  "glm-4.7": "GLM-4.7",
  "deepseek-v3-2": "DeepSeek-V3.2"
};

// src/providers/webank/webank.provider.ts
var WEBANK_CONFIG = {
  apiUrl: "http://10.107.118.2:3004/v1/chat/completions",
  apiKey: "sk-VjGJg_xta2oIfVhgcafecb",
  defaultModel: "glm-4.7",
  availableModels: ["glm-4.7", "deepseek-v3-2"],
  modelNames: WEBANK_MODEL_NAMES
};
function getWeBankConfig(config) {
  return config["webank"];
}
var WeBankAISourceProvider = class {
  constructor() {
    this.type = "webank";
    this.displayName = "WeBank";
    /** Auth window reference for employee ID input */
    this.authWindow = null;
    /** Promise resolver for login completion */
    this.loginResolver = null;
    /** IPC handler registered flag */
    this.ipcHandlerRegistered = false;
    this.registerIpcHandler();
  }
  /**
   * Register IPC handler for receiving user ID from input window
   */
  registerIpcHandler() {
    if (this.ipcHandlerRegistered)
      return;
    ipcMain.on("webank:submit-userid", (_event, userId) => {
      console.log("[WeBankProvider] Received user ID:", userId);
      if (this.loginResolver) {
        this.loginResolver(userId);
        this.loginResolver = null;
      }
    });
    this.ipcHandlerRegistered = true;
    console.log("[WeBankProvider] IPC handler registered");
  }
  /**
   * Check if WeBank is configured (employee ID has been entered)
   */
  isConfigured(config) {
    const webank = getWeBankConfig(config);
    return webank?.loggedIn === true && !!webank?.user?.uid;
  }
  /**
   * Get backend request configuration for API calls
   */
  getBackendConfig(config) {
    const webank = getWeBankConfig(config);
    console.log("[WeBankProvider] getBackendConfig called");
    console.log("[WeBankProvider] webank config:", JSON.stringify({
      loggedIn: webank?.loggedIn,
      model: webank?.model,
      user: webank?.user?.name
    }, null, 2));
    if (!webank?.loggedIn || !webank?.user?.uid) {
      console.log("[WeBankProvider] getBackendConfig returning null - not logged in");
      return null;
    }
    const result = {
      url: WEBANK_CONFIG.apiUrl,
      key: WEBANK_CONFIG.apiKey,
      model: webank.model || WEBANK_CONFIG.defaultModel,
      headers: {
        "X-User-Id": webank.user.uid,
        "Content-Type": "application/json"
      },
      forceStream: true,
      apiType: "chat_completions"
    };
    console.log("[WeBankProvider] getBackendConfig returning:", {
      url: result.url,
      model: result.model,
      hasKey: !!result.key
    });
    return result;
  }
  /**
   * Get current model ID
   */
  getCurrentModel(config) {
    return getWeBankConfig(config)?.model || null;
  }
  /**
   * Get available models
   */
  async getAvailableModels(_config) {
    return WEBANK_CONFIG.availableModels;
  }
  /**
   * Get logged-in user info
   */
  getUserInfo(config) {
    const webank = getWeBankConfig(config);
    if (!webank?.loggedIn || !webank.user) {
      return null;
    }
    return {
      name: webank.user.name,
      uid: webank.user.uid
    };
  }
  // ========== OAuth Methods (Simplified for WeBank) ==========
  /**
   * Start "login" flow - opens employee ID input window
   */
  async startLogin() {
    try {
      console.log("[WeBankProvider] Starting login flow...");
      this.authWindow = this.createUserIdInputWindow();
      return {
        success: true,
        data: {
          loginUrl: "",
          // Not used for WeBank
          state: "webank-input"
          // Marker state
        }
      };
    } catch (error) {
      console.error("[WeBankProvider] startLogin error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start login"
      };
    }
  }
  /**
   * Complete "login" flow - wait for user to enter employee ID
   */
  async completeLogin(_state) {
    try {
      console.log("[WeBankProvider] Waiting for user ID input...");
      const userId = await this.waitForUserId();
      if (!userId) {
        throw new Error("Login cancelled");
      }
      console.log("[WeBankProvider] Login complete, user:", userId);
      this.showSuccessOverlay();
      return {
        success: true,
        data: {
          success: true,
          user: {
            name: userId
          },
          // Additional data for config update (matches manager's handleOAuthLoginSuccess)
          _tokenData: {
            uid: userId,
            // Use employee ID as uid for API headers
            // Use placeholder accessToken - actual API uses pre-configured key
            // This is required because manager.ts checks for accessToken on OAuth sources
            accessToken: `webank-${userId}`
          },
          _availableModels: WEBANK_CONFIG.availableModels,
          _modelNames: WEBANK_CONFIG.modelNames,
          _defaultModel: WEBANK_CONFIG.defaultModel
        }
      };
    } catch (error) {
      console.error("[WeBankProvider] completeLogin error:", error);
      this.closeAuthWindow();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed"
      };
    }
  }
  /**
   * Wait for user to submit their employee ID
   */
  waitForUserId() {
    return new Promise((resolve) => {
      this.loginResolver = resolve;
      if (this.authWindow) {
        this.authWindow.on("closed", () => {
          if (this.loginResolver) {
            this.loginResolver("");
            this.loginResolver = null;
          }
        });
      }
    });
  }
  /**
   * Refresh access token (not needed for WeBank - pre-configured API)
   */
  async refreshToken() {
    return { success: true };
  }
  /**
   * Check token validity (always valid for WeBank - pre-configured API)
   */
  async checkToken() {
    return { success: true, data: { valid: true } };
  }
  /**
   * Logout
   */
  async logout() {
    console.log("[WeBankProvider] Logout requested");
    return { success: true };
  }
  /**
   * Refresh provider configuration (no-op for WeBank)
   */
  async refreshConfig(_config) {
    return { success: true, data: {} };
  }
  // ========== Auth Window Methods ==========
  /**
   * Create employee ID input window
   */
  createUserIdInputWindow() {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    const inputWindow = new BrowserWindow({
      width: 400,
      height: 320,
      parent: mainWindow,
      modal: true,
      show: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      title: "WeBank \u767B\u5F55",
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        // Allow require('electron') in HTML
        sandbox: false
      }
    });
    const html = this.generateInputFormHtml();
    inputWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    inputWindow.webContents.on("did-finish-load", () => {
      inputWindow.show();
      console.log("[WeBankProvider] Input window shown");
    });
    inputWindow.on("closed", () => {
      this.authWindow = null;
      console.log("[WeBankProvider] Input window closed");
    });
    return inputWindow;
  }
  /**
   * Generate HTML for the employee ID input form
   */
  generateInputFormHtml() {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>WeBank \u767B\u5F55</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      height: 100%;
      overflow: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 24px 32px;
      background: #ffffff;
      color: #1f2937;
    }
    .container {
      max-width: 340px;
      margin: 0 auto;
    }
    .icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .icon svg {
      width: 20px;
      height: 20px;
      color: white;
    }
    h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #1f2937;
    }
    p {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 16px;
      line-height: 1.5;
    }
    input {
      width: 100%;
      padding: 10px 14px;
      font-size: 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      outline: none;
      margin-bottom: 12px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
    input::placeholder {
      color: #9ca3af;
    }
    button {
      width: 100%;
      padding: 10px;
      font-size: 14px;
      font-weight: 500;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover:not(:disabled) {
      background: #059669;
    }
    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    </div>
    <h3>\u8BF7\u8F93\u5165\u7528\u6237 ID</h3>
    <p>\u8BF7\u8F93\u5165\u6807\u51C6\u7684\u82F1\u6587\u540D\u7528\u6237 ID\uFF0C\u6BD4\u5982 flywang\u3002\u7528\u6237 ID \u548C\u4EE3\u7801\u6743\u9650\u65E0\u5173\uFF0C\u4EC5\u7528\u4E8E\u7EDF\u8BA1\u7528\u91CF\u4EE5\u53CA\u53EF\u80FD\u7684 LLM \u8C03\u7528\u9650\u989D\uFF08UM \u767B\u5F55\u6B63\u5728\u4E0B\u4E2A\u7248\u672C\u63A5\u5165\u4E2D\uFF09\u3002</p>
    <input type="text" id="userId" placeholder="\u4F8B\u5982\uFF1Aflywang" autofocus />
    <button id="submitBtn" disabled>\u786E\u8BA4</button>
  </div>
  <script>
    const { ipcRenderer } = require('electron');
    const input = document.getElementById('userId');
    const btn = document.getElementById('submitBtn');

    input.addEventListener('input', () => {
      btn.disabled = !input.value.trim();
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        submit();
      }
    });

    function submit() {
      const userId = input.value.trim();
      if (userId) {
        ipcRenderer.send('webank:submit-userid', userId);
      }
    }

    btn.addEventListener('click', submit);
  </script>
</body>
</html>
`;
  }
  /**
   * Show success overlay in auth window
   */
  showSuccessOverlay() {
    if (!this.authWindow || this.authWindow.isDestroyed()) {
      return;
    }
    this.authWindow.webContents.executeJavaScript(`
      (function() {
        document.body.innerHTML = \`
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            <div style="
              width: 64px;
              height: 64px;
              border-radius: 50%;
              background: #10b981;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 20px;
            ">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div style="
              font-size: 20px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 8px;
            ">\u767B\u5F55\u6210\u529F</div>
            <div style="
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 24px;
            ">\u6B22\u8FCE\u4F7F\u7528 Cafe</div>
            <button id="closeBtn" style="
              padding: 12px 48px;
              font-size: 16px;
              font-weight: 500;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            ">\u8FD4\u56DE\u5E94\u7528</button>
          </div>
        \`;

        document.getElementById('closeBtn').onclick = function() {
          window.close();
        };
      })();
    `).then(() => {
      console.log("[WeBankProvider] Success overlay shown");
    }).catch((err) => {
      console.error("[WeBankProvider] Failed to show success overlay:", err);
      if (this.authWindow && !this.authWindow.isDestroyed()) {
        this.authWindow.close();
      }
    });
  }
  /**
   * Close auth window if open
   */
  closeAuthWindow() {
    if (this.authWindow && !this.authWindow.isDestroyed()) {
      this.authWindow.close();
      this.authWindow = null;
    }
  }
};
var instance = null;
function getWeBankProvider() {
  if (!instance) {
    instance = new WeBankAISourceProvider();
  }
  return instance;
}
export {
  DEFAULT_WEBANK_MODEL,
  WEBANK_CONFIG,
  WEBANK_MODELS,
  WEBANK_MODEL_NAMES,
  WeBankAISourceProvider,
  getWeBankProvider
};
