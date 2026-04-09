# MinerU 集成完整指南

本文档说明如何在 Cafe-AI 中安装、配置和使用 MinerU 文档解析功能。

## 目录

1. [快速开始](#快速开始)
2. [安装方式](#安装方式)
3. [配置说明](#配置说明)
4. [使用方法](#使用方法)
5. [故障排除](#故障排除)
6. [开发者指南](#开发者指南)

---

## 快速开始

### 方式一：自动安装（推荐）

MinerU 已预装在 Cafe-AI 中，开箱即用：

1. 启动 Cafe-AI
2. MinerU 自动安装并配置
3. 在对话中直接使用：`解析这个 PDF 文件：/path/to/document.pdf`

### 方式二：手动安装

如果需要重新安装或配置：

1. 打开 Cafe-AI 设置 → 应用
2. 找到 "MinerU 文档解析"
3. 点击"安装"
4. 配置参数（见下文）

---

## 安装方式

### 前置要求

#### 本地模式

本地模式需要安装 MinerU Python 包：

```bash
# 安装 MinerU
pip install mineru

# 验证安装
mineru-api --version

# 启动服务（可选，Cafe-AI 会自动启动）
mineru-api --port 18000
```

**系统要求：**

| 组件 | 最低要求 | 推荐配置 |
|------|---------|---------|
| CPU | 4核 | 8核+ |
| 内存 | 16GB | 32GB+ |
| GPU | 4GB VRAM | 8GB+ VRAM |
| 存储 | 10GB | 20GB+ |

#### 远程模式

远程模式无需本地安装，使用 MinerU 云服务：

1. 注册 [MinerU Cloud](https://mineru.net) 账号
2. 获取 API Key
3. 在 Cafe-AI 中配置远程 URL

---

## 配置说明

### 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| **服务模式** | 选择 | 本地 | 本地或远程服务 |
| **远程 API 地址** | URL | - | 远程模式下的 API 端点 |
| **本地服务端口** | 数字 | 18000 | 本地服务监听端口 |
| **解析后端** | 选择 | hybrid-auto-engine | 文档解析引擎 |
| **默认语言** | 选择 | 中文/英文 | 文档默认语言 |
| **启用公式解析** | 布尔 | 是 | 解析数学公式为 LaTeX |
| **启用表格解析** | 布尔 | 是 | 解析表格为 HTML |
| **自动启动服务** | 布尔 | 是 | 需要时自动启动服务 |

### 解析后端说明

| 后端 | 特点 | 适用场景 |
|------|------|---------|
| **hybrid-auto-engine** | 高精度，多语言 | 推荐，通用场景 |
| **pipeline** | 通用型，无幻觉 | 复杂布局文档 |
| **vlm-auto-engine** | 高精度，中英文 | 中英文文档 |

### 语言支持

| 语言代码 | 支持语言 |
|---------|---------|
| `ch` | 中文、英文、繁体中文 |
| `en` | 英文 |
| `korean` | 韩文、英文 |
| `japan` | 日文、中文、英文 |

---

## 使用方法

### 基本用法

在 Cafe-AI 对话中直接请求解析文档：

```
用户：解析这个 PDF 文件：/Users/user/Documents/report.pdf

Agent：我将使用 MinerU 解析这个 PDF 文件。

[调用 parse_document 工具]

✅ 成功解析：report.pdf

## Markdown 内容：
# 年度报告

## 摘要
本报告总结了...
```

### 批量解析

```
用户：解析这个文件夹中的所有 PDF 文件：/Users/user/Documents/

Agent：我将批量解析这些文件。

[调用 parse_documents_batch 工具]

✅ 成功解析 3 个文件：
- report1.pdf
- report2.pdf
- report3.pdf
```

### 大文档异步解析

对于大型文档（100+ 页），建议使用异步模式：

```
用户：解析这个大型 PDF（200页）：/path/to/large.pdf

Agent：这是一个大型文档，我将使用异步模式解析。

[调用 submit_async_task 工具]

⏳ 任务已提交
任务 ID: abc-123-def
状态: pending

您可以继续其他工作，我会稍后通知您结果。

[一段时间后...]

Agent：您的文档已解析完成！

[调用 get_task_result 工具]

✅ 解析完成：large.pdf
```

### 指定页面范围

```
用户：只解析这个 PDF 的第 10-20 页

Agent：我将只解析指定页面。

[调用 parse_document 工具，参数 start_page=9, end_page=19]
```

### 禁用公式/表格解析

```
用户：解析这个 PDF，但不需要解析公式

Agent：好的，我将禁用公式解析。

[调用 parse_document 工具，参数 formula_enable=false]
```

---

## 故障排除

### 问题：服务无法启动

**症状：** 点击解析后提示"MinerU 服务未启动"

**解决方案：**

1. 检查端口是否被占用：
   ```bash
   # macOS/Linux
   lsof -i :18000
   
   # Windows
   netstat -ano | findstr :18000
   ```

2. 手动启动服务：
   ```bash
   mineru-api --port 18000
   ```

3. 检查 Python 环境：
   ```bash
   python --version  # 需要 Python 3.10+
   pip show mineru   # 检查 MinerU 是否安装
   ```

### 问题：解析失败

**症状：** 解析过程中出现错误

**解决方案：**

1. 检查文件格式（支持 PDF、DOCX、图片）
2. 检查文件大小（建议 < 100MB）
3. 检查内存是否充足
4. 尝试不同的解析后端

### 问题：内存不足

**症状：** 解析大型文档时崩溃

**解决方案：**

1. 使用异步模式：`submit_async_task`
2. 减少并发：关闭其他应用
3. 使用远程模式：上传到 MinerU Cloud

### 问题：公式识别不准确

**症状：** LaTeX 公式格式错误

**解决方案：**

1. 确保启用了公式解析
2. 尝试 `hybrid-auto-engine` 后端
3. 检查文档语言设置是否正确

---

## 开发者指南

### MCP 工具列表

MinerU 提供以下 MCP 工具：

#### `parse_document`

解析单个文档。

**参数：**
```typescript
{
  file_path: string       // 文档路径（必需）
  lang?: string           // 语言代码
  backend?: string        // 解析后端
  parse_method?: string   // 解析方法
  formula_enable?: boolean
  table_enable?: boolean
  return_images?: boolean
  start_page?: number
  end_page?: number
}
```

**返回：**
```typescript
{
  fileName: string
  markdown?: string
  images?: Record<string, string>  // base64
  error?: string
}
```

#### `parse_documents_batch`

批量解析多个文档。

**参数：**
```typescript
{
  file_paths: string[]  // 文档路径列表
  // ... 其他参数同 parse_document
}
```

#### `submit_async_task`

提交异步解析任务。

**返回：**
```typescript
{
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  statusUrl: string
  resultUrl: string
}
```

#### `get_task_status`

查询任务状态。

#### `get_task_result`

获取任务结果。

#### `health_check`

检查服务健康状态。

### 集成到自定义应用

如果您想在自定义应用中使用 MinerU：

```typescript
import { getMinerUService } from './services/mineru'

// 初始化服务
const mineruService = getMinerUService()
await mineruService.initialize({
  mode: 'local',
  port: 18000,
  backend: 'hybrid-auto-engine',
  defaultLang: 'ch',
})

// 解析文档
const result = await mineruService.parseDocument({
  filePath: '/path/to/document.pdf',
  lang: 'ch',
})

console.log(result.markdown)
```

---

## 性能优化

### 内存配置

根据文档大小调整内存：

| 文档大小 | 推荐内存 | 推荐后端 |
|---------|---------|---------|
| < 10 页 | 8GB | pipeline |
| 10-50 页 | 16GB | hybrid-auto-engine |
| 50-100 页 | 32GB | hybrid-auto-engine |
| > 100 页 | 32GB+ | 异步模式 |

### GPU 加速

启用 GPU 加速可显著提升速度：

```bash
# 检查 CUDA
python -c "import torch; print(torch.cuda.is_available())"

# 使用 GPU 后端
mineru-api --port 18000 --backend vlm-auto-engine
```

### 并发配置

调整并发请求数：

```bash
export MINERU_MAX_CONCURRENT_REQUESTS=2
mineru-api --port 18000
```

---

## 更多资源

- [MinerU 官方文档](https://github.com/opendatalab/MinerU)
- [Cafe-AI 文档](https://github.com/kael-odin/cafe-ai)
- [问题反馈](https://github.com/kael-odin/cafe-ai/issues)

---

## 更新日志

### v1.0.0 (2026-04-09)

- ✅ 初始集成
- ✅ 支持 PDF/DOCX/图片解析
- ✅ 支持本地和远程模式
- ✅ 支持公式和表格识别
- ✅ 中文界面支持
