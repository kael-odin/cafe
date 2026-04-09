"""MinerU MCP Server main entry point.

This module provides the MCP server that exposes MinerU's document parsing capabilities.
"""

import asyncio
import os
import sys
from typing import Optional

from mcp.server import Server
from mcp.server.stdio import stdio_server

from .tools import create_tools


def get_mineru_url() -> str:
    """Get the MinerU service URL from environment or default.

    Returns:
        MinerU service URL
    """
    return os.getenv("MINERU_API_URL", "http://localhost:18000")


def create_server(mineru_url: Optional[str] = None) -> Server:
    """Create and configure the MCP server.

    Args:
        mineru_url: URL of the MinerU FastAPI service

    Returns:
        Configured MCP server instance
    """
    if mineru_url is None:
        mineru_url = get_mineru_url()

    server = Server("mineru-mcp")

    # Create and register tools
    create_tools(server, mineru_url)

    return server


async def run_server(mineru_url: Optional[str] = None) -> None:
    """Run the MCP server.

    Args:
        mineru_url: URL of the MinerU FastAPI service
    """
    server = create_server(mineru_url)

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


def main() -> None:
    """Main entry point for the MCP server."""
    import argparse

    parser = argparse.ArgumentParser(description="MinerU MCP Server")
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help="MinerU FastAPI service URL (default: http://localhost:18000)",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 1.0.0",
    )

    args = parser.parse_args()

    # Run the server
    asyncio.run(run_server(args.url))


if __name__ == "__main__":
    main()
