# 安装方式对比

## 两种安装方式

### 1. 快速安装（install-via-ssh.js）

**适用场景**：
- 快速测试
- 只需要基础功能
- 后续手动配置

**包含步骤**：
- ✅ 安装 Homebrew
- ✅ 安装 Node.js
- ✅ 安装 OpenClaw
- ✅ 创建工作目录
- ✅ 创建基础身份文件
- ✅ 启动服务

**不包含**：
- ❌ API Key 配置
- ❌ 渠道配置（Discord/Telegram）
- ❌ 上下文窗口配置
- ❌ 权限优化配置

**安装后需要手动配置**：
```bash
# 1. 配置 API Key
openclaw config set models.providers.anthropic.apiKey "sk-ant-..."

# 2. 配置渠道
openclaw config set channels.discord.enabled true
openclaw config set channels.discord.token "your-bot-token"

# 3. 重启服务
openclaw gateway restart
```

---

### 2. 完整安装（install-complete.js）⭐

**适用场景**：
- 一次性完成所有配置
- 生产环境部署
- 帮朋友安装（开箱即用）

**包含步骤**：
- ✅ 安装 Homebrew
- ✅ 安装 Node.js
- ✅ 安装 OpenClaw
- ✅ 创建工作目录
- ✅ 创建完整身份文件
- ✅ **交互式配置收集**
  - AI 助理名称
  - 用户名称
  - 模型提供商（Anthropic/OpenAI/Ollama）
  - API Key
  - 默认模型
  - 消息渠道（Discord/Telegram）
  - 渠道配置（Token、ID 等）
- ✅ **写入完整配置文件**
- ✅ **配置上下文窗口（200K）**
- ✅ 启动服务
- ✅ 测试验证

**安装后即可使用**：
- 直接在 Discord/Telegram 对话
- 无需额外配置

---

## 配置对比

### 快速安装生成的配置

```json
{
  // 空配置，需要手动添加
}
```

### 完整安装生成的配置

```json
{
  "budget": {
    "token": 200000
  },
  "models": {
    "providers": {
      "anthropic": {
        "apiKey": "sk-ant-..."
      }
    },
    "default": "anthropic/claude-opus-4-6",
    "aliases": {
      "opus": "anthropic/claude-opus-4-6",
      "sonnet": "anthropic/claude-sonnet-4-6"
    }
  },
  "channels": {
    "discord": {
      "enabled": true,
      "token": "your-bot-token",
      "guilds": {
        "your-guild-id": {
          "requireMention": false,
          "users": ["your-user-id"]
        }
      },
      "streaming": "partial",
      "groupPolicy": "respond"
    }
  }
}
```

---

## 使用建议

### 场景 1: 自己测试

使用**快速安装**：
```bash
./start.sh
# 选择 3) SSH 快速安装
```

然后手动配置：
```bash
ssh user@host
nano ~/.openclaw/config.json
# 添加配置
openclaw gateway restart
```

### 场景 2: 帮朋友安装

使用**完整安装**：
```bash
./start.sh
# 选择 4) SSH 完整安装
```

按照提示输入：
1. AI 助理名字
2. 用户名字
3. 选择模型提供商
4. 输入 API Key
5. 选择消息渠道
6. 输入渠道配置

安装完成后，朋友可以直接使用！

### 场景 3: 批量部署

使用**批量安装**（基于快速安装）：
```bash
./start.sh
# 选择 5) 批量安装
```

然后统一配置：
```bash
# 准备配置模板
cat > config-template.json << 'EOF'
{
  "budget": { "token": 200000 },
  "models": {
    "providers": { "anthropic": { "apiKey": "sk-ant-..." } },
    "default": "anthropic/claude-opus-4-6"
  }
}
EOF

# 批量应用配置
for host in mac1 mac2 mac3; do
  scp config-template.json user@$host:~/.openclaw/config.json
  ssh user@$host "openclaw gateway restart"
done
```

---

## 完整安装的交互流程

```
📋 配置信息收集

? AI 助理的名字: OpenClaw Assistant
? 用户的名字: 阿凯
? 选择模型提供商: Anthropic (Claude)
? Anthropic API Key: ********
? 选择默认模型: Claude Opus 4.6 (最强)
? 选择消息渠道: Discord
? Discord Bot Token: ********
? Discord 服务器 ID: 1234567890
? 你的 Discord 用户 ID: 9876543210

✅ 配置信息收集完成

📋 检查系统环境...
✓ 检查 macOS 版本
   macOS 14.0
✓ 检查 Homebrew
✓ 检查 Node.js
   Node.js v20.10.0
✓ 检查磁盘空间
   可用空间: 100G

🦞 安装 OpenClaw...
✓ 安装 OpenClaw
✓ 验证安装

✅ OpenClaw 1.0.0 安装成功！

📁 设置工作目录...
✓ 创建工作目录
✓ 创建 IDENTITY.md
✓ 创建 USER.md
✓ 创建 SOUL.md

⚙️  配置 OpenClaw...
✓ 写入配置文件

🚀 启动 OpenClaw 服务...
✓ 启动 Gateway 服务
✓ 检查服务状态

🧪 测试安装...
✓ 测试版本命令
✓ 测试配置命令

✅ 所有测试通过！

╔════════════════════════════════════════════════════════════╗
║                  OpenClaw 安装报告                         ║
╠════════════════════════════════════════════════════════════╣
║ 主机: 192.168.1.100                                        ║
║ 用户: friend                                               ║
║ 状态: ✅ 安装成功                                          ║
╠════════════════════════════════════════════════════════════╣
║ 配置信息:                                                  ║
║ - AI 名称: OpenClaw Assistant                              ║
║ - 用户名称: 阿凯                                           ║
║ - 模型提供商: anthropic                                    ║
║ - 消息渠道: discord                                        ║
╠════════════════════════════════════════════════════════════╣
║ 下一步:                                                    ║
║ 1. 访问 Discord/Telegram 测试对话                         ║
║ 2. 查看日志: openclaw gateway logs                        ║
║ 3. 查看配置: openclaw config get                          ║
╚════════════════════════════════════════════════════════════╝
```

---

## 推荐使用

**帮朋友安装 → 使用完整安装（选项 4）**

这样朋友安装完成后可以直接使用，无需额外配置！
