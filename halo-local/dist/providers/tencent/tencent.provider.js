import { shell } from "electron";
import * as https from "https";
import * as crypto from "crypto";
import { TENCENT_MODELS, DEFAULT_TENCENT_MODEL } from "./types";
const CONFIG = {
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
  return {
    ...baseHeaders,
    "Authorization": `Bearer ${accessToken}`,
    "X-User-Id": uid || ""
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
  return tencent;
}
class TencentAISourceProvider {
  constructor() {
    this.type = "tencent";
    this.displayName = "Tencent Hunyuan";
    // Refresh cache to avoid frequent refreshes (1 hour)
    this.lastRefreshTime = 0;
    this.REFRESH_CACHE_DURATION = 60 * 60 * 1e3;
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
    if (!tencent?.loggedIn || !tencent.hy_access_token) {
      return null;
    }
    const headers = getChatHeaders(
      tencent.hy_access_token,
      tencent.user?.name || ""
    );
    const url = `https://${CONFIG.baseUrl}/v3/chat/completions`;
    return {
      url,
      key: tencent.hy_access_token,
      model: tencent.model || DEFAULT_TENCENT_MODEL,
      headers,
      apiType: "chat_completions"
    };
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
      shell.openExternal(loginUrl);
      console.log("[TencentProvider] Login URL opened:", loginUrl);
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
      const availableModels = await this.fetchModels(authToken.accessToken);
      const defaultModel = availableModels.includes("glm-4.7") ? "glm-4.7" : availableModels[0] || "deepseek-v3-0324-lkeap";
      console.log("[TencentProvider] Login complete, user:", accountInfo.nickname);
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
          _defaultModel: defaultModel
        }
      };
    } catch (error) {
      console.error("[TencentProvider] completeLogin error:", error);
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
    if (!tencent?.hy_refresh_token) {
      return {
        success: false,
        error: "No refresh token available"
      };
    }
    try {
      console.log("[TencentProvider] Refreshing token...");
      const headers = getRefreshHeaders(tencent.hy_refresh_token);
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
    if (!tencent?.hy_access_token || !tencent.hy_token_expires) {
      return { valid: false, needsRefresh: false };
    }
    const now = Date.now();
    const expiresIn = Math.max(0, tencent.hy_token_expires - now);
    const oneDay = 24 * 60 * 60 * 1e3;
    return {
      valid: now < tencent.hy_token_expires,
      expiresIn,
      needsRefresh: now > tencent.hy_token_expires - oneDay
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
    if (!tencent?.loggedIn || !tencent.hy_access_token) {
      return {
        success: false,
        error: "Not logged in"
      };
    }
    const now = Date.now();
    if (now - this.lastRefreshTime < this.REFRESH_CACHE_DURATION) {
      return { success: true, data: {} };
    }
    try {
      const availableModels = await this.fetchModels(tencent.hy_access_token);
      let model = tencent.model;
      if (!availableModels.includes(model)) {
        model = availableModels.includes("glm-4.7") ? "glm-4.7" : availableModels[0] || "deepseek-v3-0324-lkeap";
      }
      this.lastRefreshTime = now;
      console.log(`[TencentProvider] Refreshed: ${availableModels.length} models, using: ${model}`);
      return {
        success: true,
        data: {
          tencent: {
            ...tencent,
            availableModels,
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
  async fetchModels(accessToken) {
    try {
      const headers = getAuthHeaders(accessToken);
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
        console.log(`[TencentProvider] Found ${chatModels.length} available models`);
        return chatModels.map((m) => m.id);
      }
      return ["deepseek-v3-0324-lkeap"];
    } catch (error) {
      console.error("[TencentProvider] fetchModels error:", error);
      return ["deepseek-v3-0324-lkeap"];
    }
  }
}
let instance = null;
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
