# MinerU 快速开始指南

## 🎯 5 分钟快速上手

### 方式一：自动安装（推荐）

MinerU 已预装在 Cafe-AI 中，开箱即用！

```bash
# 1. 启动 Cafe-AI
npm run dev

# 2. 在对话中直接使用
用户：解析这个 PDF 文件：/path/to/document.pdf

# 完成！Agent 会自动调用 MinerU 解析文档
```

### 方式二：本地模式（需要 Python）

如果需要使用本地模式（更强大的解析能力）：

```bash
# 1. 安装 MinerU Python 包
pip install mineru

# 2. 验证安装
mineru-api --version

# 3. 启动 Cafe-AI
npm run dev

# 4. 在设置中配置
# 设置 → 应用 → MinerU → 服务模式 → 本地
```

### 方式三：远程模式（无需 Python）

使用 MinerU 云服务，无需本地安装：

```bash
# 1. 启动 Cafe-AI
npm run dev

# 2. 在设置中配置
# 设置 → 应用 → MinerU → 服务模式 → 远程
# 远程 API 地址：https://api.mineru.net
```

---

## 📋 使用示例

### 解析单个文档

```
用户：解析这个 PDF 文件：/Users/user/Documents/report.pdf

Agent：我将使用 MinerU 解析这个 PDF 文件。

✅ 成功解析：report.pdf

## Markdown 内容：
# 年度报告
...
```

### 批量解析

```
用户：解析这个文件夹中的所有 PDF：/Users/user/Documents/

Agent：我将批量解析这些文件。

✅ 成功解析 3 个文件：
- report1.pdf
- report2.pdf
- report3.pdf
```

### 大文档异步解析

```
用户：解析这个大型 PDF（200页）：/path/to/large.pdf

Agent：这是一个大型文档，我将使用异步模式解析。

⏳ 任务已提交
任务 ID: abc-123-def

[稍后...]

✅ 解析完成：large.pdf
```

---

## ⚙️ 配置选项

### 服务模式

| 模式 | 说明 | 要求 |
|------|------|------|
| **本地** | 在本机运行 MinerU | Python 3.10+, 16GB+ 内存 |
| **远程** | 使用 MinerU 云服务 | 无 |

### 解析后端

| 后端 | 特点 | 适用场景 |
|------|------|---------|
| **hybrid-auto-engine** | 高精度，多语言 | 推荐，通用场景 |
| **pipeline** | 通用型，无幻觉 | 复杂布局文档 |
| **vlm-auto-engine** | 高精度，中英文 | 中英文文档 |

### 语言支持

- 中文/英文 (ch)
- 英文 (en)
- 韩文 (korean)
- 日文 (japan)

---

## 🔧 高级配置

### 自定义端口

```bash
# 启动 MinerU 服务时指定端口
mineru-api --port 18001

# 在 Cafe-AI 设置中配置
# 设置 → 应用 → MinerU → 本地服务端口 → 18001
```

### GPU 加速

```bash
# 检查 CUDA
python -c "import torch; print(torch.cuda.is_available())"

# 使用 GPU 后端
# 设置 → 应用 → MinerU → 解析后端 → vlm-auto-engine
```

---

## 🐛 故障排除

### 问题：服务无法启动

**解决方案**:

```bash
# 检查端口是否被占用
lsof -i :18000  # macOS/Linux
netstat -ano | findstr :18000  # Windows

# 手动启动服务
mineru-api --port 18000
```

### 问题：解析失败

**解决方案**:

1. 检查文件格式（支持 PDF、DOCX、图片）
2. 检查文件大小（建议 < 100MB）
3. 检查内存是否充足
4. 尝试不同的解析后端

### 问题：内存不足

**解决方案**:

1. 使用异步模式
2. 关闭其他应用
3. 使用远程模式

---

## 📚 更多资源

- [完整用户指南](./MINERU_USER_GUIDE.md)
- [技术集成文档](./PHASE1_MINERU_INTEGRATION.md)
- [MinerU 官方文档](https://github.com/opendatalab/MinerU)

---

## ✅ 验证安装

运行集成测试：

```bash
npx ts-node tests/integration/test-mineru-integration.ts
```

预期输出：

```
✓ MinerU MCP Server directory exists
✓ MinerU MCP Server pyproject.toml exists
✓ MinerU MCP Server source files exist
...
✅ All tests passed! MinerU integration is complete.
```

---

## 🎉 开始使用

现在您可以在 Cafe-AI 中直接使用 MinerU 解析文档了！

```
用户：帮我解析这个 PDF 文件并总结内容

Agent：好的，我将使用 MinerU 解析这个文档...

[解析中...]

✅ 解析完成！这是文档的总结...
```

享受智能文档解析吧！ 🚀
