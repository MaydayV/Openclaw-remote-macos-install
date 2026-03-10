# OpenClaw Remote Installer

[![GitHub release](https://img.shields.io/github/v/release/MaydayV/Openclaw-remote-macos-install)](https://github.com/MaydayV/Openclaw-remote-macos-install/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

远程安装和配置 OpenClaw 到 macOS 系统的完整解决方案。

## 🚀 快速开始

### 方式 1: Web 界面（最推荐）

```bash
git clone https://github.com/MaydayV/Openclaw-remote-macos-install.git
cd Openclaw-remote-macos-install
npm install
npm run web
```

然后打开浏览器访问: `http://localhost:3456`

**特性**：
- 📱 响应式设计，支持手机访问
- 🔄 实时进度显示
- 📊 多任务并行管理
- 📝 实时日志查看
- 📱 二维码扫描访问
- 🎯 表单输入，无需记命令

### 方式 2: 交互式终端

```bash
git clone https://github.com/MaydayV/Openclaw-remote-macos-install.git
cd Openclaw-remote-macos-install
npm install
node scripts/main.js
```

**特性**：
- 🎯 菜单式选择
- 📝 逐步引导输入
- ✅ 自动测试连接
- 📋 安装前确认

### 方式 3: 命令行直接安装

```bash
# SSH 密钥方式（推荐）
node scripts/install-via-ssh.js \
  --host <目标Mac的IP> \
  --username <用户名> \
  --keyPath ~/.ssh/id_ed25519

# SSH 密码方式
node scripts/install-via-ssh.js \
  --host <目标Mac的IP> \
  --username <用户名> \
  --password '<密码>'
```

## ✨ 核心特性

- ✅ **三种使用方式**: Web界面、交互式终端、命令行
- ✅ **SSH 连接优化**: 自动重试、keepalive、超时控制
- ✅ **路径智能处理**: 支持 `~` 展开，密钥延迟加载
- ✅ **自动环境检测**: 自动检查并安装依赖（Homebrew、Node.js）
- ✅ **完整安装流程**: 从零到完成，全自动化
- ✅ **批量部署**: 支持同时安装到多台 Mac
- ✅ **实时进度**: 清晰的进度提示和状态反馈
- ✅ **错误处理**: 命令级重试机制
- ✅ **安装报告**: 详细的安装日志和报告
- ✅ **测试套件**: 完整的冒烟测试和验证

## 📋 前置要求

### 本机（执行安装的机器）
- Node.js >= 18.0.0
- npm
- Git

### 目标 Mac（被安装的机器）
- macOS 10.15+
- 开启远程登录（SSH）
  - 系统设置 → 通用 → 共享 → 远程登录 → 开启
- 网络可达（同一局域网或通过 Tailscale）

## 🔧 安装步骤

### 1. 克隆仓库并安装依赖

```bash
git clone https://github.com/MaydayV/Openclaw-remote-macos-install.git
cd Openclaw-remote-macos-install
npm install
```

### 2. 运行测试（可选但推荐）

```bash
npm test
```

### 3. 选择使用方式

#### Web 界面（推荐）
```bash
npm run web
# 打开浏览器访问 http://localhost:3456
```

#### 交互式终端
```bash
node scripts/main.js
```

#### 命令行直接安装
```bash
node scripts/install-via-ssh.js --host <IP> --username <user> --keyPath ~/.ssh/id_ed25519
```

## 🌐 解决无公网 IP 问题

如果目标 Mac 没有公网 IP（大部分情况），推荐使用 Tailscale：

```bash
# 1. 在本机和目标 Mac 上都安装 Tailscale
brew install tailscale
sudo tailscale up

# 2. 获取目标 Mac 的 Tailscale IP
tailscale ip -4  # 例如: 100.64.x.x

# 3. 使用 Tailscale IP 连接
node scripts/install-via-ssh.js \
  --host 100.64.x.x \
  --username <user> \
  --keyPath ~/.ssh/id_ed25519
```

详细方案请查看：[NAT-SOLUTIONS.md](NAT-SOLUTIONS.md)

## 📖 使用场景

### 场景 1: 帮朋友远程安装

**使用 Web 界面**：
1. 启动 Web 服务：`npm run web`
2. 打开浏览器访问 `http://localhost:3456`
3. 填写朋友 Mac 的连接信息
4. 点击"开始安装"，实时查看进度

### 场景 2: 批量部署到公司多台 Mac

```bash
# 1. 准备配置文件
cat > config/company-macs.json << 'EOF'
{
  "targets": [
    {"name": "Mac1", "method": "ssh", "host": "mac1.company.com", "username": "admin", "keyPath": "~/.ssh/id_rsa"},
    {"name": "Mac2", "method": "ssh", "host": "mac2.company.com", "username": "admin", "keyPath": "~/.ssh/id_rsa"},
    {"name": "Mac3", "method": "ssh", "host": "mac3.company.com", "username": "admin", "keyPath": "~/.ssh/id_rsa"}
  ]
}
EOF

# 2. 批量安装
node scripts/batch-install.js config/company-macs.json
```

### 场景 3: 快速单机安装

```bash
node scripts/install-via-ssh.js \
  --host 192.168.1.100 \
  --username admin \
  --keyPath ~/.ssh/id_ed25519
```

## 🔍 安装流程

```
1. 连接测试
   ├─ 测试 SSH 连接
   ├─ 验证网络可达性
   └─ 密钥/密码认证

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

## 🛠️ 技术特性

### SSH 连接优化
- ✅ 自动重试机制（命令级重试，可配置次数和延迟）
- ✅ Keepalive 保持连接（10秒间隔，最多3次失败）
- ✅ 连接超时控制（20秒超时）
- ✅ 密钥延迟加载（避免构造时文件不存在崩溃）
- ✅ 路径智能展开（支持 `~/.ssh/id_rsa` 自动展开）

### 安装稳定性
- ✅ 非交互式 Homebrew 安装（`NONINTERACTIVE=1`）
- ✅ 幂等 PATH 配置（重复执行不会重复添加）
- ✅ 命令执行状态检查
- ✅ 详细错误提示

### 测试与验证
- ✅ 完整的测试套件（`npm test`）
- ✅ 依赖包完整性检查
- ✅ 脚本文件完整性检查
- ✅ SSH 连接测试（可选）

## 🧪 测试

```bash
# 运行完整测试套件
npm test

# 测试 SSH 连接（可选）
npm test -- --host <IP> --username <user> --keyPath ~/.ssh/id_ed25519
```

## 🔒 安全建议

1. **使用 SSH 密钥**: 优先使用 SSH 密钥而非密码
2. **加密连接**: 所有连接通过 SSH 加密
3. **限制访问**: 只在可信网络中使用
4. **清理凭证**: 安装完成后删除配置文件中的密码
5. **日志审计**: 定期检查安装日志

## 🐛 故障排查

### SSH 连接失败

```bash
# 检查 SSH 服务
ssh user@host "echo 'SSH OK'"

# 检查密钥权限
chmod 600 ~/.ssh/id_ed25519

# 测试连接
ssh -v user@host
```

### 安装失败

```bash
# 查看详细日志
cat logs/install-*.log

# 手动测试命令
ssh user@host "npm install -g openclaw"
```

### Web 界面无法访问

```bash
# 检查服务是否运行
ps aux | grep web-server

# 检查端口占用
lsof -i :3456

# 重启服务
npm run web
```

## 📝 更新日志

### v1.0.1 (2026-03-11)
- ✅ 新增 Web 界面支持
- ✅ 新增交互式终端模式
- ✅ 优化 SSH 连接稳定性
- ✅ 添加命令级重试机制
- ✅ 修复密钥路径展开问题
- ✅ 添加完整测试套件
- ✅ 改进错误提示和日志

### v1.0.0 (2026-03-07)
- 🎉 首次发布
- ✅ SSH 远程安装支持
- ✅ 自动环境检测
- ✅ 批量部署支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

## 🙏 致谢

灵感来源于 [mcp-remote-macos-use](https://github.com/baryhuang/mcp-remote-macos-use)

## 📞 支持

- GitHub Issues: https://github.com/MaydayV/Openclaw-remote-macos-install/issues
- Discord: [OpenClaw Community](https://discord.com/invite/clawd)
