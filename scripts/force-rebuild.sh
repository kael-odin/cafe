#!/bin/bash

# 强制重新构建脚本
# 用于解决缓存导致的代码不更新问题

echo "======================================"
echo "  强制重新构建 Cafe AI"
echo "======================================"
echo ""

# 步骤 1: 停止所有运行的进程
echo "[1/5] 停止运行的进程..."
pkill -f electron || true
pkill -f "node.*cafe-ai" || true
sleep 2
echo "✓ 进程已停止"
echo ""

# 步骤 2: 清理构建输出
echo "[2/5] 清理构建输出..."
rm -rf out
echo "✓ 已删除 out 目录"
rm -rf dist
echo "✓ 已删除 dist 目录"
rm -rf .vite
echo "✓ 已删除 .vite 缓存"
echo ""

# 步骤 3: 清理 node_modules/.vite
echo "[3/5] 清理 Vite 缓存..."
rm -rf node_modules/.vite
echo "✓ 已删除 Vite 缓存"
echo ""

# 步骤 4: 重新构建
echo "[4/5] 重新构建项目..."
npm run build
if [ $? -ne 0 ]; then
    echo "✗ 构建失败！"
    exit 1
fi
echo "✓ 构建成功"
echo ""

# 步骤 5: 启动应用
echo "[5/5] 启动应用..."
echo ""
echo "======================================"
echo "  构建完成！"
echo "======================================"
echo ""
echo "请手动运行: npm run dev"
echo ""
