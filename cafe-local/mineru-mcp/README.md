# MinerU MCP Server

MCP Server for [MinerU](https://github.com/opendatalab/MinerU) document parsing, enabling AI agents to parse PDF/DOCX/image documents and return Markdown content.

## Features

- **Document Parsing**: Parse PDF, DOCX, and image files to Markdown
- **Formula & Table Extraction**: LaTeX formulas and HTML tables
- **Batch Processing**: Parse multiple documents in one request
- **Async Tasks**: Submit long-running parsing tasks asynchronously
- **MCP Protocol**: Seamless integration with AI agents via Model Context Protocol

## Installation

```bash
# Install the package
pip install -e .

# Or install with development dependencies
pip install -e ".[dev]"
```

## Prerequisites

### MinerU Service

This MCP server requires a running MinerU FastAPI service. You can:

1. **Local Installation**: Install and run MinerU locally
   ```bash
   # Install MinerU
   pip install mineru

   # Start the FastAPI service
   mineru-api --port 18000
   ```

2. **Remote API**: Use a remote MinerU service or the hosted API at mineru.net

## Usage

### As MCP Server

The server uses stdio transport and can be started directly:

```bash
# Start with default URL (http://localhost:18000)
mineru-mcp

# Or specify a custom URL
mineru-mcp --url http://your-mineru-server:8000
```

### Integration with Cafe-AI

Add to your Cafe-AI MCP configuration:

```json
{
  "mcpServers": {
    "mineru": {
      "command": "mineru-mcp",
      "env": {
        "MINERU_API_URL": "http://localhost:18000"
      }
    }
  }
}
```

## MCP Tools

### `parse_document`

Parse a single document and return Markdown content.

**Input Schema:**
```json
{
  "file_path": "path/to/document.pdf",
  "lang": "ch",
  "backend": "hybrid-auto-engine",
  "parse_method": "auto",
  "formula_enable": true,
  "table_enable": true,
  "return_images": false,
  "start_page": 0,
  "end_page": -1
}
```

**Parameters:**
- `file_path` (required): Path to the document file
- `lang`: Language code (ch, en, korean, japan, etc.)
- `backend`: Parsing backend (pipeline, vlm-auto-engine, hybrid-auto-engine)
- `parse_method`: Parse method (auto, txt, ocr)
- `formula_enable`: Enable LaTeX formula extraction
- `table_enable`: Enable HTML table extraction
- `return_images`: Return images as base64
- `start_page`: Start page ID (0-indexed)
- `end_page`: End page ID (-1 for all pages)

### `parse_documents_batch`

Parse multiple documents in a single request.

**Input Schema:**
```json
{
  "file_paths": ["path/to/doc1.pdf", "path/to/doc2.pdf"],
  "lang": "ch",
  "backend": "hybrid-auto-engine"
}
```

### `submit_async_task`

Submit an asynchronous parsing task for large documents.

**Returns:** Task ID for status checking

### `get_task_status`

Check the status of an async task.

**Input Schema:**
```json
{
  "task_id": "uuid-task-id"
}
```

### `get_task_result`

Retrieve results of a completed async task.

### `health_check`

Verify the MinerU service is running.

## Environment Variables

- `MINERU_API_URL`: MinerU FastAPI service URL (default: `http://localhost:18000`)

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
ruff format .
ruff check .
```

## Architecture

```
┌─────────────────┐
│   AI Agent      │
│  (Cafe-AI)      │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│  MinerU MCP     │
│    Server       │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  MinerU API     │
│  (FastAPI)      │
└─────────────────┘
```

## License

MIT License

## Related

- [MinerU](https://github.com/opendatalab/MinerU) - PDF document parsing tool
- [MCP](https://modelcontextprotocol.io/) - Model Context Protocol
- [Cafe-AI](https://github.com/kael-odin/cafe-ai) - AI Agent Platform
