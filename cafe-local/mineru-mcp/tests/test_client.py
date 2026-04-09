"""Tests for MinerU MCP Server."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from pathlib import Path

from mineru_mcp.client import MinerUClient, ParseResult, TaskStatus


@pytest.mark.asyncio
async def test_client_health_check_success():
    """Test health check when service is healthy."""
    with patch('httpx.AsyncClient') as mock_client:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
        
        async with MinerUClient() as client:
            result = await client.health_check()
            assert result is True


@pytest.mark.asyncio
async def test_client_health_check_failure():
    """Test health check when service is not responding."""
    with patch('httpx.AsyncClient') as mock_client:
        mock_client.return_value.__aenter__.return_value.get = AsyncMock(side_effect=Exception("Connection failed"))
        
        async with MinerUClient() as client:
            result = await client.health_check()
            assert result is False


def test_parse_result_success():
    """Test ParseResult with successful parsing."""
    result = ParseResult(
        file_name="test.pdf",
        markdown="# Test Document\\n\\nContent here.",
    )
    
    assert result.file_name == "test.pdf"
    assert result.markdown is not None
    assert result.error is None


def test_parse_result_error():
    """Test ParseResult with error."""
    result = ParseResult(
        file_name="test.pdf",
        error="File not found",
    )
    
    assert result.file_name == "test.pdf"
    assert result.markdown is None
    assert result.error == "File not found"


def test_task_status():
    """Test TaskStatus model."""
    status = TaskStatus(
        task_id="abc-123",
        status="pending",
        queued_ahead=2,
    )
    
    assert status.task_id == "abc-123"
    assert status.status == "pending"
    assert status.queued_ahead == 2


@pytest.mark.asyncio
async def test_parse_document_file_not_found():
    """Test parsing a non-existent file."""
    async with MinerUClient() as client:
        result = await client.parse_document(file_path="/nonexistent/file.pdf")
        
        assert result.error is not None
        assert "not found" in result.error.lower()


@pytest.mark.asyncio
async def test_parse_document_success():
    """Test successful document parsing."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": {
            "test": {
                "md": "# Test\\n\\nContent",
            }
        }
    }
    
    with patch('httpx.AsyncClient') as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
        
        # Create a temp file for testing
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"test content")
            temp_path = f.name
        
        try:
            async with MinerUClient() as client:
                result = await client.parse_document(file_path=temp_path)
                
                assert result.error is None
                assert result.markdown is not None
        finally:
            Path(temp_path).unlink(missing_ok=True)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
