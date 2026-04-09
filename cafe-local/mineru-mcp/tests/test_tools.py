"""Tests for MCP Tools."""

import pytest
from mineru_mcp.tools import format_parse_result, format_task_status
from mineru_mcp.client import ParseResult, TaskStatus


def test_format_parse_result_success():
    """Test formatting a successful parse result."""
    result = ParseResult(
        file_name="document.pdf",
        markdown="# Title\\n\\nContent",
    )
    
    formatted = format_parse_result(result)
    
    assert "✅" in formatted
    assert "document.pdf" in formatted
    assert "# Title" in formatted


def test_format_parse_result_error():
    """Test formatting an error result."""
    result = ParseResult(
        file_name="document.pdf",
        error="Parsing failed",
    )
    
    formatted = format_parse_result(result)
    
    assert "❌" in formatted
    assert "Error" in formatted
    assert "Parsing failed" in formatted


def test_format_parse_result_with_images():
    """Test formatting result with images."""
    result = ParseResult(
        file_name="document.pdf",
        markdown="# Title",
        images={
            "image1.png": "base64data1",
            "image2.png": "base64data2",
        },
    )
    
    formatted = format_parse_result(result)
    
    assert "✅" in formatted
    assert "2 images" in formatted


def test_format_task_status_pending():
    """Test formatting pending task status."""
    status = TaskStatus(
        task_id="task-123",
        status="pending",
        queued_ahead=3,
    )
    
    formatted = format_task_status(status)
    
    assert "⏳" in formatted
    assert "pending" in formatted
    assert "task-123" in formatted
    assert "3" in formatted


def test_format_task_status_processing():
    """Test formatting processing task status."""
    status = TaskStatus(
        task_id="task-123",
        status="processing",
    )
    
    formatted = format_task_status(status)
    
    assert "🔄" in formatted
    assert "processing" in formatted


def test_format_task_status_completed():
    """Test formatting completed task status."""
    status = TaskStatus(
        task_id="task-123",
        status="completed",
        result_url="http://example.com/result",
    )
    
    formatted = format_task_status(status)
    
    assert "✅" in formatted
    assert "completed" in formatted
    assert "result" in formatted.lower()


def test_format_task_status_failed():
    """Test formatting failed task status."""
    status = TaskStatus(
        task_id="task-123",
        status="failed",
        error="Out of memory",
    )
    
    formatted = format_task_status(status)
    
    assert "❌" in formatted
    assert "failed" in formatted
    assert "Out of memory" in formatted


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
