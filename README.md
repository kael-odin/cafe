# Cafe AI

<div align="center">

![Cafe Logo](resources/icon.png)

**Cafe 是一个以桌面端为主的 AI 工作空间，集成了聊天、工具、文件、浏览器自动化、技能、MCP 和数字人自动化于一体。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/kael-odin/cafe-ai)

</div>

---

## 📖 目录

- [功能特性](#-功能特性)
- [系统要求](#-系统要求)
- [快速开始](#-快速开始)
- [二进制依赖安装](#-二进制依赖安装)
- [开发指南](#-开发指南)
- [移动端应用](#-移动端应用)
- [项目结构](#-项目结构)
- [常见问题](#-常见问题)

---

## ✨ 功能特性

### 🤖 AI 对话空间

- **多空间管理**：创建独立的工作空间，每个空间有独立的对话历史和配置
- **多模型支持**：支持 Claude、OpenAI、Gemini、DeepSeek 等多种 AI 模型
- **流式输出**：实时显示 AI 回复，支持思考过程展示
- **对话历史**：自动保存对话历史，支持搜索和导出

### 📁 文件与代码管理

- **Artifacts 系统**：AI 生成的代码、文档、图片等自动保存为 Artifacts
- **代码高亮**：支持 20+ 种编程语言的语法高亮
- **实时预览**：支持 Markdown、HTML、图片等内容的实时预览
- **文件操作**：支持创建、编辑、删除文件和目录

### 🌐 浏览器自动化

- **AI 浏览器**：让 AI 控制浏览器执行任务
- **网页截图**：自动截取网页内容
- **表单填写**：自动填写网页表单
- **数据抓取**：从网页中提取结构化数据

### 🛠️ 扩展系统

- **应用商店**：安装和管理第三方应用
- **技能系统**：创建和使用自定义技能
- **MCP 协议**：支持 Model Context Protocol 扩展
- **注册表**：管理 AI 模型和工具的注册表

### 📱 远程访问

- **局域网访问**：在同一网络下通过手机/平板访问
- **Cloudflare 隧道**：通过 Cloudflare Tunnel 实现外网访问
- **二维码连接**：扫描二维码快速连接移动端应用

### 🎨 界面特性

- **深色主题**：精心设计的深色主题，保护眼睛
- **响应式布局**：适配不同屏幕尺寸
- **樱花动效**：优雅的樱花飘落动画效果
- **安全区域适配**：完美适配刘海屏和底部手势区域

---

## 💻 系统要求

### 桌面端

| 操作系统 | 最低版本 | 推荐配置 |
|---------|---------|---------|
| Windows | Windows 10 | Windows 11 |
| macOS | macOS 11 (Big Sur) | macOS 14 (Sonoma) |
| Linux | Ubuntu 20.04 | Ubuntu 22.04 |

### 移动端

| 平台 | 最低版本 |
|-----|---------|
| Android | Android 8.0 (API 26) |
| iOS | iOS 14.0 |

### 开发环境

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **yarn**: >= 1.22.0
- **Java JDK**: 21 (用于 Android 构建)
- **Git**: 最新版本

---

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/kael-odin/cafe-ai.git
cd cafe-ai
```

### 2. 安装依赖

```bash
npm install
```

### 3. 准备二进制依赖

```bash
npm run prepare
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 构建生产版本

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

---

## 📦 二进制依赖安装

Cafe 依赖以下二进制文件才能正常运行：

### Cloudflared

用于创建 Cloudflare Tunnel 实现远程访问功能。

**自动安装（推荐）**

```bash
npm run prepare
```

**手动安装**

1. 访问 [Cloudflared Releases](https://github.com/cloudflare/cloudflared/releases)
2. 下载对应平台的二进制文件：
   - **Windows**: `cloudflared-windows-amd64.exe`
   - **macOS (Apple Silicon)**: `cloudflared-darwin-arm64.tgz`
   - **macOS (Intel)**: `cloudflared-darwin-amd64.tgz`
   - **Linux**: `cloudflared-linux-amd64`
3. 将文件放置到 `node_modules/cloudflared/bin/` 目录

### Better-SQLite3

用于本地数据库存储，存储对话历史和配置。

**自动编译**

```bash
npm run postinstall
```

**手动编译**

```bash
npx electron-rebuild -f -w better-sqlite3
```

### @parcel/watcher

用于监听文件系统变化，实现实时文件同步。

**自动安装**

```bash
npm run prepare
```

**平台特定包**

- **Windows**: `@parcel/watcher-win32-x64`
- **macOS (Apple Silicon)**: `@parcel/watcher-darwin-arm64`
- **macOS (Intel)**: `@parcel/watcher-darwin-x64`
- **Linux**: `@parcel/watcher-linux-x64-glibc`

### 验证安装

运行以下命令验证所有二进制依赖是否正确安装：

```bash
npm run test:check
```

---

## 🔧 开发指南

### 项目结构

```
cafe-ai/
├── src/
│   ├── main/           # Electron 主进程代码
│   │   ├── services/   # 后端服务
│   │   └── index.ts    # 主进程入口
│   ├── preload/        # 预加载脚本
│   │   └── index.ts    # 预加载入口
│   └── renderer/       # 渲染进程代码（React）
│       ├── components/ # React 组件
│       ├── pages/      # 页面组件
│       ├── stores/     # Zustand 状态管理
│       ├── hooks/      # 自定义 Hooks
│       ├── api/        # API 客户端
│       └── assets/     # 静态资源
├── resources/          # 应用资源
│   └── icon.png        # 应用图标
├── android/            # Android 项目
├── ios/                # iOS 项目
├── scripts/            # 构建脚本
└── tests/              # 测试文件
```

### 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产代码
npm run start            # 预览生产构建

# 代码质量
npm run lint             # 运行 ESLint
npm run lint:fix         # 自动修复 ESLint 问题
npm run typecheck        # TypeScript 类型检查

# 测试
npm run test:unit        # 运行单元测试
npm run test:e2e         # 运行端到端测试

# 国际化
npm run i18n             # 提取并翻译国际化字符串
```

### 环境变量

| 变量名 | 说明 | 默认值 |
|-------|------|-------|
| `CAFE_DATA_DIR` | 数据存储目录 | `~/.cafe` |
| `CAFE_LOG_LEVEL` | 日志级别 | `info` |

---

## 📱 移动端应用

### Android 构建

#### 环境准备

1. **安装 Java JDK 21**

   ```bash
   # Windows (使用 scoop)
   scoop install openjdk21

   # macOS (使用 Homebrew)
   brew install openjdk@21

   # Linux (Ubuntu)
   sudo apt install openjdk-21-jdk
   ```

2. **配置环境变量**

   **Windows:**
   ```powershell
   # 设置 JAVA_HOME
   [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "User")

   # 添加到 PATH
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";%JAVA_HOME%\bin", "User")
   ```

   **macOS/Linux:**
   ```bash
   # 添加到 ~/.bashrc 或 ~/.zshrc
   export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
   export PATH=$JAVA_HOME/bin:$PATH
   ```

3. **安装 Android SDK**
   - 安装 [Android Studio](https://developer.android.com/studio)
   - 通过 Android Studio 安装 Android SDK

#### 构建 APK

```bash
# 同步 Capacitor 资源
npm run cap:sync

# 构建 Debug APK
npm run build:android:debug

# 构建 Release APK
npm run release:android
```

构建完成后，APK 文件位于 `dist/Cafe-{version}.apk`。

### iOS 构建

```bash
# 同步 Capacitor 资源
npm run cap:sync

# 打开 Xcode
npm run cap:open:ios

# 或直接运行
npm run cap:run:ios
```

---

## 🏗️ 项目结构详解

### 核心模块

#### 主进程 (Main Process)

- **remote.service.ts**: 远程访问服务，处理局域网和 Cloudflare Tunnel 连接
- **agent.service.ts**: AI Agent 服务，处理对话和工具调用
- **canvas.service.ts**: Canvas 服务，管理内容渲染
- **mcp.service.ts**: MCP 协议服务，处理扩展通信

#### 渲染进程 (Renderer Process)

- **SpacePage**: 空间页面，包含聊天界面和 Artifacts
- **AppsPage**: 应用商店页面
- **SettingsPage**: 设置页面
- **HomePage**: 首页

#### 状态管理 (Zustand Stores)

- **app.store.ts**: 应用全局状态
- **space.store.ts**: 空间管理状态
- **chat.store.ts**: 聊天状态
- **canvas.store.ts**: Canvas 状态

---

## ❓ 常见问题

### 1. 二进制依赖安装失败

**问题**: `npm run prepare` 报错

**解决方案**:
```bash
# 清除 node_modules 重新安装
rm -rf node_modules
npm install

# 手动安装二进制依赖
npm run prepare
```

### 2. Android 构建失败

**问题**: `Unsupported class file major version 69`

**解决方案**:
确保使用 Java JDK 21，而不是更高版本。

```bash
# 检查 Java 版本
java -version

# 应该显示类似
# openjdk version "21.x.x"
```

### 3. 远程访问无法连接

**问题**: 扫描二维码后连接超时

**解决方案**:
1. 确保手机和电脑在同一局域网
2. 检查防火墙设置，确保端口未被阻止
3. 如果使用 VPN/代理，尝试关闭后重试

### 4. 移动端键盘遮挡输入框

**问题**: 输入法键盘弹出后遮挡输入框

**解决方案**:
这是已知的移动端适配问题，已在 2.1.0 版本中修复。请确保使用最新版本。

### 5. macOS 无法打开应用

**问题**: "无法验证开发者"

**解决方案**:
```bash
# 移除隔离属性
xattr -cr /Applications/Cafe.app
```

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解详情。

---

## 📞 联系方式

- **GitHub Issues**: [https://github.com/kael-odin/cafe-ai/issues](https://github.com/kael-odin/cafe-ai/issues)
- **GitHub Repository**: [https://github.com/kael-odin/cafe-ai](https://github.com/kael-odin/cafe-ai)

---

<div align="center">

**Made with ❤️ by Cafe Team**

</div>
