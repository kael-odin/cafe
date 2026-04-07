# API 逆向工程实战指南

## 目标网站
- **ClawHub**: https://clawhub.ai/
- **SkillsHub**: https://skillhub.tencent.com/

---

## 第一部分：ClawHub API 分析

### 步骤 1：打开网站和开发者工具

1. 访问 https://clawhub.ai/
2. 按 `F12` 打开开发者工具
3. 切换到 **Network** 标签
4. 勾选 **Preserve log**

### 步骤 2：捕获技能列表请求

**操作序列：**
```
1. 刷新页面 (F5)
2. 观察 Network 标签中的所有请求
3. 点击 "Fetch/XHR" 过滤器
4. 寻找包含以下关键词的请求：
   - "skill"
   - "list"
   - "popular"
   - "search"
```

**预期发现的请求类型：**

#### 可能性 A：Convex API（ClawHub 使用 Convex 作为后端）

Convex 是一个实时数据库，通常使用 WebSocket 或 HTTP 长轮询。

**特征：**
```
URL: https://xxx.convex.cloud/api/query
Method: POST
Content-Type: application/json

Request Body:
{
  "path": "skills:list",
  "args": {},
  "sessionToken": "xxx"
}

Response:
{
  "result": [
    { "id": "...", "name": "...", ... }
  ]
}
```

#### 可能性 B：Next.js API Routes

如果使用 Next.js，可能有内部 API 端点：

```
URL: https://clawhub.ai/api/skills
Method: GET

Response:
{
  "skills": [...],
  "total": 100
}
```

#### 可能性 C：GraphQL API

```
URL: https://clawhub.ai/graphql
Method: POST

Request Body:
{
  "query": "{ skills { id name description } }"
}
```

### 步骤 3：分析具体请求

**在 Network 标签中点击某个请求，记录以下信息：**

```markdown
## 请求信息模板

**请求 URL:**
```
[在这里粘贴完整的 URL]
```

**请求方法:**
```
GET / POST / PUT / DELETE
```

**请求头 (Request Headers):**
```
Content-Type: application/json
Authorization: Bearer xxx (如果有)
[其他关键请求头]
```

**请求参数 (Query Parameters):**
```
page=1
limit=20
search=xxx
[其他参数]
```

**请求体 (Request Body - 如果是 POST):**
```json
{
  "query": "xxx",
  "filters": {}
}
```

**响应数据 (Response):**
```json
{
  "skills": [
    {
      "id": "xxx",
      "name": "xxx",
      "description": "xxx",
      "author": "xxx",
      "downloads": 100,
      "tags": ["xxx", "yyy"]
    }
  ],
  "total": 50,
  "hasMore": true
}
```
```

### 步骤 4：触发搜索请求

**操作：**
```
1. 在网站搜索框中输入关键词（如 "web"）
2. 观察新的网络请求
3. 找到搜索相关的 API 调用
```

**预期发现：**
```
URL: https://api.clawhub.ai/v1/skills/search?q=web&page=1
或
URL: https://xxx.convex.cloud/api/query
Body: { "path": "skills:search", "args": { "query": "web" } }
```

---

## 第二部分：SkillsHub API 分析

### 步骤 1：打开网站和开发者工具

1. 访问 https://skillhub.tencent.com/
2. 按 `F12` 打开开发者工具
3. 切换到 **Network** 标签

### 步骤 2：捕获技能列表

**SkillsHub 可能的技术栈：**
- 腾讯云 COS（对象存储）
- 腾讯云 API 网关
- 自建后端服务

**预期请求特征：**

#### 可能性 A：腾讯云 COS API

```
URL: https://skillhub-1251783334.cos.ap-guangzhou.myqcloud.com/data/skills.json
Method: GET

Response:
{
  "skills": [...]
}
```

#### 可能性 B：腾讯云 API

```
URL: https://api.skillhub.tencent.com/v1/skills
Method: GET
Headers:
  Authorization: xxx (腾讯云签名)

Response:
{
  "Response": {
    "Skills": [...],
    "TotalCount": 100
  }
}
```

### 步骤 3：分析下载/安装请求

**操作：**
```
1. 点击某个技能的"安装"或"下载"按钮
2. 观察网络请求
3. 记录 API 端点和参数
```

---

## 第三部分：实战技巧

### 技巧 1：使用 Copy as cURL

