# Cafe-AI 统一集成架构设计

## 一、架构概述

### 1.1 设计原则

1. **MCP-First**: 所有功能通过 MCP 协议暴露，实现标准化集成
2. **模块化**: 每个集成项目作为独立的 MCP Server，可插拔
3. **渐进式集成**: 从 P0 到 P3 分阶段实施，确保稳定性
4. **复用优先**: 优先复用现有组件，避免重复造轮子

### 1.2 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Cafe-AI Desktop Application                        │
│                         (Electron 29 + React 18 + TypeScript)                │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MCP Orchestrator (Core)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  - MCP Server Registry                                               │    │
│  │  - Tool Discovery & Routing                                          │    │
│  │  - Session Management                                                │    │
│  │  - Permission Control                                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│  MCP Server Pool  │    │  MCP Server Pool  │    │  MCP Server Pool  │
│  (Phase 1 - Core) │    │  (Phase 2 - Imp)  │    │  (Phase 3-4)      │
├───────────────────┤    ├───────────────────┤    ├───────────────────┤
│ • MinerU          │    │ • Pydantic AI     │    │ • Claw Code       │
│ • Open Interpreter│    │ • Goose           │    │ • Nexu            │
│ • RAGFlow         │    │ • Aider           │    │ • Trae Agent      │
│                   │    │                   │    │ • Anthropic QS    │
│                   │    │                   │    │ • Code Interpreter│
└───────────────────┘    └───────────────────┘    └───────────────────┘
```

---

## 二、MCP 接口规范

### 2.1 核心 MCP Server 接口

```typescript
// src/main/mcp/types.ts

/**
 * MCP Server 配置接口
 */
interface MCPServerConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  priority: 'core' | 'important' | 'optional';
}

/**
 * MCP Tool 定义接口
 */
interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, JSONSchemaProperty>;
    required?: string[];
  };
  outputSchema?: {
    type: 'object';
    properties: Record<string, JSONSchemaProperty>;
  };
}

/**
 * MCP Tool 执行结果
 */
interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
```

### 2.2 统一工具命名规范

```
{domain}_{action}_{target}

