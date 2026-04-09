# Phase 1: MinerU Integration

This document describes the complete integration of MinerU (PDF document parsing) into Cafe-AI.

## Overview

MinerU is integrated as an MCP (Model Context Protocol) server, enabling AI agents to parse PDF/DOCX/image documents and return Markdown content.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cafe-AI Agent System                     │
└──────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Manager (Existing)                    │
│  - Manages MCP server lifecycle                              │
│  - Reads installed apps via getDbMcpServers()               │
│  - Broadcasts MCP status changes                             │
└──────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 MinerU MCP Server (NEW)                      │
│  Location: cafe-local/mineru-mcp/                           │
│  - Python MCP server using mcp library                       │
│  - Tools: parse_document, parse_documents_batch, etc.        │
│  - Communicates via stdio transport                          │
└──────────────────────────┬──────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 MinerU FastAPI Service                       │
│  - Local: mineru-api process (port 18000)                   │
│  - Remote: mineru.net API or self-hosted                    │
│  - Endpoints: /file_parse, /tasks, /health                  │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. MinerU MCP Server (`cafe-local/mineru-mcp/`)

Python-based MCP server that exposes MinerU's document parsing capabilities.

**Files:**
- `pyproject.toml` - Python project configuration
- `src/mineru_mcp/server.py` - MCP server entry point
- `src/mineru_mcp/tools.py` - MCP tool definitions
- `src/mineru_mcp/client.py` - MinerU API client
- `README.md` - Usage documentation

**MCP Tools:**
- `parse_document` - Parse a single document
- `parse_documents_batch` - Parse multiple documents
- `submit_async_task` - Submit async parsing task
- `get_task_status` - Check task status
- `get_task_result` - Retrieve task result
- `health_check` - Check service health

### 2. MinerU Service Manager (`src/main/services/mineru/`)

TypeScript service for managing the MinerU FastAPI process lifecycle.

**Files:**
- `types.ts` - Type definitions
- `process-manager.ts` - Process lifecycle management
- `index.ts` - Service entry point

**Features:**
- Auto-start/stop MinerU process
- Health monitoring
- Auto-restart on failure
- Support for local and remote modes

### 3. App Preset (`src/main/apps/spec/presets/mineru.yaml`)

App specification for the Cafe-AI app store.

**Features:**
- User configuration UI
- Internationalization (zh-CN, en-US)
- Store metadata

## Integration Points

### 1. MCP Manager Integration

MinerU is automatically discovered by the existing MCP Manager through the Apps Manager:

```typescript
// src/main/services/agent/helpers.ts
export function getDbMcpServers(spaceId: string): Record<string, unknown> | null {
  const manager = getAppManager()
  const mcpApps = manager.listEffectiveMcpApps(spaceId)
  
  // MinerU will be included if installed
  // mcp_server config is read from the app spec
}
```

### 2. Apps Manager Integration

When a user installs the MinerU app:

1. Apps Manager reads `mineru.yaml` preset
2. Validates against `McpSpecSchema`
3. Stores configuration in SQLite
4. Emits `app:installed` event
5. MCP Manager receives event and loads the MCP server

### 3. Agent Runtime Integration

When an agent session starts:

1. `getDbMcpServers()` is called to get all MCP servers
2. MinerU MCP server config is passed to the SDK
3. SDK starts the `mineru-mcp` process
4. Agent can now use `parse_document` tool

## Installation

### For Development

```bash
# 1. Install MinerU MCP Server
cd cafe-local/mineru-mcp
pip install -e ".[dev]"

# 2. Install MinerU FastAPI service
pip install mineru

# 3. Start MinerU service (for local mode)
mineru-api --port 18000

# 4. Test MCP server
mineru-mcp --url http://localhost:18000
```

### For Production

The MinerU app can be installed from the Cafe-AI app store:

1. Open Cafe-AI Settings → Apps
2. Find "MinerU" in the app store
3. Click "Install"
4. Configure mode (local/remote) and settings
5. Start using `parse_document` tool in conversations

## Configuration

### User Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | select | `local` | Service mode (local/remote) |
| `remote_url` | url | - | Remote API URL (remote mode) |
| `port` | number | `18000` | Local service port |
| `backend` | select | `hybrid-auto-engine` | Parsing backend |
| `default_lang` | select | `ch` | Default language |
| `formula_enable` | boolean | `true` | Enable formula parsing |
| `table_enable` | boolean | `true` | Enable table parsing |
| `auto_start` | boolean | `true` | Auto-start service |

### Environment Variables

- `MINERU_API_URL` - MinerU FastAPI service URL

## Usage Examples

### Parse a Single Document

```
User: Parse this PDF file: /path/to/document.pdf

Agent: I'll use the parse_document tool to parse this PDF.

[Tool Call: parse_document]
{
  "file_path": "/path/to/document.pdf",
  "lang": "ch",
  "backend": "hybrid-auto-engine"
}

[Result]
✅ Successfully parsed: document.pdf

## Markdown Content:
# Document Title
...
```

### Parse Multiple Documents

```
User: Parse all PDFs in this folder: /path/to/folder/

Agent: I'll parse all PDF files in the folder.

[Tool Call: parse_documents_batch]
{
  "file_paths": ["/path/to/folder/doc1.pdf", "/path/to/folder/doc2.pdf"]
}
```

### Async Parsing for Large Documents

```
User: Parse this large PDF (100+ pages)

Agent: I'll submit this as an async task.

[Tool Call: submit_async_task]
{
  "file_paths": ["/path/to/large.pdf"]
}

[Result]
⏳ Task Status: pending
Task ID: abc-123-def

[Later...]
[Tool Call: get_task_status]
{
  "task_id": "abc-123-def"
}

[Result]
✅ Task Status: completed

[Tool Call: get_task_result]
{
  "task_id": "abc-123-def"
}
```

## Performance Considerations

### Memory Requirements

| Backend | VRAM | RAM (CPU mode) |
|---------|------|----------------|
| pipeline | 4GB | 16GB |
| vlm-auto-engine | 8GB | 32GB |
| hybrid-auto-engine | 8GB | 32GB |

### Concurrency

- Default: Single concurrent request
- Can be configured via MinerU config

### Timeout

- Sync parsing: 5 minutes default
- Large documents: Use async mode

## Troubleshooting

### Service Won't Start

1. Check if port 18000 is available
2. Verify MinerU is installed: `pip show mineru`
3. Check logs: `mineru-api --port 18000 --log-level DEBUG`

### Parsing Fails

1. Check file format (PDF, DOCX, or image)
2. Verify language setting matches document language
3. Check memory availability
4. Try different backend

### MCP Server Not Found

1. Verify `mineru-mcp` is in PATH: `which mineru-mcp`
2. Check app is installed in Cafe-AI
3. Restart Cafe-AI to reload MCP servers

## Future Enhancements

- [ ] GPU acceleration support
- [ ] Custom model fine-tuning
- [ ] Batch processing queue
- [ ] Progress streaming
- [ ] Result caching

## Related Documentation

- [MinerU Documentation](https://github.com/opendatalab/MinerU)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Cafe-AI Apps System](../../src/main/apps/spec/DESIGN.md)
