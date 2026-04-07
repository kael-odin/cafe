# 🔧 完整调试和修复指南

## 问题诊断

根据你的日志，问题已经定位：

### 错误 1：SkillsHub 适配器错误
```
TypeError: Cannot read properties of undefined (reading 'map')
```

**原因：** 代码没有重新构建，还在运行旧代码

### 错误 2：ClawHub 适配器错误
```
ClawHub requires CLI tool. Install with: npm i -g clawhub
```

**原因：** 代码没有重新构建，还在运行旧代码

---

## 🚀 解决方案

### 方案 1：强制重新构建（推荐）

**Windows PowerShell:**
```powershell
# 在项目根目录执行
.\scripts\force-rebuild.ps1
```

**Linux/Mac:**
```bash
# 在项目根目录执行
chmod +x scripts/force-rebuild.sh
./scripts/force-rebuild.sh
```

### 方案 2：手动清理和重建

**步骤 1：停止应用**
```bash
# 按 Ctrl+C 停止运行的应用
# 或者在 PowerShell 中执行：
Get-Process -Name "electron" | Stop-Process -Force
```

**步骤 2：清理构建输出**
```bash
# Windows
Remove-Item -Path "out" -Recurse -Force
Remove-Item -Path "dist" -Recurse -Force
Remove-Item -Path ".vite" -Recurse -Force
Remove-Item -Path "node_modules\.vite" -Recurse -Force

# Linux/Mac
rm -rf out dist .vite node_modules/.vite
```

**步骤 3：重新构建**
```bash
npm run build
```

**步骤 4：启动应用**
```bash
npm run dev
```

---

## 📊 验证步骤

### 步骤 1：检查主进程日志

启动应用后，查看终端输出，应该看到：

```
[StoreQuery] source=skillshub type=skill status=request-start
[SkillsHub] Fetching: https://api.skillhub.tencent.com/api/skills?page=1&pageSize=30&sortBy=score&order=desc
[SkillsHub] Fetched 30 skills, total: 32899
[StoreQuery] source=skillshub type=skill status=request-done items=30 total=32899
```

**如果看到错误：**
- 复制完整的错误信息
- 检查是否还有 `TypeError: Cannot read properties of undefined`
- 如果有，说明代码还是没有更新

### 步骤 2：检查前端显示

1. 进入 "应用商店" 页面
2. 点击 "SkillsHub" 按钮
3. 查看是否显示技能列表

**预期结果：**
- 显示 32,899 个技能
- 第一个技能是 "self-improving-agent"
- 显示下载量、星标等信息

**如果显示的是"技能"按钮的内容：**
- 说明前端缓存问题
- 按 `Ctrl+Shift+R` 强制刷新
- 或清除应用缓存

### 步骤 3：检查浏览器控制台

按 `Ctrl+Shift+I` 打开开发者工具，查看 Console 标签：

**应该没有错误。**

**如果有错误：**
- 复制完整的错误信息
- 检查 Network 标签中的请求
- 查看请求是否成功

---

## 🐛 常见问题排查

### 问题 1：代码没有更新

**症状：**
- 日志显示旧错误
- 适配器行为没有变化

**解决方案：**
```bash
# 强制清理所有缓存
npm run clean  # 如果有这个命令
# 或手动删除
rm -rf out dist .vite node_modules/.vite

# 重新构建
npm run build
```

### 问题 2：前端显示旧数据

**症状：**
- 主进程日志正确
- 但前端显示的是旧数据

**解决方案：**
```bash
# 方案 1：强制刷新
按 Ctrl+Shift+R

# 方案 2：清除应用数据
# 找到应用数据目录并删除缓存
```

### 问题 3：TypeScript 编译错误

**症状：**
- 构建失败
- TypeScript 类型错误

**解决方案：**
```bash
# 检查 TypeScript 错误
npx tsc --noEmit

# 如果有错误，修复后再构建
npm run build
```

---

## 📝 修改的文件清单

### 已修改的文件：

1. **src/main/store/adapters/skillshub.adapter.ts**
   - ✅ 更新接口定义（`page` 和 `pageSize` 可选）
   - ✅ 更新字段映射（`ownerName`、`created_at` 等）
   - ✅ 添加中文描述支持
   - ✅ 修复 `skills` 字段访问

2. **src/main/store/adapters/clawhub.adapter.ts**
   - ✅ 实现 Convex API 支持
   - ✅ 添加 Cursor 分页
   - ✅ 添加技能统计信息

### 需要检查的配置文件：

1. **src/main/store/registry.service.ts**
   - ✅ 已包含 SkillsHub 和 ClawHub 配置
   - ✅ `sourceType` 正确设置

2. **src/main/store/adapters/index.ts**
   - ✅ 已注册适配器
   - ✅ 映射关系正确

---

## 🎯 成功标准

### SkillsHub 成功标准：
- [ ] 主进程日志显示 `[SkillsHub] Fetched 30 skills, total: 32899`
- [ ] 前端显示 32,899 个技能
- [ ] 第一个技能是 "self-improving-agent"
- [ ] 显示下载量（392,066）
- [ ] 显示星标（2,755）

### ClawHub 成功标准：
- [ ] 主进程日志显示 `[ClawHub] Fetched X skills`
- [ ] 前端显示技能列表
- [ ] 显示技能统计信息

---

## 📞 如果还有问题

### 请提供以下信息：

1. **主进程日志**
   ```
   复制终端中的所有输出
   ```

2. **浏览器控制台日志**
   ```
   按 Ctrl+Shift+I 打开开发者工具
   复制 Console 标签中的所有内容
   ```

3. **Network 标签**
   ```
   打开 Network 标签
   刷新页面
   查找 skills 相关的请求
   截图或复制请求详情
   ```

4. **构建输出**
   ```
   复制 npm run build 的输出
   ```

---

## 🚀 快速命令

```bash
# 1. 停止应用
Ctrl+C

# 2. 清理缓存
rm -rf out dist .vite node_modules/.vite

# 3. 重新构建
npm run build

# 4. 启动应用
npm run dev

# 5. 检查日志
# 查看终端输出，确认是否有 [SkillsHub] 和 [ClawHub] 的日志
```

---

## 💡 提示

### 为什么代码没有更新？

**可能的原因：**

1. **构建缓存**
   - Vite 缓存了旧的编译结果
   - 需要清理 `.vite` 和 `node_modules/.vite`

2. **TypeScript 缓存**
   - TypeScript 编译器缓存了旧的类型信息
   - 需要清理 `out` 和 `dist` 目录

3. **Electron 缓存**
   - Electron 可能缓存了旧的代码
   - 需要完全重启应用

### 如何确保代码更新？

```bash
# 最彻底的清理方式
rm -rf out dist .vite node_modules/.vite
npm run build
npm run dev
```

---

## 🎉 预期结果

完成以上步骤后，你应该能够：

1. ✅ 点击 SkillsHub 按钮，看到 32,899 个技能
2. ✅ 点击 ClawHub 按钮，看到技能列表
3. ✅ 主进程日志显示正确的请求和响应
4. ✅ 浏览器控制台没有错误

---

## 📅 更新记录

**2026-04-07 16:02**
- 创建完整的调试和修复指南
- 提供强制重新构建脚本
- 详细说明验证步骤

**如果按照这个指南操作后还有问题，请提供完整的日志信息！**