Examples:
- code_execute_python      # 执行 Python 代码
- code_execute_javascript  # 执行 JavaScript 代码
- rag_search_documents     # RAG 文档搜索
- rag_index_files          # RAG 文件索引
- file_read_content        # 读取文件内容
- file_write_content       # 写入文件内容
- git_commit_changes       # Git 提交更改
- web_search_query         # 网页搜索
```

### 2.3 标准响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata?: {
    duration: number;
    tokens?: number;
    cached?: boolean;
  };
}

// 错误响应
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

---

## 三、核心组件设计

### 3.1 MCP Orchestrator

负责管理所有 MCP Server 的生命周期、工具发现和路由。

**核心功能**:
- Server 注册与发现
- Tool 路由
- Permission 检查
- Session 管理

### 3.2 MCP Server Wrapper (Python)

提供 Python MCP Server 的基类实现。

**核心功能**:
- 工具注册
- 工具调用
- 资源管理
- 生命周期管理

### 3.3 Session Manager

管理用户会话和权限。

**核心功能**:
- 会话创建/销毁
- 权限管理
- 过期清理

---

## 四、集成项目适配方案

### 4.1 Trae Agent → MCP Server

**集成方式**: 将 Trae Agent 封装为 MCP Server，暴露 Agent 能力

**工具定义**:
- `agent_execute_task`: 执行任务
- `agent_list_tools`: 列出可用工具
- `agent_add_tool`: 添加自定义工具

### 4.2 Code Interpreter → MCP Server

**集成方式**: 封装 E2B Code Interpreter SDK

**工具定义**:
- `code_execute`: 执行代码
- `code_create_context`: 创建执行上下文
- `code_list_contexts`: 列出所有上下文

### 4.3 RAGFlow → MCP Server

**集成方式**: 封装 RAGFlow API

**工具定义**:
- `rag_search`: RAG 搜索
- `rag_index_files`: 索引文件
- `rag_create_dataset`: 创建数据集

### 4.4 Anthropic Quickstarts → 参考实现

**集成方式**: 提取核心模式作为参考实现

| 组件 | 来源路径 | 用途 |
|------|----------|------|
| Agent Framework | agents/agent.py | 简化版 Agent 循环实现 |
| MCP Connections | agents/utils/connections.py | Stdio/SSE 连接管理 |
| Security Hooks | autonomous-coding/security.py | Bash 命令白名单机制 |
| Computer Tool | computer-use-demo/tools/computer.py | 屏幕控制工具参考 |

---

## 五、数据流设计

### 5.1 工具调用流程

```
User Request → Claude Agent → MCP Orchestrator → MCP Server → Tool Handler
```

### 5.2 资源访问流程

```
Resource Request → MCP Orchestrator → MCP Server → Resource Content
```

---

## 六、安全模型

### 6.1 权限控制

- 工具级别权限
- 操作级别权限 (read/write/execute)
- 约束条件 (时间限制、内存限制、路径限制)

### 6.2 沙箱隔离

- 网络隔离
- 文件系统隔离
- 资源限制

---

## 七、配置管理

### 7.1 MCP Server 配置文件

配置文件路径: config/mcp_servers.yaml

配置内容:
- Server ID 和名称
- 启用状态
- 优先级
- 命令和参数
- 环境变量

### 7.2 环境变量管理

环境变量文件: .env

包含:
- LLM API Keys
- E2B API Key
- RAGFlow 配置
- MinerU 配置

---

## 八、监控与日志

### 8.1 日志规范

- 时间戳
- 日志级别
- Server ID
- Tool 名称
- 会话 ID
- 消息内容

### 8.2 性能监控

- 工具调用次数
- 工具调用时长
- 错误次数
- 活跃连接数
- 内存使用

---

## 九、测试策略

### 9.1 单元测试

- MCP Orchestrator 测试
- Session Manager 测试
- Permission Manager 测试

### 9.2 集成测试

- Code Interpreter 集成测试
- RAGFlow 集成测试
- Trae Agent 集成测试

---

## 十、部署架构

### 10.1 开发环境

- 本地 Electron 应用
- 本地 MCP Servers (子进程)
- 本地服务 (Docker)

### 10.2 生产环境

- 用户桌面应用
- 云端服务 (RAGFlow Cloud, E2B Sandbox)
- LLM APIs (远程)

---

## 十一、实施路线图

### Phase 1: 核心增强 (Week 1-4)

| 任务 | 优先级 | 预计时间 |
|------|--------|----------|
| 实现 MCP Orchestrator | P0 | 1 周 |
| 集成 MinerU | P0 | 1 周 |
| 集成 Open Interpreter | P0 | 1 周 |
| 集成 RAGFlow | P0 | 1 周 |

### Phase 2: 重要功能 (Week 5-8)

| 任务 | 优先级 | 预计时间 |
|------|--------|----------|
| 集成 Pydantic AI | P1 | 1 周 |
| 集成 Goose | P1 | 1 周 |
| 集成 Aider | P1 | 1 周 |
| 实现 Session Manager | P1 | 1 周 |

### Phase 3: 架构优化 (Week 9-12)

| 任务 | 优先级 | 预计时间 |
|------|--------|----------|
| 集成 Claw Code | P2 | 1 周 |
| 集成 Nexu | P2 | 1 周 |
| 集成 Trae Agent | P2 | 1 周 |
| 性能优化 | P2 | 1 周 |

### Phase 4: 生态扩展 (Week 13-16)

| 任务 | 优先级 | 预计时间 |
|------|--------|----------|
| 集成 Anthropic Quickstarts | P3 | 1 周 |
| 集成 Code Interpreter | P3 | 1 周 |
| 文档和测试 | P3 | 1 周 |
| 发布和部署 | P3 | 1 周 |

---

## 十二、总结

本统一集成架构设计提供了：

1. **标准化接口**: 所有集成通过 MCP 协议标准化
2. **模块化设计**: 每个 MCP Server 独立可插拔
3. **安全隔离**: 权限控制和沙箱机制
4. **可观测性**: 日志和监控支持
5. **渐进式实施**: 从 P0 到 P3 分阶段完成

下一步：创建各阶段的详细实施计划文档。
