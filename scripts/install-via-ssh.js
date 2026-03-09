#!/usr/bin/env node

/**
 * Remote macOS OpenClaw Installer - SSH Method
 * 通过 SSH 远程安装 OpenClaw（最快最稳定）
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

class SSHInstaller {
  constructor(options) {
    this.host = options.host;
    this.port = options.port || 22;
    this.username = options.username;
    this.password = options.password;
    this.privateKey = options.keyPath ? fs.readFileSync(path.resolve(options.keyPath)) : null;
    this.conn = new Client();
    this.spinner = ora();
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
    this.spinner.start(description);
    
    return new Promise((resolve, reject) => {
      this.conn.exec(command, (err, stream) => {
        if (err) {
          this.spinner.fail(description + ' - 失败');
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code) => {
          if (code === 0) {
            this.spinner.succeed(description);
            resolve({ stdout, stderr, code });
          } else {
            this.spinner.fail(description + ` - 退出码 ${code}`);
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
      await this.exec(installCmd, '安装 Homebrew');
      
      // 添加到 PATH
      await this.exec('echo \'eval "$(/opt/homebrew/bin/brew shellenv)"\' >> ~/.zshrc', '配置 Homebrew PATH');
      await this.exec('eval "$(/opt/homebrew/bin/brew shellenv)"', '加载 Homebrew 环境');
    } catch (err) {
      console.log(chalk.red('Homebrew 安装失败，请手动安装'));
      throw err;
    }
  }

  async installNode() {
    await this.exec('brew install node', '安装 Node.js');
  }

  async installOpenClaw() {
    console.log(chalk.blue('\n🦞 安装 OpenClaw...\n'));

    // 安装 OpenClaw
    await this.exec('npm install -g openclaw', '安装 OpenClaw');

    // 验证安装
    const version = await this.exec('openclaw --version', '验证安装');
    console.log(chalk.green(`\n✅ OpenClaw ${version.stdout.trim()} 安装成功！\n`));
  }

  async setupWorkspace() {
    console.log(chalk.blue('\n📁 设置工作目录...\n'));

    // 创建工作目录
    await this.exec('mkdir -p ~/.openclaw/workspace', '创建工作目录');

    // 创建身份文件
    const identityContent = `# IDENTITY.md

- **Name:** OpenClaw Assistant
- **Creature:** AI 助理
- **Vibe:** 专业、高效、友好
- **Emoji:** 🦞

---

我是你的 AI 助理，专注于提供高效的技术支持和任务执行。
`;

    await this.exec(`cat > ~/.openclaw/workspace/IDENTITY.md << 'EOF'
${identityContent}
EOF`, '创建 IDENTITY.md');

    const userContent = `# USER.md

- **Name:** 用户
- **Timezone:** Asia/Shanghai (GMT+8)

## Context

### 工作风格
- 需要结果，不需要过程解释
- 重视效率和最优解
`;

    await this.exec(`cat > ~/.openclaw/workspace/USER.md << 'EOF'
${userContent}
EOF`, '创建 USER.md');

    const soulContent = `# SOUL.md

## Core Truths

**Be genuinely helpful, not performatively helpful.** 
Skip the "Great question!" and "I'd be happy to help!" — just help.

**Be resourceful before asking.** 
Try to figure it out. Read the file. Check the context. Search for it.

**Earn trust through competence.** 
Be careful with external actions. Be bold with internal ones.
`;

    await this.exec(`cat > ~/.openclaw/workspace/SOUL.md << 'EOF'
${soulContent}
EOF`, '创建 SOUL.md');
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
║ 下一步:                                                    ║
║ 1. 配置 API Key: openclaw config set models.providers...  ║
║ 2. 配置渠道: Discord/Telegram                             ║
║ 3. 启动服务: openclaw gateway start                       ║
╚════════════════════════════════════════════════════════════╝
    `;

    console.log(report);
  }

  async disconnect() {
    this.conn.end();
  }

  async install() {
    try {
      await this.connect();
      await this.checkEnvironment();
      await this.installOpenClaw();
      await this.setupWorkspace();
      await this.startService();
      await this.testInstallation();
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
    console.error(chalk.red('Usage: node install-via-ssh.js --host <host> --username <user> [--password <pass>] [--keyPath <path>]'));
    process.exit(1);
  }

  const installer = new SSHInstaller(options);
  installer.install().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = SSHInstaller;
