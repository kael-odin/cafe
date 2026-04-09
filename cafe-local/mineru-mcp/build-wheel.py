#!/usr/bin/env python3
"""
Build script for MinerU MCP Server.

This script builds the Python wheel package and prepares it for distribution.
"""

import subprocess
import sys
import shutil
from pathlib import Path

def main():
    """Build the wheel package."""
    script_dir = Path(__file__).parent
    dist_dir = script_dir.parent / "dist"
    
    print("=" * 60)
    print("Building MinerU MCP Server")
    print("=" * 60)
    
    # Clean previous builds
    build_dir = script_dir / "build"
    if build_dir.exists():
        print(f"Cleaning {build_dir}...")
        shutil.rmtree(build_dir)
    
    egg_info = script_dir / "mineru_mcp.egg-info"
    if egg_info.exists():
        print(f"Cleaning {egg_info}...")
        shutil.rmtree(egg_info)
    
    # Build wheel
    print("\nBuilding wheel package...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "wheel", ".", "--no-deps", "-w", str(dist_dir)],
        cwd=script_dir,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print("Build failed!")
        print(result.stderr)
        sys.exit(1)
    
    print(result.stdout)
    
    # Find the built wheel
    wheels = list(dist_dir.glob("mineru_mcp-*.whl"))
    if not wheels:
        print("ERROR: No wheel file found in dist/")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("Build successful!")
    print("=" * 60)
    print(f"Wheel: {wheels[0]}")
    print(f"Size: {wheels[0].stat().st_size / 1024:.1f} KB")
    
    # Also create a requirements.txt for the wheel
    requirements_file = dist_dir / "mineru-mcp-requirements.txt"
    requirements_file.write_text("""mcp>=1.0.0
httpx>=0.27.0
pydantic>=2.0.0
""")
    print(f"Requirements: {requirements_file}")

if __name__ == "__main__":
    main()
