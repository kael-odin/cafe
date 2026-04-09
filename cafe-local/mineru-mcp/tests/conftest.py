"""Pytest configuration for MinerU MCP Server tests."""

import pytest


@pytest.fixture
def mock_mineru_response():
    """Mock response from MinerU API."""
    return {
        "backend": "hybrid-auto-engine",
        "version": "1.0.0",
        "results": {
            "test_document": {
                "md": "# Test Document\\n\\nThis is test content.",
                "middle_json": {},
                "content_list": [],
            }
        }
    }


@pytest.fixture
def mock_task_response():
    """Mock async task response from MinerU API."""
    return {
        "task_id": "test-task-123",
        "status": "pending",
        "created_at": "2024-01-01T00:00:00Z",
        "queued_ahead": 0,
        "status_url": "http://localhost:18000/tasks/test-task-123",
        "result_url": "http://localhost:18000/tasks/test-task-123/result",
    }
