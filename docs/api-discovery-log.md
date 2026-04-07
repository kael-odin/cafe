# API 发现日志

## 📅 日期：2026-04-07

---

## ✅ SkillsHub API（已完成）

### API 端点

**基础 URL:** `https://api.skillhub.tencent.com/api`

#### 1. 获取技能列表

```
GET /skills
```

**请求参数：**
```
page: number       - 页码（从 1 开始）
pageSize: number   - 每页数量
sortBy: string     - 排序字段（如 'score'）
order: string      - 排序方向（'asc' 或 'desc'）
keyword: string    - 搜索关键词（可选）
```

**示例请求：**
```bash
curl 'https://api.skillhub.tencent.com/api/skills?page=1&pageSize=24&sortBy=score&order=desc'
```

**响应格式：**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "string",
        "name": "string",
        "slug": "string",
        "description": "string",
        "author": "string",
        "version": "string",
        "tags": ["string"],
        "category": "string",
        "icon": "string",
        "downloads": number,
        "score": number,
        "createdAt": "ISO 8601",
        "updatedAt": "ISO 8601"
      }
    ],
    "total": number,
    "page": number,
    "pageSize": number
  },
  "message": "success"
}
```

**状态：** ✅ 已实现适配器

**文件：** `src/main/store/adapters/skillshub.adapter.ts`

---

## 🔄 ClawHub API（待完成）

### API 端点

**基础 URL:** `https://wry-manatee-359.convex.cloud/api`

#### 1. 查询技能

```
POST /query
```

**请求头：**
```
Content-Type: application/json
convex-client: npm-1.34.1
```

**请求体：** ⚠️ 需要更多信息

请提供以下信息：
1. **Request Payload**（请求体）
   - 在 Network 标签中点击该请求
   - 查看 "Payload" 标签
   - 复制完整的 JSON

2. **Response**（响应数据）
   - 点击 "Response" 标签
   - 复制完整的 JSON

**示例：**
```json
// 请求体可能是这样的：
{
  "path": "skills:list",
  "args": {
    "page": 1,
    "limit": 20
  },
  "sessionToken": "xxx"
}

// 响应可能是这样的：
{
  "result": [
    { "id": "...", "name": "...", ... }
  ]
}
```

**状态：** ⏳ 等待更多信息

---

## 📝 下一步行动

### 立即执行：

1. **测试 SkillsHub API**
   ```bash
   # 在浏览器控制台或 Node.js 中运行
   node scripts/test-skillshub-api.js
   ```
   
   或在浏览器中：
   - 打开 https://skillhub.tencent.com/
   - 按 F12 打开控制台
   - 粘贴 `scripts/test-skillshub-api.js` 的内容
   - 按回车执行

2. **收集 ClawHub API 信息**
   - 打开 https://clawhub.ai/
   - 按 F12 打开开发者工具
   - 切换到 Network 标签
   - 刷新页面
   - 找到 `https://wry-manatee-359.convex.cloud/api/query` 请求
   - 点击请求，查看：
     - **Payload** 标签（请求体）
     - **Response** 标签（响应数据）
   - 复制这两个信息给我

3. **验证 SkillsHub 适配器**
   - 启动你的 Electron 应用
   - 进入 "应用商店" 页面
   - 点击 "SkillsHub" 按钮
   - 查看是否显示技能列表

---

## 🔧 已实现的功能

### SkillsHub 适配器

✅ **已实现：**
- 获取技能列表（分页）
- 搜索技能（关键词）
- 转换为标准 RegistryEntry 格式
- 错误处理和日志记录

⏳ **待实现：**
- 获取单个技能详情（需要额外的 API 端点）
- 技能安装（可能需要 CLI 工具）

### ClawHub 适配器

⏳ **待实现：**
- 需要更多 API 信息
- Convex 查询格式特殊，需要适配

---

## 📊 API 对比

| 特性 | SkillsHub | ClawHub |
|------|-----------|---------|
| **API 类型** | REST API | Convex API |
| **认证** | 无需认证 | 可能需要 Token |
| **分页** | ✅ 支持 | ❓ 待确认 |
| **搜索** | ✅ 支持 | ❓ 待确认 |
| **响应格式** | 标准 JSON | Convex 格式 |
| **实现难度** | ⭐ 简单 | ⭐⭐⭐ 中等 |

---

## 🎯 目标

1. ✅ 实现 SkillsHub 适配器（已完成）
2. ⏳ 实现 ClawHub 适配器（等待 API 信息）
3. ⏳ 测试和优化
4. ⏳ 添加缓存和错误处理

---

## 💡 提示

### 如何获取 ClawHub API 信息：

1. 打开 https://clawhub.ai/
2. 按 F12 打开开发者工具
3. 切换到 **Network** 标签
4. 勾选 **Preserve log**
5. 刷新页面（F5）
6. 在请求列表中找到：
   - `query` 请求（Convex API）
7. 点击该请求，查看：
   - **Headers** 标签（请求头）
   - **Payload** 标签（请求体）
   - **Response** 标签（响应数据）
8. 复制这些信息给我

### 如何测试 SkillsHub：

在浏览器控制台执行：
```javascript
fetch('https://api.skillhub.tencent.com/api/skills?page=1&pageSize=10&sortBy=score&order=desc')
  .then(r => r.json())
  .then(d => console.log(d))
```

---

## 📞 联系

如果你有任何问题或发现了新的 API 端点，请告诉我！

**需要的 ClawHub API 信息：**
- [ ] Request Payload（请求体）
- [ ] Response Data（响应数据）
- [ ] 是否需要认证
- [ ] 搜索参数格式