**在 Network 标签中：**
```
1. 右键点击某个请求
2. 选择 "Copy" → "Copy as cURL"
3. 粘贴到文本编辑器中
4. 使用 Postman 或 curl 测试
```

**示例：**
```bash
curl 'https://api.clawhub.ai/v1/skills' \
  -H 'accept: application/json' \
  -H 'authorization: Bearer xxx' \
  -H 'content-type: application/json' \
  --data-raw '{"page":1,"limit":20}'
```

### 技巧 2：使用 Postman 导入

```
1. 在 Network 标签中右键请求
2. 选择 "Copy" → "Copy as cURL (bash)"
3. 打开 Postman
4. 点击 "Import" → 粘贴 cURL 命令
5. Postman 会自动解析请求
```

### 技巧 3：分析 JavaScript 源码

**查找 API 端点定义：**
```
1. 在 Network 标签中点击 "JS" 过滤器
2. 查找 main.js、app.js、chunk.js 等文件
3. 点击文件，查看源码
4. 搜索关键词：
   - "api"
   - "endpoint"
   - "fetch("
   - "axios."
   - "/v1/"
   - "/graphql"
```

### 技巧 4：使用 Console 调试

**在 Console 标签中执行：**
```javascript
// 监听所有 fetch 请求
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch called with:', args);
  return originalFetch.apply(this, args);
};

// 监听所有 XMLHttpRequest
const originalXHR = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function(method, url) {
  console.log('XHR:', method, url);
  return originalXHR.apply(this, arguments);
};
```

### 技巧 5：查看环境变量和配置

**在 Console 标签中执行：**
```javascript
// 查找全局配置
console.log(window.__NEXT_DATA__);
console.log(window.__NUXT__);
console.log(window.config);
console.log(window.API_BASE_URL);

// 查找 Convex 客户端
console.log(window.convex);
```

---

## 第四部分：记录你的发现

### ClawHub API 发现记录

**请填写以下信息：**

```markdown
### API 端点 1: 获取技能列表

**URL:** `[待填写]`

**方法:** `GET / POST`

**请求参数:**
```json
{
  "page": 1,
  "limit": 20
}
```

**响应示例:**
```json
{
  "skills": [
    {
      "id": "xxx",
      "name": "xxx",
      "description": "xxx"
    }
  ]
}
```

**是否需要认证:** `是 / 否`

**认证方式:** `Bearer Token / API Key / 无`

---

### API 端点 2: 搜索技能

**URL:** `[待填写]`

**方法:** `GET / POST`

**请求参数:**
```json
{
  "query": "web scraper",
  "page": 1
}
```

**响应示例:**
```json
{
  "results": [...],
  "total": 50
}
```
```

### SkillsHub API 发现记录

**请填写以下信息：**

```markdown
### API 端点 1: 获取技能列表

**URL:** `[待填写]`

**方法:** `GET / POST`

**请求参数:**
```json
{}
```

**响应示例:**
```json
{}
```

**是否需要认证:** `是 / 否`
```

---

## 第五部分：验证和测试

### 使用 Node.js 测试 API

创建测试脚本：

```javascript
// test-clawhub-api.js
const API_BASE = 'https://api.clawhub.ai/v1'; // 替换为实际 URL

async function testSkillsList() {
  const response = await fetch(`${API_BASE}/skills?page=1&limit=10`);
  const data = await response.json();
  console.log('Skills List:', data);
}

async function testSearch(query) {
  const response = await fetch(`${API_BASE}/skills/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  console.log('Search Results:', data);
}

// 运行测试
testSkillsList();
testSearch('web scraper');
```

---

## 第六部分：注意事项

### ⚠️ 重要提醒

1. **合法性**
   - 仅用于学习和个人项目
   - 不要用于商业用途
   - 遵守网站的服务条款
   - 不要过度请求（添加延迟）

2. **稳定性**
   - 非官方 API 可能随时变化
   - 没有文档和支持
   - 需要定期维护和更新

3. **认证**
   - 某些 API 可能需要登录
   - Token 可能会过期
   - 需要处理认证逻辑

4. **速率限制**
   - 添加请求延迟（至少 100-200ms）
   - 实现重试机制
   - 缓存响应数据

---

## 下一步行动

1. **立即操作：** 打开浏览器，按照上述步骤分析两个网站
2. **记录发现：** 填写上面的 API 发现记录模板
3. **分享结果：** 将你的发现告诉我，我会帮你实现适配器

**提示：** 如果遇到困难，可以截图 Network 标签的内容，我会帮你分析！
