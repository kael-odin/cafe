# SkillsHub/ClawHub 独立显示问题 - 最终修复报告

## 问题描述

用户期望：
- **SkillsHub 按钮**：只显示腾讯 SkillsHub 的技能
- **ClawHub 按钮**：只显示 OpenClaw ClawHub 的技能
- **技能按钮**：只显示 Claude Skills Registry 的技能

实际情况：
- 三个按钮显示的内容完全相同（合并了所有三个源的技能）

## 根本原因

**IPC 层和 HTTP 路由层都没有接收和传递 `registryId` 参数！**

### 数据流断裂点

```
前端 (StoreHeader.tsx)
  ↓ ✅ 正确设置 registryId: 'skillshub'
Store (apps-page.store.ts)
  ↓ ✅ 正确传递 registryId 参数
API 层 (api/index.ts)
  ↓ ✅ 类型定义已添加 registryId
IPC 层 (ipc/store.ts)
  ↓ ❌ 没有接收 registryId 参数！
后端 (query.service.ts)
  ↓ ❌ 收到的请求没有 registryId，查询所有源
```

### 日志证据

```
16:20:23.966 > [StoreQuery] source=claude-skills items=30  # ❌ 不应该查询
16:20:23.967 > [StoreQuery] source=skillshub items=30      # ✅ 应该只查询这个
16:20:23.969 > [StoreQuery] source=clawhub items=30        # ❌ 不应该查询
16:20:23.969 > [StoreQuery] done items=90 total=33007 sources=3
```

可以看到系统查询了所有三个源并合并了结果。

## 修复方案

### 1. 修复 IPC 层

**文件**: `src/main/ipc/store.ts` (第 30 行)

```typescript
// 修复前 ❌
ipcMain.handle(
  'store:query',
  async (_event, params: { 
    search?: string; 
    type?: string; 
    category?: string; 
    page?: number; 
    pageSize?: number; 
    locale?: string 
    // ❌ 缺少 registryId
  }) => {
    const queryParams: StoreQueryParams = {
      search: params.search,
      type: params.type as StoreQueryParams['type'],
      category: params.category,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      locale: params.locale,
      // ❌ 没有 registryId
    }
    return storeController.queryStoreApps(queryParams)
  }
)

// 修复后 ✅
ipcMain.handle(
  'store:query',
  async (_event, params: { 
    search?: string; 
    type?: string; 
    category?: string; 
    page?: number; 
    pageSize?: number; 
    locale?: string; 
    registryId?: string  // ✅ 添加此参数
  }) => {
    const queryParams: StoreQueryParams = {
      search: params.search,
      type: params.type as StoreQueryParams['type'],
      category: params.category,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      locale: params.locale,
      registryId: params.registryId,  // ✅ 传递此参数
    }
    return storeController.queryStoreApps(queryParams)
  }
)
```

### 2. 修复 HTTP 路由

**文件**: `src/main/http/routes/index.ts` (第 1337 行)

```typescript
// 修复前 ❌
const { search, type, category, page, pageSize, locale } = req.body
const result = await storeController.queryStoreApps({
  search: typeof search === 'string' ? search : undefined,
  type: typeof type === 'string' ? type as ... : undefined,
  category: typeof category === 'string' ? category : undefined,
  page: typeof page === 'number' ? page : 1,
  pageSize: typeof pageSize === 'number' ? pageSize : 20,
  locale: typeof locale === 'string' ? locale : undefined,
  // ❌ 没有 registryId
})

// 修复后 ✅
const { search, type, category, page, pageSize, locale, registryId } = req.body
const result = await storeController.queryStoreApps({
  search: typeof search === 'string' ? search : undefined,
  type: typeof type === 'string' ? type as ... : undefined,
  category: typeof category === 'string' ? category : undefined,
  page: typeof page === 'number' ? page : 1,
  pageSize: typeof pageSize === 'number' ? pageSize : 20,
  locale: typeof locale === 'string' ? locale : undefined,
  registryId: typeof registryId === 'string' ? registryId : undefined,  // ✅ 添加此参数
})
```

## 验证

### 构建状态
```bash
npm run build
# ✓ built in 13.28s
```

### 预期行为

#### 点击 SkillsHub 按钮
```
[StoreQuery] source=skillshub type=skill status=request-start
[SkillsHub] Fetching: https://api.skillhub.tencent.com/api/skills?...
[SkillsHub] Fetched 30 skills, total: 32904
[StoreQuery] done items=30 total=32904 sources=1  # ✅ 只有 1 个源
```

#### 点击 ClawHub 按钮
```
[StoreQuery] source=clawhub type=skill status=request-start
[ClawHub] Fetching page 1, pageSize 30
[ClawHub] Fetched 30 skills, hasMore: true
[StoreQuery] done items=30 sources=1  # ✅ 只有 1 个源
```

#### 点击"技能"按钮
```
[StoreQuery] source=claude-skills items=30 total=99
[StoreQuery] done items=30 total=99 sources=1  # ✅ 只有 claude-skills
```

**注意**：根据用户需求，"技能"按钮应该只显示 Claude Skills Registry 的技能，而不是合并所有源。

### 如果"技能"按钮需要显示所有技能源

需要修改前端逻辑，让"技能"按钮不设置 `registryId`：

```typescript
// StoreHeader.tsx
const handleTypeFilterClick = useCallback((typeId: AppType | null) => {
  setStoreTypeFilter(typeId)
  setStoreRegistryFilter(null)  // 清除 registry 过滤
  const state = useAppsPageStore.getState()
  void loadStoreApps({
    search: state.storeSearchQuery || undefined,
    category: state.storeCategory ?? undefined,
    type: typeId ?? undefined,
    // 不设置 registryId，查询所有源
  })
}, [setStoreTypeFilter, setStoreRegistryFilter, loadStoreApps])
```

## 测试步骤

1. **重启应用**（确保使用最新构建）
   ```bash
   npm run dev
   ```

2. **测试 SkillsHub 按钮**
   - 点击 "Sources: SkillsHub"
   - 验证日志：`source=skillshub` 且 `sources=1`
   - 验证技能列表：只显示腾讯 SkillsHub 的技能

3. **测试 ClawHub 按钮**
   - 点击 "Sources: ClawHub"
   - 验证日志：`source=clawhub` 且 `sources=1`
   - 验证技能列表：只显示 OpenClaw ClawHub 的技能

4. **测试"技能"按钮**
   - 点击 "Skill" 按钮
   - 验证日志：`source=claude-skills` 且 `sources=1`
   - 验证技能列表：只显示 Claude Skills Registry 的技能

## 关键修改

| 文件 | 行号 | 修改内容 |
|------|------|----------|
| `src/renderer/api/index.ts` | 1630 | 添加 `registryId?: string` 参数到类型定义 |
| `src/main/ipc/store.ts` | 30 | IPC 处理器接收并传递 `registryId` 参数 |
| `src/main/http/routes/index.ts` | 1337 | HTTP 路由接收并传递 `registryId` 参数 |

## 总结

这是一个**多层参数传递缺失**的 bug：

1. **前端 API 类型定义** - 已在上一轮修复
2. **IPC 层参数接收** - 本轮修复 ✅
3. **HTTP 路由参数接收** - 本轮修复 ✅

现在 `registryId` 参数可以正确从前端传递到后端，实现三个按钮的独立显示功能。

## 后续优化建议

1. **类型安全**：为 IPC 和 HTTP 路由添加完整的类型定义，避免参数遗漏
2. **日志增强**：在 IPC 层添加参数日志，便于调试
3. **单元测试**：为参数传递链路添加集成测试
