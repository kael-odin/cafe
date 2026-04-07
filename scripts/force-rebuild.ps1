# 强制重新构建脚本
# 用于解决缓存导致的代码不更新问题

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  强制重新构建 Cafe AI" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 步骤 1: 停止所有运行的进程
Write-Host "[1/5] 停止运行的进程..." -ForegroundColor Yellow
Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✓ 进程已停止" -ForegroundColor Green
Write-Host ""

# 步骤 2: 清理构建输出
Write-Host "[2/5] 清理构建输出..." -ForegroundColor Yellow
if (Test-Path "out") {
    Remove-Item -Path "out" -Recurse -Force
    Write-Host "✓ 已删除 out 目录" -ForegroundColor Green
}
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Host "✓ 已删除 dist 目录" -ForegroundColor Green
}
if (Test-Path ".vite") {
    Remove-Item -Path ".vite" -Recurse -Force
    Write-Host "✓ 已删除 .vite 缓存" -ForegroundColor Green
}
Write-Host ""

# 步骤 3: 清理 node_modules/.vite
Write-Host "[3/5] 清理 Vite 缓存..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Path "node_modules\.vite" -Recurse -Force
    Write-Host "✓ 已删除 Vite 缓存" -ForegroundColor Green
}
Write-Host ""

# 步骤 4: 重新构建
Write-Host "[4/5] 重新构建项目..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 构建失败！" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 构建成功" -ForegroundColor Green
Write-Host ""

# 步骤 5: 启动应用
Write-Host "[5/5] 启动应用..." -ForegroundColor Yellow
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  构建完成！" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请手动运行: npm run dev" -ForegroundColor Yellow
Write-Host ""
