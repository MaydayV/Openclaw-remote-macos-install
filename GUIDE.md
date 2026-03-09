# OpenClaw Remote Installer - 使用指南

## 🎯 现在可以做什么？

✅ **已完成**：
- SSH 远程安装（最稳定）
- Web 界面管理
- 实时进度监控
- 多任务并行
- 一键启动脚本

## 🚀 立即开始

### 方式 1: Web 界面（最推荐）

```bash
cd ~/.openclaw/workspace/skills/remote-macos-install
./start.sh
# 选择 1) Web 界面
```

或者直接：
```bash
cd ~/.openclaw/workspace/skills/remote-macos-install
npm start
```

然后打开浏览器访问: **http://localhost:3456**

### 方式 2: 命令行

```bash
cd ~/.openclaw/workspace/skills/remote-macos-install
./start.sh
# 选择 2) 命令行交互式
```

## 📱 Web 界面使用

### 1. 准备目标 Mac

在朋友的 Mac 上执行：

```bash
# 开启远程登录
系统设置 → 通用 → 共享 → 远程登录 → 开启

# 获取 IP 地址
ifconfig | grep "inet " | grep -v 127.0.0.1

# 或者使用 hostname
hostname
```

### 2. 在 Web 界面填写信息

- **任务名称**: 朋友的 Mac
- **连接方式**: SSH
- **主机地址**: 192.168.1.100 (或 hostname.local)
- **用户名**: friend
- **认证方式**: 
  - SSH 密钥（推荐）: ~/.ssh/id_rsa
  - 密码: 输入密码

### 3. 点击"开始安装"

系统会自动：
1. 连接到远程 Mac
2. 检测环境（Homebrew、Node.js）
3. 安装缺失的依赖
4. 安装 OpenClaw
5. 配置工作区
6. 启动服务
7. 测试验证

### 4. 实时查看进度

- 进度条显示安装进度
- 日志窗口显示详细输出
- 状态标签显示当前状态

## 🔧 高级用法

### 批量安装多台 Mac

1. 创建配置文件：
```bash
cd ~/.openclaw/workspace/skills/remote-macos-install
cp config/targets.json.example config/targets.json
nano config/targets.json
```

2. 编辑配置：
```json
{
  "targets": [
    {
      "name": "Mac 1",
      "method": "ssh",
      "host": "192.168.1.100",
      "username": "user1",
      "keyPath": "~/.ssh/id_rsa"
    },
    {
      "name": "Mac 2",
      "method": "ssh",
      "host": "192.168.1.101",
      "username": "user2",
      "password": "password2"
    }
  ]
}
```

3. 执行批量安装：
```bash
./start.sh
# 选择 4) 批量安装
```

### 直接 SSH 安装（无 Web 界面）

```bash
node scripts/install-via-ssh.js \
  --host 192.168.1.100 \
  --username friend \
  --keyPath ~/.ssh/id_rsa
```

或使用密码：
```bash
node scripts/install-via-ssh.js \
  --host 192.168.1.100 \
  --username friend \
  --password your-password
```

## 📊 安装流程

```
1. 连接测试 (10%)
   └─ 测试 SSH 连接

2. 环境检测 (20%)
   ├─ 检查 macOS 版本
   ├─ 检查 Homebrew
   ├─ 检查 Node.js
   └─ 检查磁盘空间

3. 安装依赖 (40%)
   ├─ 安装 Homebrew (如需要)
   └─ 安装 Node.js (如需要)

4. 安装 OpenClaw (70%)
   ├─ npm install -g openclaw
   └─ 验证安装

5. 配置工作区 (85%)
   ├─ 创建工作目录
   ├─ 生成身份文件
   └─ 配置基础设置

6. 启动服务 (95%)
   ├─ openclaw gateway start
   └─ 验证服务状态

7. 测试验证 (100%)
   ├─ 测试基础命令
   └─ 生成安装报告
```

## 🔐 安全建议

1. **使用 SSH 密钥**（推荐）
   ```bash
   # 生成密钥对
   ssh-keygen -t rsa -b 4096
   
   # 复制公钥到目标 Mac
   ssh-copy-id user@host
   ```

2. **限制访问**
   - 只在可信网络中使用
   - 安装完成后关闭远程登录

3. **清理凭证**
   - 不要在配置文件中保存密码
   - 使用环境变量或密钥管理器

## 🐛 故障排查

### SSH 连接失败

```bash
# 测试连接
ssh user@host "echo 'SSH OK'"

# 检查密钥权限
chmod 600 ~/.ssh/id_rsa

# 详细调试
ssh -v user@host
```

### 安装失败

查看详细日志：
- Web 界面：任务卡片中的日志窗口
- 命令行：终端输出

常见问题：
- 网络连接问题：检查防火墙
- 权限不足：确保用户有管理员权限
- 磁盘空间不足：清理磁盘

### Web 界面无法访问

```bash
# 检查服务是否运行
lsof -i :3456

# 重启服务
cd ~/.openclaw/workspace/skills/remote-macos-install
npm start
```

## 📝 使用场景

### 场景 1: 帮朋友远程安装

1. 朋友开启远程登录，告诉你 IP 和用户名
2. 你打开 Web 界面 (http://localhost:3456)
3. 填写信息，点击"开始安装"
4. 实时查看进度，5-10 分钟完成
5. 告诉朋友安装完成，可以开始使用

### 场景 2: 公司批量部署

1. 准备配置文件（所有 Mac 的信息）
2. 运行批量安装脚本
3. 系统自动依次安装到每台 Mac
4. 查看安装报告，确认全部成功

### 场景 3: 远程排查问题

1. SSH 连接到有问题的 Mac
2. 自动检测环境、重新安装
3. 测试验证，确认问题解决

## 🎉 安装完成后

在远程 Mac 上，OpenClaw 已经：
- ✅ 安装到全局（可以直接运行 `openclaw` 命令）
- ✅ 创建了工作目录 (`~/.openclaw/workspace`)
- ✅ 生成了身份文件（IDENTITY.md, USER.md, SOUL.md）
- ✅ 启动了 Gateway 服务

下一步：
1. 配置 API Key
2. 配置 Discord/Telegram 渠道
3. 测试基础功能

## 💡 提示

- Web 界面支持手机访问（扫描二维码）
- 可以同时安装多台 Mac（并行任务）
- 安装过程约 5-10 分钟（取决于网络速度）
- 建议首次安装使用 Web 界面（可视化）

## 🆘 获取帮助

- 查看 README.md
- 查看 SKILL.md
- 提交 Issue
- Discord 社区求助

---

**祝你使用愉快！** 🦞
