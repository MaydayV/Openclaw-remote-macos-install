# OpenClaw Remote Installer

[![GitHub release](https://img.shields.io/github/v/release/MaydayV/Openclaw-remote-macos-install)](https://github.com/MaydayV/Openclaw-remote-macos-install/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

远程安装和配置 OpenClaw 到 macOS 系统的完整解决方案。

## 🚀 快速安装

### 方式 1: 独立安装包（推荐）

```bash
# 下载
curl -L https://github.com/MaydayV/Openclaw-remote-macos-install/releases/download/v1.0.0/openclaw-installer-v1.0.0.tar.gz -o installer.tar.gz

# 解压
tar -xzf installer.tar.gz
cd openclaw-installer-standalone

# 一键启动
./quick-start.sh
```

### 方式 2: 克隆仓库

```bash
git clone https://github.com/MaydayV/Openclaw-remote-macos-install.git
cd Openclaw-remote-macos-install
npm install
./start.sh
```

### 方式 3: npm（即将推出）

```bash
npm install -g @openclaw/remote-installer
openclaw-installer
```

---

远程安装 OpenClaw 到 macOS 系统的完整解决方案。

## 特性

- ✅ **三种连接方式**: SSH、VNC、屏幕共享链接
- ✅ **解决无公网 IP 问题**: 内置 Tailscale 配置助手
- ✅ **自动环境检测**: 自动检查并安装依赖（Homebrew、Node.js）
- ✅ **完整安装流程**: 从零到完成，全自动化
- ✅ **批量部署**: 支持同时安装到多台 Mac
- ✅ **实时进度**: 清晰的进度提示和状态反馈
- ✅ **错误处理**: 自动重试和回滚机制
- ✅ **安装报告**: 详细的安装日志和报告
- ✅ **Web 界面**: 美观的管理界面，支持多任务

## 快速开始

### 一键启动（推荐）

```bash
cd ~/.openclaw/workspace/skills/remote-macos-install
./start.sh
```

选择启动方式：
1. **Web 界面** - 最直观，支持多任务管理
2. **命令行交互式** - 适合单次安装
3. **SSH 直接安装** - 快速安装单台
4. **批量安装** - 同时安装多台

### Web 界面（推荐）

```bash
cd ~/.openclaw/workspace/skills/remote-macos-install
node scripts/web-server.js
```

然后打开浏览器访问: `http://localhost:3456`

**特性**：
- 📱 响应式设计，支持手机访问
- 🔄 实时进度显示
- 📊 多任务并行管理
- 📝 实时日志查看
- 📱 二维码扫描访问

### 1. 安装依赖

```bash
cd ~/.openclaw/workspace/skills/remote-macos-install
npm install
```

### 2. 准备目标 Mac

#### 方式 A: SSH (推荐)
```bash
# 在目标 Mac 上开启远程登录
系统设置 → 通用 → 共享 → 远程登录 → 开启
```

**⚠️ 如果没有公网 IP（大部分情况）**：

使用 Tailscale 内网穿透（最简单）：

```bash
# 1. 配置 Tailscale
./start.sh
# 选择 5) 配置 Tailscale

# 2. 在目标 Mac 上也安装 Tailscale
brew install tailscale
sudo tailscale up
tailscale ip -4  # 获取 Tailscale IP

# 3. 使用 Tailscale IP 连接（100.64.x.x）
```

详细方案请查看：[NAT-SOLUTIONS.md](NAT-SOLUTIONS.md)

#### 方式 B: VNC
```bash
# 在目标 Mac 上开启屏幕共享
系统设置 → 通用 → 共享 → 屏幕共享 → 开启
```

#### 方式 C: 屏幕共享链接
```bash
# 在目标 Mac 上生成链接
系统设置 → 通用 → 共享 → 屏幕共享 → 生成链接
```

### 3. 运行安装

#### 交互式安装（推荐）
```bash
node scripts/main.js
```

#### SSH 方式
```bash
node scripts/install-via-ssh.js \
  --host 192.168.1.100 \
  --username user \
  --keyPath ~/.ssh/id_rsa
```

#### VNC 方式
```bash
node scripts/install-via-vnc.js \
  --host 192.168.1.100 \
  --username user \
  --password your-password
```

#### 批量安装
```bash
# 1. 复制配置文件模板
cp config/targets.json.example config/targets.json

# 2. 编辑配置文件
nano config/targets.json

# 3. 执行批量安装
node scripts/batch-install.js config/targets.json
```

## 配置文件示例

```json
{
  "targets": [
    {
      "name": "朋友的 Mac",
      "method": "ssh",
      "host": "192.168.1.100",
      "username": "friend",
      "keyPath": "~/.ssh/id_rsa"
    },
    {
      "name": "办公室 Mac",
      "method": "vnc",
      "host": "office-mac.local",
      "username": "admin",
      "password": "vnc-password"
    }
  ]
}
```

## 安装流程

```
1. 连接测试
   ├─ 测试 SSH/VNC 连接
   └─ 验证网络可达性

2. 环境检测
   ├─ 检查 macOS 版本
   ├─ 检查 Homebrew
   ├─ 检查 Node.js
   └─ 检查磁盘空间

3. 安装依赖
   ├─ 安装 Homebrew (如需要)
   ├─ 安装 Node.js (如需要)
   └─ 配置环境变量

4. 安装 OpenClaw
   ├─ npm install -g openclaw
   └─ 验证安装

5. 配置工作区
   ├─ 创建工作目录
   ├─ 生成身份文件
   └─ 配置基础设置

6. 启动服务
   ├─ openclaw gateway start
   └─ 验证服务状态

7. 测试验证
   ├─ 测试基础命令
   ├─ 测试配置读取
   └─ 生成安装报告
```

## 使用场景

### 场景 1: 帮朋友安装
```bash
# 朋友开启屏幕共享，发送链接给你
# 你运行交互式安装
node scripts/main.js
# 选择 "屏幕共享链接" 方式
# 粘贴链接，自动完成安装
```

### 场景 2: 批量部署到公司多台 Mac
```bash
# 1. 准备配置文件
cat > config/company-macs.json << 'EOF'
{
  "targets": [
    {"name": "Mac1", "method": "ssh", "host": "mac1.company.com", ...},
    {"name": "Mac2", "method": "ssh", "host": "mac2.company.com", ...},
    {"name": "Mac3", "method": "ssh", "host": "mac3.company.com", ...}
  ]
}
EOF

# 2. 批量安装
node scripts/batch-install.js config/company-macs.json

# 3. 查看报告
cat logs/batch-install-report.json
```

### 场景 3: 远程排查问题
```bash
# SSH 连接到有问题的 Mac
node scripts/install-via-ssh.js \
  --host problem-mac.local \
  --username admin \
  --keyPath ~/.ssh/id_rsa

# 自动检测环境、重新安装、测试验证
```

## 安全建议

1. **使用 SSH 密钥**: 优先使用 SSH 密钥而非密码
2. **加密连接**: VNC 连接建议通过 SSH 隧道
3. **限制访问**: 只在可信网络中使用
4. **清理凭证**: 安装完成后删除配置文件中的密码
5. **日志审计**: 定期检查安装日志

## 故障排查

### SSH 连接失败
```bash
# 检查 SSH 服务
ssh user@host "echo 'SSH OK'"

# 检查密钥权限
chmod 600 ~/.ssh/id_rsa

# 测试连接
ssh -v user@host
```

### VNC 连接失败
```bash
# 检查 VNC 端口
nc -zv host 5900

# 检查防火墙
# 在目标 Mac 上: 系统设置 → 网络 → 防火墙
```

### 安装失败
```bash
# 查看详细日志
cat logs/install-*.log

# 手动测试命令
ssh user@host "npm install -g openclaw"
```

## 开发

### 添加新功能
```bash
# 1. 创建新脚本
touch scripts/my-feature.js

# 2. 实现功能
# ...

# 3. 添加到 package.json
npm run my-feature
```

### 测试
```bash
# 单元测试
npm test

# 集成测试
npm run test:integration
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可

MIT License

## 致谢

灵感来源于 [mcp-remote-macos-use](https://github.com/baryhuang/mcp-remote-macos-use)
