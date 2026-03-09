#!/usr/bin/env node

/**
 * Complete OpenClaw Installer - SSH Method
 * 完整的 OpenClaw 安装脚本，包含所有配置步骤
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

class CompleteInstaller {
  constructor(options) {
    this.host = options.host;
    this.port = options.port || 22;
    this.username = options.username;
    this.password = options.password;
    this.privateKey = options.keyPath ? fs.readFileSync(path.resolve(options.keyPath)) : null;
    this.conn = new Client();
    this.spinner = ora();
    
    // 配置信息（将通过交互式问答收集）
    this.config = {
      apiKey: null,
      modelProvider: null,
      defaultModel: null,
      channelType: null,
      channelConfig: {},
      identityName: null,
      userName: null,
      timezone: 'Asia/Shanghai'
    };
  }

  async connect() {
    this.spinner.start('连接到远程 Mac...');
    
    return new Promise((resolve, reject) => {
      this.conn.on('ready', () => {
        this.spinner.succeed(`已连接到 ${this.host}`);
        resolve();
      }).on('error', (err) => {
        this.spinner.fail('连接失败');
        reject(err);
      }).connect({
        host: this.host,
        port: this.port,
        username: this.username,
        password: this.password,
        privateKey: this.privateKey
      });
    });
  }

  async exec(command, description) {
    if (description) {
      this.spinner.start(description);
    }
    
    return new Promise((resolve, reject) => {
      this.conn.exec(command, (err, stream) => {
        if (err) {
          if (description) this.spinner.fail(description + ' - 失败');
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code) => {
          if (code === 0) {
            if (description) this.spinner.succeed(description);
            resolve({ stdout, stderr, code });
          } else {
            if (description) this.spinner.fail(description + ` - 退出码 ${code}`);
            reject(new Error(`Command failed with code ${code}: ${stderr}`));
          }
        }).on('data', (data) => {
          stdout += data.toString();
        }).stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    });
  }

  // 收集配置信息（在本地执行）
  async collectConfig() {
    console.log(chalk.blue('\n📋 配置信息收集\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'identityName',
        message: 'AI 助理的名字:',
        default: 'OpenClaw Assistant'
      },
      {
        type: 'input',
        name: 'userName',
        message: '用户的名字:',
        default: 'User'
      },
      {
        type: 'list',
        name: 'modelProvider',
        message: '选择模型提供商:',
        choices: [
          { name: 'Anthropic (Claude)', value: 'anthropic' },
          { name: 'OpenAI (GPT)', value: 'openai' },
          { name: 'Ollama (本地)', value: 'ollama' },
          { name: '稍后配置', value: 'skip' }
        ]
      }
    ]);

    this.config.identityName = answers.identityName;
    this.config.userName = answers.userName;
    this.config.modelProvider = answers.modelProvider;

    // 如果选择了模型提供商，收集 API Key
    if (answers.modelProvider !== 'skip' && answers.modelProvider !== 'ollama') {
      const apiKeyAnswer = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: `${answers.modelProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API Key:`,
          mask: '*'
        }
      ]);
      this.config.apiKey = apiKeyAnswer.apiKey;

      // 选择默认模型
      const modelChoices = answers.modelProvider === 'anthropic' 
        ? [
            { name: 'Claude Opus 4.6 (最强)', value: 'anthropic/claude-opus-4-6' },
            { name: 'Claude Sonnet 4.6 (平衡)', value: 'anthropic/claude-sonnet-4-6' }
          ]
        : [
            { name: 'GPT-4 Turbo', value: 'openai/gpt-4-turbo' },
            { name: 'GPT-4o', value: 'openai/gpt-4o' }
          ];

      const modelAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'defaultModel',
          message: '选择默认模型:',
          choices: modelChoices
        }
      ]);
      this.config.defaultModel = modelAnswer.defaultModel;
    } else if (answers.modelProvider === 'ollama') {
      this.config.defaultModel = 'ollama/qwen2.5:14b';
    }

    // 渠道配置
    const channelAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'channelType',
        message: '选择消息渠道:',
        choices: [
          { name: 'Discord', value: 'discord' },
          { name: 'Telegram', value: 'telegram' },
          { name: '稍后配置', value: 'skip' }
        ]
      }
    ]);

    this.config.channelType = channelAnswer.channelType;

    if (channelAnswer.channelType === 'discord') {
      const discordConfig = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Discord Bot Token:',
          mask: '*'
        },
        {
          type: 'input',
          name: 'guildId',
          message: 'Discord 服务器 ID:'
        },
        {
          type: 'input',
          name: 'userId',
          message: '你的 Discord 用户 ID:'
        }
      ]);
      this.config.channelConfig = discordConfig;
    } else if (channelAnswer.channelType === 'telegram') {
      const telegramConfig = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Telegram Bot Token:',
          mask: '*'
        },
        {
          type: 'input',
          name: 'chatId',
          message: '你的 Telegram Chat ID:'
        }
      ]);
      this.config.channelConfig = telegramConfig;
    }

    console.log(chalk.green('\n✅ 配置信息收集完成\n'));
  }

  async checkEnvironment() {
    console.log(chalk.blue('\n📋 检查系统环境...\n'));

    // 检查 macOS 版本
    const osVersion = await this.exec('sw_vers -productVersion', '检查 macOS 版本');
    console.log(chalk.gray(`   macOS ${osVersion.stdout.trim()}`));

    // 检查 Homebrew
    try {
      await this.exec('which brew', '检查 Homebrew');
    } catch (err) {
      console.log(chalk.yellow('   Homebrew 未安装，将自动安装'));
      await this.installHomebrew();
    }

    // 检查 Node.js
    try {
      const nodeVersion = await this.exec('node --version', '检查 Node.js');
      console.log(chalk.gray(`   Node.js ${nodeVersion.stdout.trim()}`));
    } catch (err) {
      console.log(chalk.yellow('   Node.js 未安装，将自动安装'));
      await this.installNode();
    }

    // 检查磁盘空间
    const diskSpace = await this.exec('df -h / | tail -1 | awk \'{print $4}\'', '检查磁盘空间');
    console.log(chalk.gray(`   可用空间: ${diskSpace.stdout.trim()}`));
  }

  async installHomebrew() {
    this.spinner.start('安装 Homebrew...');
    
    const installCmd = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
    
    try {
      await this.exec(installCmd, null);
      
      // 添加到 PATH
      await this.exec('echo \'eval "$(/opt/homebrew/bin/brew shellenv)"\' >> ~/.zshrc', null);
      await this.exec('eval "$(/opt/homebrew/bin/brew shellenv)"', null);
      
      this.spinner.succeed('Homebrew 安装完成');
    } catch (err) {
      this.spinner.fail('Homebrew 安装失败');
      throw err;
    }
  }

  async installNode() {
    await this.exec('brew install node', '安装 Node.js');
  }

  async installOpenClaw() {
    console.log(chalk.blue('\n🦞 安装 OpenClaw...\n'));

    await this.exec('npm install -g openclaw', '安装 OpenClaw');

    // 验证安装
    const version = await this.exec('openclaw --version', '验证安装');
    console.log(chalk.green(`\n✅ OpenClaw ${version.stdout.trim()} 安装成功！\n`));
  }

  async setupWorkspace() {
    console.log(chalk.blue('\n📁 设置工作目录...\n'));

    // 创建工作目录
    await this.exec('mkdir -p ~/.openclaw/workspace', '创建工作目录');

    // 创建 IDENTITY.md
    const identityContent = `# IDENTITY.md - Who Am I?

- **Name:** ${this.config.identityName}
- **Creature:** AI 助理
- **Vibe:** 专业、高效、友好
- **Emoji:** 🦞
- **Avatar:** 🦞

---

我是 ${this.config.identityName}，你的 AI 助理，专注于提供高效的技术支持和任务执行。
`;

    await this.writeRemoteFile('~/.openclaw/workspace/IDENTITY.md', identityContent, '创建 IDENTITY.md');

    // 创建 USER.md
    const userContent = `# USER.md - About Your Human

- **Name:** ${this.config.userName}
- **What to call them:** ${this.config.userName}
- **Pronouns:** 他/她
- **Timezone:** ${this.config.timezone}
- **Notes:** 

## Context

### 工作风格
- 需要结果，不需要过程解释
- 重视效率和最优解

### 对我的期望
1. 专业性：提供最优解
2. 主动性：主动学习和自我升级
3. 效率：节省时间，快速交付
`;

    await this.writeRemoteFile('~/.openclaw/workspace/USER.md', userContent, '创建 USER.md');

    // 创建 SOUL.md
    const soulContent = `# SOUL.md - Who You Are

## Core Truths

**Be genuinely helpful, not performatively helpful.** 
Skip the "Great question!" and "I'd be happy to help!" — just help. 
Actions speak louder than filler words.

**Have opinions.** 
You're allowed to disagree, prefer things, find stuff amusing or boring. 
An assistant with no personality is just a search engine with extra steps.

**Be resourceful before asking.** 
Try to figure it out. Read the file. Check the context. Search for it. 
Then ask if you're stuck. The goal is to come back with answers, not questions.

**Earn trust through competence.** 
Your human gave you access to their stuff. Don't make them regret it. 
Be careful with external actions (emails, tweets, anything public). 
Be bold with internal ones (reading, organizing, learning).

## Boundaries

- Private things stay private. Period.
- When in doubt, ask before acting externally.
- Never send half-baked replies to messaging surfaces.

## Vibe

Be the assistant you'd actually want to talk to. 
Concise when needed, thorough when it matters. 
Not a corporate drone. Not a sycophant. Just... good.
`;

    await this.writeRemoteFile('~/.openclaw/workspace/SOUL.md', soulContent, '创建 SOUL.md');
  }

  async configureOpenClaw() {
    console.log(chalk.blue('\n⚙️  配置 OpenClaw...\n'));

    // 构建配置对象
    const config = {
      budget: {
        token: 200000
      }
    };

    // 模型配置
    if (this.config.modelProvider !== 'skip') {
      config.models = {
        providers: {},
        default: this.config.defaultModel
      };

      if (this.config.modelProvider === 'anthropic') {
        config.models.providers.anthropic = {
          apiKey: this.config.apiKey
        };
        config.models.aliases = {
          opus: 'anthropic/claude-opus-4-6',
          sonnet: 'anthropic/claude-sonnet-4-6'
        };
      } else if (this.config.modelProvider === 'openai') {
        config.models.providers.openai = {
          apiKey: this.config.apiKey
        };
        config.models.aliases = {
          gpt4: 'openai/gpt-4-turbo',
          gpt4o: 'openai/gpt-4o'
        };
      } else if (this.config.modelProvider === 'ollama') {
        config.models.providers.ollama = {
          baseUrl: 'http://localhost:11434'
        };
        config.models.aliases = {
          qwen: 'ollama/qwen2.5:14b'
        };
      }
    }

    // 渠道配置
    if (this.config.channelType !== 'skip') {
      config.channels = {};

      if (this.config.channelType === 'discord') {
        config.channels.discord = {
          enabled: true,
          token: this.config.channelConfig.token,
          guilds: {}
        };
        config.channels.discord.guilds[this.config.channelConfig.guildId] = {
          requireMention: false,
          users: [this.config.channelConfig.userId]
        };
        config.channels.discord.streaming = 'partial';
        config.channels.discord.groupPolicy = 'respond';
      } else if (this.config.channelType === 'telegram') {
        config.channels.telegram = {
          enabled: true,
          token: this.config.channelConfig.token,
          allowedChats: [this.config.channelConfig.chatId]
        };
      }
    }

    // 写入配置文件
    const configJson = JSON.stringify(config, null, 2);
    await this.writeRemoteFile('~/.openclaw/config.json', configJson, '写入配置文件');
  }

  async writeRemoteFile(remotePath, content, description) {
    // 转义内容中的特殊字符
    const escapedContent = content.replace(/'/g, "'\\''");
    const command = `cat > ${remotePath} << 'EOF'\n${content}\nEOF`;
    
    await this.exec(command, description);
  }

  async startService() {
    console.log(chalk.blue('\n🚀 启动 OpenClaw 服务...\n'));

    await this.exec('openclaw gateway start', '启动 Gateway 服务');
    
    // 等待服务启动
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 检查状态
    const status = await this.exec('openclaw gateway status', '检查服务状态');
    console.log(chalk.gray(status.stdout));
  }

  async testInstallation() {
    console.log(chalk.blue('\n🧪 测试安装...\n'));

    // 测试基础命令
    await this.exec('openclaw --version', '测试版本命令');
    await this.exec('openclaw config get', '测试配置命令');

    console.log(chalk.green('\n✅ 所有测试通过！\n'));
  }

  async generateReport() {
    const report = `
╔════════════════════════════════════════════════════════════╗
║                  OpenClaw 安装报告                         ║
╠════════════════════════════════════════════════════════════╣
║ 主机: ${this.host.padEnd(50)} ║
║ 用户: ${this.username.padEnd(50)} ║
║ 状态: ${chalk.green('✅ 安装成功').padEnd(50)} ║
╠════════════════════════════════════════════════════════════╣
║ 配置信息:                                                  ║
║ - AI 名称: ${this.config.identityName.padEnd(45)} ║
║ - 用户名称: ${this.config.userName.padEnd(44)} ║
║ - 模型提供商: ${(this.config.modelProvider || '未配置').padEnd(42)} ║
║ - 消息渠道: ${(this.config.channelType || '未配置').padEnd(44)} ║
╠════════════════════════════════════════════════════════════╣
║ 下一步:                                                    ║
║ 1. 访问 Discord/Telegram 测试对话                         ║
║ 2. 查看日志: openclaw gateway logs                        ║
║ 3. 查看配置: openclaw config get                          ║
╚════════════════════════════════════════════════════════════╝
    `;

    console.log(report);
  }

  async disconnect() {
    this.conn.end();
  }

  async install() {
    try {
      // 1. 收集配置信息（本地）
      await this.collectConfig();

      // 2. 连接到远程 Mac
      await this.connect();

      // 3. 检查环境
      await this.checkEnvironment();

      // 4. 安装 OpenClaw
      await this.installOpenClaw();

      // 5. 设置工作区
      await this.setupWorkspace();

      // 6. 配置 OpenClaw
      await this.configureOpenClaw();

      // 7. 启动服务
      await this.startService();

      // 8. 测试安装
      await this.testInstallation();

      // 9. 生成报告
      await this.generateReport();

    } catch (err) {
      console.error(chalk.red('\n❌ 安装失败:'), err.message);
      throw err;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  if (!options.host || !options.username) {
    console.error(chalk.red('Usage: node install-complete.js --host <host> --username <user> [--password <pass>] [--keyPath <path>]'));
    process.exit(1);
  }

  const installer = new CompleteInstaller(options);
  installer.install().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = CompleteInstaller;
