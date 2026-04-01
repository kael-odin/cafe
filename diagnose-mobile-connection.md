# 手机端连接问题诊断指南

## 问题现象
扫码或手动输入密码后提示 "failed to fetch" 或认证失败

---

## 诊断步骤

### 1. 检查桌面端状态

**在 Cafe 桌面客户端**：
1. Settings → Remote Access
2. 确认已 Enable Remote Access
3. 记录显示的：
   - LAN URL（如 `http://192.168.1.100:3847`）
   - Token/PIN（如 `123456` 或自定义密码）

### 2. 测试网络连通性

**在手机浏览器打开**：
```
http://<LAN_URL>/api/remote/status
```

**预期结果**：
```json
{
  "success": true,
  "data": {
    "active": true,
    "clients": 0,
    "version": "1.0.0"
  }
}
```

**如果失败**：
- 检查手机和电脑是否在同一局域网
- 检查 Windows 防火墙是否允许端口 3847
- 尝试关闭防火墙测试

### 3. 测试认证接口

**在手机浏览器或 Postman 测试**：
```http
POST http://<LAN_URL>/api/remote/login
Content-Type: application/json

{
  "token": "<您的密码>"
}
```

**预期结果**：
```json
{
  "success": true
}
```

**如果返回 401**：
- 密码错误
- 桌面端可能重启了，token 已变化

### 4. 查看 APK 日志

**使用 adb 查看**：
```bash
adb logcat | grep -i "ServerConnect\|HTTP\|Transport"
```

**关键日志**：
```
[ServerConnect] Server URL: http://192.168.1.100:3847
[ServerConnect] API Server URL: http://192.168.1.100:3847
[HTTP] POST /api/remote/login - token: missing
[HTTP] POST /api/remote/login - status: 200, success: true
```

---

## 常见问题与解决方案

### 问题 1: "failed to fetch"

**原因**: 网络不通或 CORS 问题

**解决方案**：
1. 确认桌面端正在运行
2. 确认手机和电脑在同一局域网
3. 尝试直接在手机浏览器访问 `http://<LAN_URL>/api/remote/status`

### 问题 2: "Invalid token"

**原因**: 密码错误

**解决方案**：
1. 检查桌面端显示的 Token
2. 如果是自动生成的 6 位 PIN，检查是否复制正确
3. 如果设置了自定义密码，检查大小写和特殊字符

### 问题 3: 二维码扫描后无反应

**原因**: QR 码参数问题

**解决方案**：
1. 检查 QR 码内容（在桌面端生成时应该包含 `?token=xxx`）
2. 手动输入服务器地址和密码测试
3. 使用新构建的 APK（已修复 QR 码参数问题）

### 问题 4: 连接成功但立即断开

**原因**: WebSocket 连接问题

**解决方案**：
1. 检查桌面端 WebSocket 状态
2. 查看 adb 日志中的 WebSocket 错误
3. 确认防火墙允许 WebSocket 连接

---

## 调试命令

### 查看桌面端日志
```
# Windows PowerShell
Get-Content -Path "$env:APPDATA\cafe\logs\main.log" -Tail 50
```

### 测试 CORS
```bash
curl -H "Origin: http://192.168.1.100:3847" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://<LAN_URL>/api/remote/login
```

### 查看当前 Token
```
# 在桌面端的 Remote Access 设置页面可以看到
# 或使用开发者工具查看
```

---

## 确认修复已生效

检查 APK 版本和修复内容：

### 已修复的问题
✅ QR 码参数解析（支持 `token` 和 `code` 双参数）
✅ 增强的错误日志
✅ 改进的调试信息

### 验证步骤
1. 安装新 APK：`D:\cafe-AI\cafe\dist\Cafe-v2.0.10-test.apk`
2. 打开应用，查看是否显示 ServerConnect 页面
3. 扫描 QR 码或手动输入服务器地址
4. 查看 adb 日志确认参数解析正确

---

## 需要反馈的信息

如果问题仍然存在，请提供：

1. **桌面端日志**（最后的错误信息）
2. **手机端 adb 日志**（过滤 ServerConnect）
3. **网络测试结果**（手机浏览器访问 status 接口）
4. **使用的密码类型**（自动生成的 PIN 还是自定义密码）
5. **网络环境**（同一 WiFi？有线连接？）

---

## 临时解决方案

如果所有方法都失败，可以尝试：

### 方案 1: 使用 ngrok/Cloudflare Tunnel
```bash
# 在电脑上运行
ngrok http 3847

# 使用 ngrok 提供的公网地址连接
```

### 方案 2: 直接在浏览器访问
```
# 在手机浏览器直接访问
http://<LAN_URL>/?token=<密码>
```

### 方案 3: 使用旧版 hello-halo
如果 cafe 持续有问题，可以暂时使用原版 hello-halo
