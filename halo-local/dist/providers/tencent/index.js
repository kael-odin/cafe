// src/providers/tencent/tencent.provider.ts
import { BrowserWindow } from "electron";
import * as https from "https";
import * as crypto from "crypto";

// src/providers/tencent/types.ts
var TENCENT_MODELS = [
  {
    id: "glm-5.0",
    name: "GLM 5.0",
    description: "Latest GLM model with enhanced capabilities"
  },
  {
    id: "glm-4.7",
    name: "GLM 4.7",
    description: "Stable GLM model with strong capabilities"
  },
  {
    id: "glm-4.6",
    name: "GLM 4.6",
    description: "Previous stable GLM model"
  }
];
var DEFAULT_TENCENT_MODEL = "glm-5.0";

// src/providers/tencent/tencent.provider.ts
var CONFIG = {
  baseUrl: "copilot.tencent.com",
  prefixPath: "/plugin",
  platform: "ide",
  ideType: "CodeBuddyIDE",
  ideName: "CodeBuddyIDE",
  ideVersion: "4.3.2",
  product: "SaaS",
  envId: "production"
};
function generateTraceIds() {
  const traceId = crypto.randomBytes(16).toString("hex");
  const spanId = crypto.randomBytes(8).toString("hex");
  const parentSpanId = crypto.randomBytes(8).toString("hex");
  return {
    requestId: traceId,
    traceId,
    spanId,
    parentSpanId
  };
}
function getBaseHeaders() {
  const ids = generateTraceIds();
  return {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "*",
    "Accept-Encoding": "br, gzip",
    "X-Requested-With": "XMLHttpRequest",
    "X-IDE-Type": CONFIG.ideType,
    "X-IDE-Name": CONFIG.ideName,
    "X-IDE-Version": CONFIG.ideVersion,
    "X-Product-Version": CONFIG.ideVersion,
    "X-Product": CONFIG.product,
    "X-Env-ID": CONFIG.envId,
    "X-Domain": CONFIG.baseUrl,
    "X-Request-ID": ids.requestId,
    "X-Request-Trace-Id": ids.traceId,
    "User-Agent": `${CONFIG.ideType}/${CONFIG.ideVersion} CodeBuddy/${CONFIG.ideVersion}`,
    "b3": `${ids.traceId}-${ids.spanId}-1-${ids.parentSpanId}`,
    "X-B3-TraceId": ids.traceId,
    "X-B3-SpanId": ids.spanId,
    "X-B3-ParentSpanId": ids.parentSpanId,
    "X-B3-Sampled": "1"
  };
}
function getAuthHeaders(accessToken, uid) {
  const baseHeaders = getBaseHeaders();
  const encodedUid = uid ? encodeURIComponent(uid) : "";
  return {
    ...baseHeaders,
    "Authorization": `Bearer ${accessToken}`,
    "X-User-Id": encodedUid
  };
}
function getRefreshHeaders(refreshToken) {
  const baseHeaders = getBaseHeaders();
  return {
    ...baseHeaders,
    "Content-Type": "application/json",
    "X-Refresh-Token": refreshToken
  };
}
function getChatHeaders(accessToken, uid, options = {}) {
  const authHeaders = getAuthHeaders(accessToken, uid);
  const conversationId = options.conversationId || crypto.randomBytes(16).toString("hex");
  const messageId = options.messageId || crypto.randomBytes(16).toString("hex");
  const requestId = options.requestId || crypto.randomBytes(16).toString("hex");
  return {
    ...authHeaders,
    "Content-Type": "application/json",
    "X-Agent-Intent": options.agentIntent || "craft",
    "X-Conversation-ID": conversationId,
    "X-Conversation-Request-ID": requestId,
    "X-Conversation-Message-ID": messageId,
    "monitor_promptPrepareStartTime": Date.now().toString(),
    "monitor_httpSendTime": Date.now().toString()
  };
}
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            data: JSON.parse(responseData)
          });
        } catch {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    req.on("error", reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}
function getTencentConfig(config) {
  const tencent = config["tencent"];
  if (!tencent)
    return void 0;
  const legacyMigrated = {
    accessToken: false,
    refreshToken: false,
    tokenExpires: false
  };
  if (tencent.hy_access_token && !tencent.accessToken) {
    tencent.accessToken = tencent.hy_access_token;
    legacyMigrated.accessToken = true;
  }
  if (tencent.hy_refresh_token && !tencent.refreshToken) {
    tencent.refreshToken = tencent.hy_refresh_token;
    legacyMigrated.refreshToken = true;
  }
  if (tencent.hy_token_expires && !tencent.tokenExpires) {
    tencent.tokenExpires = tencent.hy_token_expires;
    legacyMigrated.tokenExpires = true;
  }
  if (legacyMigrated.accessToken || legacyMigrated.refreshToken || legacyMigrated.tokenExpires) {
    console.log("[TencentProvider] Migrated legacy hy_* fields to new field names:", legacyMigrated);
  }
  return tencent;
}
var TencentAISourceProvider = class _TencentAISourceProvider {
  constructor() {
    this.type = "tencent";
    this.displayName = "Tencent Hunyuan";
    /** Auth window reference for embedded login */
    this.authWindow = null;
  }
  /**
   * Check if Tencent is configured and logged in
   */
  isConfigured(config) {
    return getTencentConfig(config)?.loggedIn === true;
  }
  /**
   * Get backend request configuration for API calls
   */
  getBackendConfig(config) {
    const tencent = getTencentConfig(config);
    console.log("[TencentProvider] getBackendConfig called");
    console.log("[TencentProvider] tencent config:", JSON.stringify({
      loggedIn: tencent?.loggedIn,
      hasAccessToken: !!tencent?.accessToken,
      model: tencent?.model,
      availableModels: tencent?.availableModels?.length,
      user: tencent?.user?.name
    }, null, 2));
    if (!tencent?.loggedIn || !tencent.accessToken) {
      console.log("[TencentProvider] getBackendConfig returning null - not logged in or no accessToken");
      return null;
    }
    const headers = getChatHeaders(
      tencent.accessToken,
      tencent.user?.uid || ""
    );
    const url = `https://${CONFIG.baseUrl}/v2/chat/completions`;
    const result = {
      url,
      key: tencent.accessToken,
      // Fixed: use accessToken instead of hy_access_token
      model: tencent.model || DEFAULT_TENCENT_MODEL,
      headers,
      forceStream: true,
      filterContent: true,
      apiType: "chat_completions"
    };
    console.log("[TencentProvider] getBackendConfig returning:", { url: result.url, model: result.model, hasKey: !!result.key });
    return result;
  }
  /**
   * Get current model ID
   */
  getCurrentModel(config) {
    return getTencentConfig(config)?.model || null;
  }
  /**
   * Get available models
   */
  async getAvailableModels(config) {
    const tencent = getTencentConfig(config);
    if (!tencent?.loggedIn) {
      return TENCENT_MODELS.map((m) => m.id);
    }
    if (tencent.availableModels?.length > 0) {
      return tencent.availableModels;
    }
    return TENCENT_MODELS.map((m) => m.id);
  }
  /**
   * Get logged-in user info
   */
  getUserInfo(config) {
    const tencent = getTencentConfig(config);
    if (!tencent?.loggedIn || !tencent.user) {
      return null;
    }
    return {
      name: tencent.user.name,
      avatar: tencent.user.avatar
    };
  }
  // ========== OAuth Methods ==========
  /**
   * Start OAuth login flow
   */
  async startLogin() {
    try {
      console.log("[TencentProvider] Starting login flow...");
      const headers = getBaseHeaders();
      const response = await httpsRequest({
        hostname: CONFIG.baseUrl,
        port: 443,
        path: `/v2${CONFIG.prefixPath}/auth/state?platform=${CONFIG.platform}`,
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      }, JSON.stringify({}));
      if (response.statusCode !== 200 || !response.data?.data) {
        throw new Error(`Failed to get auth state: ${JSON.stringify(response.data)}`);
      }
      const authState = response.data.data;
      const loginUrl = authState.authUrl || `https://${CONFIG.baseUrl}/login?platform=${CONFIG.platform}&state=${authState.state}`;
      this.authWindow = this.createAuthWindow(loginUrl);
      console.log("[TencentProvider] Login window created:", loginUrl);
      return {
        success: true,
        data: {
          loginUrl,
          state: authState.state
        }
      };
    } catch (error) {
      console.error("[TencentProvider] startLogin error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start login"
      };
    }
  }
  /**
   * Complete OAuth login flow
   */
  async completeLogin(state) {
    try {
      console.log("[TencentProvider] Completing login...");
      const authToken = await this.pollForToken(state);
      const accountInfo = await this.pollForAccount(state, authToken.accessToken);
      const { ids: availableModels, names: modelNames } = await this.fetchModels(authToken.accessToken, accountInfo.uid);
      const defaultModel = availableModels.includes(DEFAULT_TENCENT_MODEL) ? DEFAULT_TENCENT_MODEL : availableModels[0] || DEFAULT_TENCENT_MODEL;
      console.log("[TencentProvider] Login complete, user:", accountInfo.nickname);
      this.showSuccessOverlay();
      return {
        success: true,
        data: {
          success: true,
          user: {
            name: accountInfo.nickname
          },
          // Include additional data for config update
          _tokenData: {
            accessToken: authToken.accessToken,
            refreshToken: authToken.refreshToken,
            expiresAt: Date.now() + authToken.expiresIn * 1e3,
            uid: accountInfo.uid
          },
          _availableModels: availableModels,
          _modelNames: modelNames,
          _defaultModel: defaultModel
        }
      };
    } catch (error) {
      console.error("[TencentProvider] completeLogin error:", error);
      this.closeAuthWindow();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed"
      };
    }
  }
  /**
   * Refresh access token
   */
  async refreshToken() {
    return { success: true };
  }
  /**
   * Refresh token with current config
   */
  async refreshTokenWithConfig(config) {
    const tencent = getTencentConfig(config);
    if (!tencent?.refreshToken) {
      return {
        success: false,
        error: "No refresh token available"
      };
    }
    try {
      console.log("[TencentProvider] Refreshing token...");
      const headers = getRefreshHeaders(tencent.refreshToken);
      const response = await httpsRequest({
        hostname: CONFIG.baseUrl,
        port: 443,
        path: `/v2${CONFIG.prefixPath}/auth/token/refresh`,
        method: "POST",
        headers
      }, JSON.stringify({}));
      if (response.statusCode !== 200 || !response.data?.data) {
        throw new Error(`Token refresh failed: ${JSON.stringify(response.data)}`);
      }
      const newToken = response.data.data;
      console.log("[TencentProvider] Token refreshed successfully");
      return {
        success: true,
        data: {
          accessToken: newToken.accessToken,
          refreshToken: newToken.refreshToken,
          expiresAt: Date.now() + newToken.expiresIn * 1e3
        }
      };
    } catch (error) {
      console.error("[TencentProvider] refreshToken error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed"
      };
    }
  }
  /**
   * Check token validity
   */
  async checkToken() {
    return { success: true, data: { valid: true } };
  }
  /**
   * Check token validity with config
   */
  checkTokenWithConfig(config) {
    const tencent = getTencentConfig(config);
    if (!tencent?.accessToken || !tencent.tokenExpires) {
      return { valid: false, needsRefresh: false };
    }
    const now = Date.now();
    const expiresIn = Math.max(0, tencent.tokenExpires - now);
    const oneDay = 24 * 60 * 60 * 1e3;
    return {
      valid: now < tencent.tokenExpires,
      expiresIn,
      needsRefresh: now > tencent.tokenExpires - oneDay
    };
  }
  /**
   * Logout
   */
  async logout() {
    console.log("[TencentProvider] Logout requested");
    return { success: true };
  }
  /**
   * Refresh provider configuration
   */
  async refreshConfig(config) {
    const tencent = getTencentConfig(config);
    if (!tencent?.loggedIn || !tencent.accessToken) {
      return {
        success: false,
        error: "Not logged in"
      };
    }
    try {
      const { ids: availableModels, names: modelNames } = await this.fetchModels(tencent.accessToken, tencent.user?.uid);
      let model = tencent.model;
      if (!availableModels.includes(model)) {
        model = availableModels.includes(DEFAULT_TENCENT_MODEL) ? DEFAULT_TENCENT_MODEL : availableModels[0] || DEFAULT_TENCENT_MODEL;
      }
      console.log(`[TencentProvider] Refreshed: ${availableModels.length} models, using: ${model}`);
      return {
        success: true,
        data: {
          tencent: {
            ...tencent,
            availableModels,
            modelNames,
            model
          }
        }
      };
    } catch (error) {
      console.error("[TencentProvider] refreshConfig error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Refresh failed"
      };
    }
  }
  // ========== Private Methods ==========
  async pollForToken(state) {
    const maxAttempts = 120;
    const interval = 1e3;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      try {
        const headers = getBaseHeaders();
        const response = await httpsRequest({
          hostname: CONFIG.baseUrl,
          port: 443,
          path: `/v2${CONFIG.prefixPath}/auth/token?state=${state}`,
          method: "GET",
          headers
        });
        if (response.statusCode === 200 && response.data?.data?.accessToken) {
          return response.data.data;
        }
      } catch {
      }
    }
    throw new Error("Login timeout - please try again");
  }
  async pollForAccount(state, accessToken) {
    const maxAttempts = 120;
    const interval = 1e3;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      try {
        const headers = getAuthHeaders(accessToken);
        const response = await httpsRequest({
          hostname: CONFIG.baseUrl,
          port: 443,
          path: `/v2${CONFIG.prefixPath}/login/account?state=${state}`,
          method: "GET",
          headers
        });
        if (response.statusCode === 200 && response.data?.data) {
          const account = response.data.data;
          if (account.uid || account.id) {
            return {
              uid: account.uid || account.id,
              nickname: account.nickname || account.label
            };
          }
        }
      } catch {
      }
    }
    throw new Error("Account verification timeout - please try again");
  }
  static {
    // ========== Available Models Reference ==========
    // Model ID                  | Display Name           | Input/Output Tokens | Description
    // --------------------------|------------------------|---------------------|---------------------------
    // default                   | Auto                   | 168K / 32K          | Balanced performance
    // glm-4.7                   | GLM-4.7                | 200K / 48K          | Latest GLM, daily use
    // glm-4.6v                  | GLM-4.6V               | 128K / 32K          | Vision model, image input
    // kimi-k2-thinking          | Kimi-K2-Thinking       | 256K / 32K          | Complex coding tasks
    // kimi-k2-instruct-taiji    | Kimi-K2                | -                   | Kimi instruct model
    // deepseek-v3-2-volc        | DeepSeek-V3.2          | 96K / 32K           | DeepSeek V3.2, daily use
    // deepseek-v3-1-volc        | DeepSeek-V3.1          | 96K / 32K           | Planning, debugging, coding
    // deepseek-v3-0324-lkeap    | DeepSeek-V3-0324       | 112K / 16K          | Flagship model
    // deepseek-r1-0528-lkeap    | DeepSeek-R1            | 96K / 16K           | Reasoning, logic & math
    // hunyuan-2.0-instruct      | Hunyuan-2.0            | 128K / 16K          | Hunyuan 2.0 instruct
    // hunyuan-chat              | Hunyuan-Turbos         | 200K / 8K           | Lightweight, fast
    //
    // [Enterprise only]
    // default-1.1               | Claude-3.7-Sonnet      | - / 8K              | Claude 3.7
    // default-1.2               | Claude-4.0-Sonnet      | 200K / 24K          | Claude 4.0
    /**
     * Recommended models whitelist with display names
     * Key: model ID (exact match), Value: display name
     * To add a model: add a new entry
     * To disable a model: comment out the line
     */
    this.RECOMMENDED_MODELS = {
      "default": "Auto",
      "glm-5.0": "GLM-5.0",
      "glm-4.7": "GLM-4.7",
      // 'glm-4.6': 'GLM-4.6',
      // 'glm-4.6v': 'GLM-4.6V',
      "kimi-k2.5": "Kimi-K2.5",
      "kimi-k2-thinking": "Kimi-K2-Thinking",
      // 'kimi-k2-instruct-taiji': 'Kimi-K2',
      "deepseek-v3-2-volc": "DeepSeek-V3.2",
      // 'deepseek-v3-1-volc': 'DeepSeek-V3.1',
      // 'deepseek-r1-0528-lkeap': 'DeepSeek-R1',
      "hunyuan-2.0-instruct": "Hunyuan-2.0"
      // 'hunyuan-chat': 'Hunyuan-Turbos',
    };
  }
  /**
   * Check if a model is in the recommended whitelist
   */
  isRecommendedModel(modelId) {
    return modelId in _TencentAISourceProvider.RECOMMENDED_MODELS;
  }
  /**
   * Get display name for a model
   */
  getModelDisplayName(modelId) {
    return _TencentAISourceProvider.RECOMMENDED_MODELS[modelId] || modelId;
  }
  /**
   * Fetch models and return both ids and display names
   */
  async fetchModels(accessToken, uid) {
    try {
      const headers = getAuthHeaders(accessToken, uid);
      const response = await httpsRequest({
        hostname: CONFIG.baseUrl,
        port: 443,
        path: "/v3/config",
        method: "GET",
        headers
      });
      if (response.statusCode === 200 && response.data?.data?.models) {
        const chatModels = response.data.data.models.filter((m) => {
          const id = m.id.toLowerCase();
          return !id.includes("completion") && !id.includes("rewrite") && !id.includes("jump") && !id.includes("nes") && m.maxOutputTokens > 256;
        });
        const recommendedModels = chatModels.filter((m) => this.isRecommendedModel(m.id));
        const ids = recommendedModels.map((m) => m.id);
        const names = {};
        for (const m of recommendedModels) {
          names[m.id] = this.getModelDisplayName(m.id);
        }
        console.log(`[TencentProvider] Fetched ${chatModels.length} models, ${recommendedModels.length} recommended`);
        return { ids, names };
      }
      console.warn(`[TencentProvider] Failed to fetch models (status=${response.statusCode}), using fallback`);
      return { ids: [DEFAULT_TENCENT_MODEL], names: { [DEFAULT_TENCENT_MODEL]: "GLM-5.0" } };
    } catch (error) {
      console.error("[TencentProvider] fetchModels error:", error);
      return { ids: [DEFAULT_TENCENT_MODEL], names: { [DEFAULT_TENCENT_MODEL]: "GLM-5.0" } };
    }
  }
  // ========== Auth Window Methods ==========
  /**
   * Create embedded auth window for login
   */
  createAuthWindow(url) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    const authWindow = new BrowserWindow({
      width: 450,
      height: 580,
      parent: mainWindow,
      modal: true,
      show: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      title: "\u767B\u5F55",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });
    authWindow.loadURL(url);
    authWindow.webContents.on("did-finish-load", () => {
      authWindow.webContents.executeJavaScript(`
        (function() {
          // Add CSS to hide unwanted elements and prevent scrollbars
          const style = document.createElement('style');
          style.textContent = 'body { overflow: hidden !important; } .result-box > *:not(.result-icon):not(.result-text) { display: none !important; }';
          document.head.appendChild(style);

          let lastEl = null;

          function applyClipPath() {
            const el = document.querySelector('.container.content-box') ||
                       document.querySelector('.container.account-box') ||
                       document.querySelector('.container.result-box');

            if (el && el !== lastEl) {
              lastEl = el;
              const rect = el.getBoundingClientRect();
              document.documentElement.style.cssText =
                'clip-path: inset(' + rect.top + 'px ' + (window.innerWidth - rect.right) + 'px ' +
                (window.innerHeight - rect.bottom) + 'px ' + rect.left + 'px) !important;';
              console.log('[ClipPath] Applied to:', el.className);
            }
          }

          // Initial apply
          setTimeout(applyClipPath, 100);

          // Watch for DOM changes (SPA navigation)
          const observer = new MutationObserver(() => {
            applyClipPath();
          });
          observer.observe(document.body, { childList: true, subtree: true });

          // Also reapply on resize
          window.addEventListener('resize', applyClipPath);
        })();
      `).then(() => {
        setTimeout(() => {
          authWindow.show();
          console.log("[TencentProvider] Auth window shown with MutationObserver");
        }, 200);
      }).catch(() => {
        authWindow.show();
      });
    });
    authWindow.on("closed", () => {
      this.authWindow = null;
      console.log("[TencentProvider] Auth window closed");
    });
    return authWindow;
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
        // Remove existing overlay if any
        const existing = document.getElementById('halo-login-success');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'halo-login-success';
        overlay.innerHTML = \`
          <div style="
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, 0.98);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            width: 100%;
            height: 100%;
            top: -16px;
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
            ">\u6B22\u8FCE\u4F7F\u7528 Halo</div>
            <button id="halo-close-btn" style="
              padding: 12px 48px;
              font-size: 16px;
              font-weight: 500;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              transition: background 0.2s;
            " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
              \u8FD4\u56DE\u5E94\u7528
            </button>
          </div>
        \`;
        document.body.appendChild(overlay);

        document.getElementById('halo-close-btn').onclick = function() {
          window.close();
        };
      })();
    `).then(() => {
      console.log("[TencentProvider] Success overlay shown");
    }).catch((err) => {
      console.error("[TencentProvider] Failed to show success overlay:", err);
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
function getTencentProvider() {
  if (!instance) {
    instance = new TencentAISourceProvider();
  }
  return instance;
}
export {
  CONFIG as TENCENT_CONFIG,
  TencentAISourceProvider,
  getChatHeaders,
  getTencentProvider
};
