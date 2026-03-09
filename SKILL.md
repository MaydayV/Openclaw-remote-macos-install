# Remote macOS Install

## Description
远程安装和配置 OpenClaw 到 macOS 系统。支持 VNC、SSH、屏幕共享三种连接方式，自动化完成安装、配置、测试全流程。

## Usage
当用户需要在远程 Mac 上安装 OpenClaw 时使用此 Skill。

## Triggers
- "帮我在远程 Mac 上安装 OpenClaw"
- "远程部署 OpenClaw"
- "帮朋友安装 OpenClaw"
- "批量安装 OpenClaw"

## Connection Methods

### 1. VNC (推荐 - 无需额外软件)
- 目标 Mac 开启"屏幕共享"
- 提供 IP、用户名、密码
- 自动化控制终端执行安装

### 2. SSH (最快 - 需要开启远程登录)
- 目标 Mac 开启"远程登录"
- 直接命令行安装
- 最稳定可靠

### 3. Screen Sharing Link (最简单 - 通过 iCloud)
- 目标 Mac 生成屏幕共享链接
- 通过浏览器控制
- 适合临时帮助

## Features

- ✅ 自动检测目标系统环境
- ✅ 智能选择最佳安装方式
- ✅ 实时进度监控
- ✅ 自动配置文件生成
- ✅ 安装后测试验证
- ✅ 错误自动回滚
- ✅ 详细日志记录

## Installation

```bash
# 安装依赖
npm install --prefix ~/.openclaw/workspace/skills/remote-macos-install
```

## Configuration

创建配置文件 `config/targets.json`：

```json
{
  "targets": [
    {
      "name": "朋友的 Mac",
      "method": "vnc",
      "host": "192.168.1.100",
      "username": "user",
      "password": "pass",
      "port": 5900
    },
    {
      "name": "办公室 Mac",
      "method": "ssh",
      "host": "office-mac.local",
      "username": "admin",
      "keyPath": "~/.ssh/id_rsa"
    }
  ]
}
```

## Scripts

- `scripts/install-via-vnc.js` - VNC 方式安装
- `scripts/install-via-ssh.js` - SSH 方式安装
- `scripts/install-via-browser.js` - 浏览器方式安装
- `scripts/detect-environment.js` - 环境检测
- `scripts/generate-config.js` - 配置生成
- `scripts/test-installation.js` - 安装测试

## Examples

### 通过 VNC 安装
```bash
node scripts/install-via-vnc.js \
  --host 192.168.1.100 \
  --username user \
  --password pass
```

### 通过 SSH 安装
```bash
node scripts/install-via-ssh.js \
  --host remote-mac.local \
  --username admin \
  --key ~/.ssh/id_rsa
```

### 批量安装
```bash
node scripts/batch-install.js --config config/targets.json
```

## Dependencies

- `@vnc/vnc` - VNC 客户端
- `ssh2` - SSH 客户端
- `playwright` - 浏览器自动化
- `inquirer` - 交互式命令行

## Security

- 所有密码使用环境变量或加密存储
- SSH 密钥优先于密码
- VNC 连接支持 SSH 隧道加密
- 安装完成后自动清理敏感信息

## Workflow

```
1. 检测连接方式
   ├─ 尝试 SSH (最快)
   ├─ 尝试 VNC (次选)
   └─ 提示使用屏幕共享链接 (兜底)

2. 环境检测
   ├─ 检查 Node.js 版本
   ├─ 检查网络连接
   ├─ 检查磁盘空间
   └─ 检查权限

3. 执行安装
   ├─ 安装 Homebrew (如果需要)
   ├─ 安装 Node.js (如果需要)
   ├─ 安装 OpenClaw
   └─ 验证安装

4. 配置
   ├─ 生成身份文件
   ├─ 配置模型 API Key
   ├─ 配置渠道 (Discord/Telegram)
   └─ 启动服务

5. 测试
   ├─ 测试基础命令
   ├─ 测试渠道连接
   └─ 生成测试报告

6. 清理
   ├─ 删除临时文件
   ├─ 清理敏感信息
   └─ 生成安装日志
```

## Troubleshooting

### VNC 连接失败
- 检查目标 Mac 是否开启"屏幕共享"
- 检查防火墙设置
- 尝试使用 SSH 隧道

### SSH 连接失败
- 检查目标 Mac 是否开启"远程登录"
- 检查 SSH 密钥权限
- 尝试使用密码认证

### 安装失败
- 查看详细日志：`~/.openclaw/logs/remote-install.log`
- 检查网络连接
- 检查磁盘空间

## Notes

- 首次安装建议使用 VNC 或屏幕共享（可视化）
- 批量部署建议使用 SSH（最快）
- 安装过程约 5-10 分钟
- 需要目标 Mac 的管理员权限
