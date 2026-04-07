# SkillsHub/ClawHub 集成测试报告

## 测试日期
2026-04-07

## 问题描述
点击 SkillsHub 和 ClawHub 按钮后，显示的内容与"技能"按钮完全相同，没有显示各自平台的技能列表。

## 根本原因分析

### 1. 架构检查 ✅
- **适配器注册** (`src/main/store/adapters/index.ts`): SkillsHub 和 ClawHub 适配器已正确注册
- **内置注册表** (`src/main/store/registry.service.ts`): 两个注册表已正确配置
- **前端过滤逻辑** (`src/renderer/components/store/StoreHeader.tsx`): 按钮点击处理正确

### 2. 数据流检查 ✅
- **StoreHeader** → `handleRegistryFilterClick` 设置 `registryId` 参数
- **apps-page.store** → `loadStoreApps` 将 `registryId` 传递给 API
- **query.service** → `queryTyped` 检查 `params.registryId` 并路由到对应适配器

### 3. 适配器实现检查 ✅

#### SkillsHub 适配器
- API 端点: `https://api.skillhub.tencent.com/api/skills`
- 方法: GET
- 参数: page, pageSize, sortBy, order, keyword
- 响应处理: 支持 `list`, `skills`, `items` 三种字段名

#### ClawHub 适配器
- API 端点: `https://wry-manatee-359.convex.cloud/api/query`
- 方法: POST
- 格式: Convex encoded JSON
- 分页: 使用 cursor 机制

## 修复措施

### 代码修改
1. **SkillsHub 适配器** - 已更新字段映射：
   - `ownerName` → `author`
   - `created_at` → `created_at` (Date 转换)
   - 支持多种响应字段名 (`list`, `skills`, `items`)

2. **ClawHub 适配器** - 已实现 cursor 分页：
   - `getCursorForPage` 方法处理 Convex 分页
   - 正确映射 `skill.displayName`, `owner.displayName`

3. **查询服务** - 已添加 registryId 路由：
   - `queryTyped` 方法检查 `params.registryId`
   - 直接查询指定注册表，跳过其他源

### 构建验证
```bash
npm run build
# ✓ built in 14.68s
```

## 测试步骤

### 1. 启动应用
```bash
npm run dev
```

### 2. 测试 SkillsHub
1. 打开应用 → 进入"应用商店"
2. 点击 "Sources: SkillsHub" 按钮
3. **预期结果**: 显示腾讯 SkillsHub 的技能列表
4. **验证点**:
   - 第一个技能应为 "self-improving-agent" 或类似
   - 总数应显示 32,899 或接近数值
   - 技能来源应为 `skillshub`

### 3. 测试 ClawHub
1. 点击 "Sources: ClawHub" 按钮
2. **预期结果**: 显示 OpenClaw ClawHub 的技能列表
3. **验证点**:
   - 技能列表应与 SkillsHub 不同
   - 技能来源应为 `clawhub`
   - 显示 Convex API 返回的数据

### 4. 验证日志
查看主进程日志（终端输出）：
```
[SkillsHub] Fetching: https://api.skillhub.tencent.com/api/skills?...
[SkillsHub] Fetched 30 skills, total: 32899

[ClawHub] Fetching page 1, pageSize 30
[ClawHub] Fetched 30 skills, hasMore: true
```

## 调试信息

### 如果仍然显示相同内容

1. **检查浏览器控制台** (F12):
   ```javascript
   // 查看当前过滤状态
   useAppsPageStore.getState().storeRegistryFilter
   // 应该返回 'skillshub' 或 'clawhub'
   
   // 查看加载的应用列表
   useAppsPageStore.getState().storeApps
   // 检查每个应用的 meta 字段
   ```

2. **检查网络请求**:
   - 打开 DevTools → Network 标签
   - 点击 SkillsHub 按钮
   - 查找请求到 `api.skillhub.tencent.com` 或 `wry-manatee-359.convex.cloud`
   - 检查响应数据

3. **检查主进程日志**:
   - 查看终端输出中的 `[StoreQuery]` 日志
   - 应该看到 `source=skillshub` 或 `source=clawhub`

### 常见问题

#### Q: 点击后仍然显示"技能"按钮的内容
**A**: 可能是缓存问题
```bash
# 清除构建缓存
rm -rf out dist .vite
npm run build
npm run dev
```

#### Q: 显示 "Registry not found" 错误
**A**: 检查 `registry.service.ts` 中的 `BUILTIN_REGISTRIES` 是否包含 skillshub 和 clawhub

#### Q: API 请求失败
**A**: 
- SkillsHub: 检查网络连接，可能需要代理
- ClawHub: Convex API 可能需要特定的请求头

## 下一步

1. ✅ 代码已修复
2. ✅ 构建已成功
3. ⏳ 等待用户测试验证
4. ⏳ 根据测试结果进一步调整

## 相关文件

- `src/main/store/adapters/skillshub.adapter.ts`
- `src/main/store/adapters/clawhub.adapter.ts`
- `src/main/store/query.service.ts`
- `src/renderer/components/store/StoreHeader.tsx`
- `src/renderer/stores/apps-page.store.ts`
- `src/main/store/registry.service.ts`
- `src/main/store/adapters/index.ts`
