/**
 * API 分析辅助工具
 * 
 * 使用方法：
 * 1. 在浏览器开发者工具的 Console 标签中粘贴此脚本
 * 2. 执行后，所有 API 请求会被自动记录
 * 3. 调用 showApiLog() 查看所有捕获的请求
 */

// ============================================
// API 请求拦截器
// ============================================

const apiLog = [];
const MAX_LOG_ENTRIES = 100;

// 拦截 fetch 请求
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    type: 'fetch',
    url: typeof url === 'string' ? url : url.toString(),
    method: options?.method || 'GET',
    headers: options?.headers || {},
    body: options?.body,
    response: null,
    status: null,
  };
  
  apiLog.push(logEntry);
  if (apiLog.length > MAX_LOG_ENTRIES) {
    apiLog.shift();
  }
  
  console.log(`[API Interceptor] ${logEntry.method} ${logEntry.url}`);
  
  return originalFetch.apply(this, args).then(response => {
    logEntry.status = response.status;
    
    const clonedResponse = response.clone();
    clonedResponse.json().then(data => {
      logEntry.response = data;
      console.log(`[API Response] ${logEntry.url}`, data);
    }).catch(() => {
      clonedResponse.text().then(text => {
        logEntry.response = text.substring(0, 500);
      });
    });
    
    return response;
  }).catch(error => {
    logEntry.status = 'ERROR';
    logEntry.response = error.message;
    console.error(`[API Error] ${logEntry.url}`, error);
    throw error;
  });
};

// 拦截 XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url) {
  this._apiLogMeta = { method, url, timestamp: new Date().toISOString() };
  return originalXHROpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) {
  const xhr = this;
  const meta = xhr._apiLogMeta;
  
  if (meta) {
    const logEntry = {
      timestamp: meta.timestamp,
      type: 'xhr',
      url: meta.url,
      method: meta.method,
      body: body,
      response: null,
      status: null,
    };
    
    apiLog.push(logEntry);
    if (apiLog.length > MAX_LOG_ENTRIES) {
      apiLog.shift();
    }
    
    console.log(`[XHR Interceptor] ${meta.method} ${meta.url}`);
    
    xhr.addEventListener('load', function() {
      logEntry.status = xhr.status;
      try {
        logEntry.response = JSON.parse(xhr.responseText);
        console.log(`[XHR Response] ${meta.url}`, logEntry.response);
      } catch {
        logEntry.response = xhr.responseText.substring(0, 500);
      }
    });
    
    xhr.addEventListener('error', function() {
      logEntry.status = 'ERROR';
      logEntry.response = 'XHR request failed';
      console.error(`[XHR Error] ${meta.url}`);
    });
  }
  
  return originalXHRSend.apply(this, arguments);
};

// ============================================
// 辅助函数
// ============================================

window.showApiLog = function(filter = null) {
  console.log('\n========== API 请求日志 ==========\n');
  
  let filtered = apiLog;
  
  if (filter) {
    filtered = apiLog.filter(entry => 
      entry.url.toLowerCase().includes(filter.toLowerCase()) ||
      entry.method.toLowerCase().includes(filter.toLowerCase())
    );
  }
  
  if (filtered.length === 0) {
    console.log('暂无匹配的 API 请求记录');
    return;
  }
  
  filtered.forEach((entry, index) => {
    console.log(`\n--- 请求 ${index + 1} ---`);
    console.log(`时间: ${entry.timestamp}`);
    console.log(`类型: ${entry.type}`);
    console.log(`方法: ${entry.method}`);
    console.log(`URL: ${entry.url}`);
    console.log(`状态: ${entry.status}`);
    
    if (entry.body) {
      console.log('请求体:', entry.body);
    }
    
    if (entry.response) {
      console.log('响应:', entry.response);
    }
  });
  
  console.log(`\n总计: ${filtered.length} 个请求`);
  console.log('\n========== 日志结束 ==========\n');
};

window.exportApiLog = function() {
  const json = JSON.stringify(apiLog, null, 2);
  console.log(json);
  
  navigator.clipboard.writeText(json).then(() => {
    console.log('API 日志已复制到剪贴板');
  }).catch(err => {
    console.error('复制失败:', err);
  });
  
  return json;
};

window.clearApiLog = function() {
  apiLog.length = 0;
  console.log('API 日志已清空');
};

window.filterApiLog = {
  skills: () => showApiLog('skill'),
  search: () => showApiLog('search'),
  api: () => showApiLog('api'),
  list: () => showApiLog('list'),
};

window.generateCurl = function(index) {
  const entry = apiLog[index - 1];
  if (!entry) {
    console.error('无效的索引');
    return;
  }
  
  let curl = `curl -X ${entry.method} '${entry.url}'`;
  
  if (entry.headers) {
    for (const [key, value] of Object.entries(entry.headers)) {
      curl += ` \\\n  -H '${key}: ${value}'`;
    }
  }
  
  if (entry.body) {
    const body = typeof entry.body === 'string' ? entry.body : JSON.stringify(entry.body);
    curl += ` \\\n  --data-raw '${body}'`;
  }
  
  console.log(curl);
  return curl;
};

window.findApiEndpoints = function() {
  const endpoints = new Set();
  
  apiLog.forEach(entry => {
    const url = new URL(entry.url, window.location.origin);
    const path = url.pathname;
    endpoints.add(path);
    const baseUrl = `${url.protocol}//${url.host}`;
    endpoints.add(baseUrl);
  });
  
  console.log('\n========== 发现的 API 端点 ==========\n');
  Array.from(endpoints).sort().forEach(endpoint => {
    console.log(endpoint);
  });
  console.log('\n========== 端点列表结束 ==========\n');
  
  return Array.from(endpoints);
};

console.log(`
API 分析工具已启动

可用命令：
  showApiLog()           - 显示所有 API 请求
  showApiLog('skill')    - 筛选包含 'skill' 的请求
  exportApiLog()         - 导出日志为 JSON
  clearApiLog()          - 清空日志
  generateCurl(1)        - 生成第 1 个请求的 cURL 命令
  findApiEndpoints()     - 查找所有 API 端点

快捷筛选：
  filterApiLog.skills()  - 筛选技能相关请求
  filterApiLog.search()  - 筛选搜索相关请求
  filterApiLog.api()     - 筛选 API 相关请求
  filterApiLog.list()    - 筛选列表相关请求

现在请刷新页面或执行操作，API 请求会被自动捕获！
`);
