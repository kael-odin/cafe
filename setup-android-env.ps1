# Cafe Android Build Environment Setup
# 运行此脚本配置Android构建环境

# 请根据实际安装路径修改以下变量
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"  # Android Studio自带的JBR
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"  # Android SDK路径
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

# 添加到PATH
$env:Path += ";$env:JAVA_HOME\bin"
$env:Path += ";$env:ANDROID_HOME\platform-tools"
$env:Path += ";$env:ANDROID_HOME\emulator"
$env:Path += ";$env:ANDROID_HOME\tools"
$env:Path += ";$env:ANDROID_HOME\tools\bin"

# 验证
Write-Host "JAVA_HOME: $env:JAVA_HOME"
Write-Host "ANDROID_HOME: $env:ANDROID_HOME"
Write-Host ""

# 测试Java
try {
    $javaVersion = & "$env:JAVA_HOME\bin\java.exe" -version 2>&1
    Write-Host "✓ Java已配置"
    Write-Host $javaVersion
} catch {
    Write-Host "✗ Java未找到，请检查JAVA_HOME路径"
}

# 测试ADB
try {
    $adbVersion = & "$env:ANDROID_HOME\platform-tools\adb.exe" version 2>&1
    Write-Host "✓ Android SDK已配置"
} catch {
    Write-Host "✗ Android SDK未找到，请检查ANDROID_HOME路径"
}

Write-Host ""
Write-Host "环境变量已配置（仅当前会话有效）"
Write-Host "永久配置请运行："
Write-Host '  [Environment]::SetEnvironmentVariable("JAVA_HOME", "$env:JAVA_HOME", "User")'
Write-Host '  [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:ANDROID_HOME", "User")'
