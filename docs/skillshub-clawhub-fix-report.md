# SkillsHub/ClawHub 按钮问题修复报告

## 问题描述

点击 SkillsHub 和 ClawHub 按钮后，显示的内容与"技能"按钮完全相同。

## 根本原因

**API 类型定义缺少 `registryId` 参数**！

### 问题代码
```typescript
// src/renderer/api/index.ts (修复前)
storeQuery: async (params: { 
  search?: string; 
  type?: string; 
  category?: string; 
  page?: number; 
  pageSize?: number; 
  locale?: string 
  // ❌ 缺少 registryId 参数！
}): Promise<ApiResponse> => { ... }
```

### 数据流问题
1. **前端** (`StoreHeader.tsx`) → 正确设置 `registryId: 'skillshub'`
2. **Store** (`apps-page.store.ts`) → 正确传递 `registryId` 参数
3. **API** (`api/index.ts`) → ❌ **类型定义中没有 `registryId`，参数被丢弃！**
4. **后端** (`query.service.ts`) → 收到的请求没有 `registryId`，查询所有技能源

### 日志证据
```
16:12:58.254 > [StoreQuery] source=claude-skills type=skill status=local-query items=30 total=99
16:12:58.255 > [StoreQuery] source=skillshub type=skill status=cache-hit items=30 total=32904
```
可以看到系统同时查询了 `claude-skills` 和 `skillshub` 两个源，而不是只查询 `skillshub`。

## 修复方案

### 1. 添加 `registryId` 参数到 API 类型定义

```typescript
// src/renderer/api/index.ts (修复后)
storeQuery: async (params: { 
  search?: string; 
  type?: string; 
  category?: string; 
  page?: number; 
  pageSize?: number; 
  locale?: string; 
  registryId?: string  // ✅ 添加此参数
}): Promise<ApiResponse> => { ... }
```

### 2. 验证后端逻辑

后端 `query.service.ts` 已经正确实现了 `registryId` 路由：

```typescript
private async queryTyped(params: StoreQueryParams, registries: RegistrySource[]): Promise<StoreQueryResponse> {
  const enabled = registries.filter(r => r.enabled)

  // If registryId is specified, only query that specific registry
  if (params.registryId) {
    const targetRegistry = enabled.find(r => r.id === params.registryId)
    if (!targetRegistry) {
      console.log(`[StoreQuery] Registry not found: ${params.registryId}`)
      return { items: [], total: 0, hasMore: false, sources: [] }
    }

    const adapter = getAdapter(targetRegistry)
    
    if (adapter?.strategy === 'proxy' && adapter.query) {
      // ✅ 只查询指定的注册表
      const result = await adapter.query(targetRegistry, params)
      return {
        items: result.items,
        total: result.total ?? result.items.length,
        hasMore: result.hasMore,
        sources: [{ registryId: targetRegistry.id, status: 'ok' }],
      }
    }
  }
  // ... 其他逻辑
}
```

## 修复验证

### 构建状态
```bash
npm run build
# ✓ built in 14.07s
```

### 预期行为

#### 点击 SkillsHub 按钮后：
```
[StoreQuery] source=skillshub type=skill status=request-start
[SkillsHub] Fetching: https://api.skillhub.tencent.com/api/skills?...
[SkillsHub] Fetched 30 skills, total: 32904
[StoreQuery] source=skillshub type=skill status=request-done items=30 total=32904
```
**只显示 SkillsHub 的技能，不包含其他源**

#### 点击 ClawHub 按钮后：
```
[StoreQuery] source=clawhub type=skill status=request-start
[ClawHub] Fetching page 1, pageSize 30
[ClawHub] Fetched 30 skills, hasMore: true
[StoreQuery] source=clawhub type=skill status=request-done items=30
```
**只显示 ClawHub 的技能，不包含其他源**

#### 点击"技能"按钮后：
```
[StoreQuery] source=claude-skills type=skill status=local-query items=30 total=99
[StoreQuery] source=skillshub type=skill status=cache-hit items=30 total=32904
[StoreQuery] source=clawhub type=skill status=cache-hit items=30
```
**显示所有技能源的合并结果**

## 测试步骤

1. **重启应用**（确保使用最新构建）
   ```bash
   npm run dev
   ```

2. **测试 SkillsHub**
   - 点击 "Sources: SkillsHub" 按钮
   - 验证日志只显示 `source=skillshub`
   - 验证技能列表与其他按钮不同

3. **测试 ClawHub**
   - 点击 "Sources: ClawHub" 按钮
   - 验证日志只显示 `source=clawhub`
   - 验证技能列表与其他按钮不同

4. **测试"技能"按钮**
   - 点击 "Skill" 按钮
   - 验证日志显示多个源（claude-skills, skillshub, clawhub）
   - 验证显示合并后的技能列表

## 关键修改

- **文件**: `src/renderer/api/index.ts`
- **行号**: 1630
- **修改**: 添加 `registryId?: string` 参数到 `storeQuery` 函数类型定义

## 相关文件

- `src/renderer/api/index.ts` - API 类型定义（已修复）
- `src/renderer/stores/apps-page.store.ts` - Store 状态管理
- `src/renderer/components/store/StoreHeader.tsx` - 前端按钮处理
- `src/main/store/query.service.ts` - 后端查询路由
- `src/main/store/adapters/skillshub.adapter.ts` - SkillsHub 适配器
- `src/main/store/adapters/clawhub.adapter.ts` - ClawHub 适配器

## 总结

这是一个**类型定义缺失**导致的 bug。前端代码正确传递了 `registryId` 参数，但由于 API 类型定义中没有这个字段，TypeScript 编译器没有报错，参数在传递过程中被丢弃。

修复后，每个按钮将正确显示各自平台的技能列表，不再合并展示。
