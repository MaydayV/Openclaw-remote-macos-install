#!/usr/bin/env node

/**
 * Remote macOS OpenClaw Installer - SSH Method
 * 通过 SSH 远程安装 OpenClaw（最快最稳定）
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const os = require('os');
const chalkPkg = require('chalk');
const chalk = chalkPkg.default || chalkPkg;
const oraPkg = require('ora');
const ora = oraPkg.default || oraPkg;

function expandHome(p) {
  if (!p) return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

class SSHInstaller {
  constructor(options) {
    this.host = options.host;
    this.port = Number(options.port || 22);
    this.username = options.username;
    this.password = options.password;

    this.keyPath = options.keyPath ? expandHome(options.keyPath) : null;
    this.privateKey = null; // 延迟加载，避免构造时文件不存在崩溃

    this.conn = new Client();
    this.spinner = ora();
    this.connected = false;
  }

  buildConnConfig() {
    // 延迟加载密钥，避免构造时文件不存在崩溃
    if (this.keyPath && !this.privateKey) {
      try {
        this.privateKey = fs.readFileSync(path.resolve(this.keyPath));
      } catch (err) {
        throw new Error(`SSH 密钥文件读取失败: ${this.keyPath} - ${err.message}`);
      }
    }

    return {
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      privateKey: this.privateKey,
      readyTimeout: 20000,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
      tryKeyboard: false
    };
  }

  async connect() {
    this.spinner.start('连接到远程 Mac...');

    return new Promise((resolve, reject) => {
      this.conn
        .on('ready', () => {
          this.connected = true;
          this.spinner.succeed(`已连接到 ${this.host}:${this.port}`);
          resolve();
        })
        .on('error', (err) => {
          this.spinner.fail('连接失败');
          reject(err);
        })
        .on('end', () => {
          this.connected = false;
        })
        .on('close', () => {
          this.connected = false;
        })
        .connect(this.buildConnConfig());
    });
  }

  async exec(command, description, opts = {}) {
    this.spinner.start(description);

    return new Promise((resolve, reject) => {
      this.conn.exec(command, { pty: Boolean(opts.pty) }, (err, stream) => {
        if (err) {
          this.spinner.fail(`${description} - 启动失败`);
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        stream
          .on('close', (code) => {
            if (code === 0) {
              this.spinner.succeed(description);
              resolve({ stdout, stderr, code });
            } else {
              this.spinner.fail(`${description} - 退出码 ${code}`);
              reject(new Error(`Command failed [${description}] code=${code}\n${stderr || stdout}`));
            }
          })
          .on('data', (data) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data) => {
            stderr += data.toString();
          });
      });
    });
  }

  async execWithRetry(command, description, retries = 2, delayMs = 2000, opts = {}) {
    let lastErr;
    for (let i = 0; i <= retries; i++) {
      try {
        if (i > 0) {
          console.log(chalk.yellow(`   重试 ${i}/${retries}: ${description}`));
        }
        return await this.exec(command, description, opts);
      } catch (err) {
        lastErr = err;
        if (i < retries) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }
    throw lastErr;
  }

  async checkEnvironment() {
    console.log(chalk.blue('\n📋 检查系统环境...\n'));

    const osVersion = await this.exec('sw_vers -productVersion', '检查 macOS 版本');
    console.log(chalk.gray(`   macOS ${osVersion.stdout.trim()}`));

    // 检查 SSH 目标是否是 macOS
    const kernel = await this.exec('uname -s', '检查系统内核');
    if (!kernel.stdout.trim().toLowerCase().includes('darwin')) {
      throw new Error(`目标机器不是 macOS (uname=${kernel.stdout.trim()})`);
    }

    try {
      await this.exec('command -v brew', '检查 Homebrew');
    } catch {
      console.log(chalk.yellow('   Homebrew 未安装，将自动安装（非交互）'));
      await this.installHomebrew();
    }

    try {
      const nodeVersion = await this.exec('node --version', '检查 Node.js');
      console.log(chalk.gray(`   Node.js ${nodeVersion.stdout.trim()}`));
    } catch {
      console.log(chalk.yellow('   Node.js 未安装，将自动安装'));
      await this.installNode();
    }

    const diskSpace = await this.exec("df -h / | tail -1 | awk '{print $4}'", '检查磁盘空间');
    console.log(chalk.gray(`   可用空间: ${diskSpace.stdout.trim()}`));
  }

  async installHomebrew() {
    // NONINTERACTIVE 避免卡在交互提示
    const installCmd = 'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
    await this.execWithRetry(installCmd, '安装 Homebrew', 1, 3000, { pty: true });

    // 写入 shellenv（幂等）
    await this.exec(
      "grep -q 'brew shellenv' ~/.zprofile || echo 'eval \"$(/opt/homebrew/bin/brew shellenv)\"' >> ~/.zprofile",
      '配置 Homebrew PATH'
    );
  }

  async installNode() {
    const cmd = 'eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || true)"; brew update && brew install node';
    await this.execWithRetry(cmd, '安装 Node.js', 1, 3000, { pty: true });
  }

  async installOpenClaw() {
    console.log(chalk.blue('\n🦞 安装 OpenClaw...\n'));

    const cmd = [
      'set -e',
      'eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || true)"',
      'npm install -g openclaw@latest',
      'command -v openclaw >/dev/null 2>&1 || export PATH="$PATH:$(npm config get prefix)/bin"',
      'openclaw --version'
    ].join(' && ');

    const version = await this.execWithRetry(cmd, '安装并验证 OpenClaw', 2, 4000, { pty: true });
    console.log(chalk.green(`\n✅ OpenClaw 安装成功: ${version.stdout.trim()}\n`));
  }

  async setupWorkspace() {
    console.log(chalk.blue('\n📁 设置工作目录...\n'));

    await this.exec('mkdir -p ~/.openclaw/workspace', '创建工作目录');

    const identityContent = `# IDENTITY.md

- **Name:** OpenClaw Assistant
- **Creature:** AI 助理
- **Vibe:** 专业、高效、友好
- **Emoji:** 🦞

---

我是你的 AI 助理，专注于提供高效的技术支持和任务执行。
`;

    await this.exec(`cat > ~/.openclaw/workspace/IDENTITY.md << 'EOF'\n${identityContent}\nEOF`, '创建 IDENTITY.md');

    const userContent = `# USER.md

- **Name:** 用户
- **Timezone:** Asia/Shanghai (GMT+8)

## Context

### 工作风格
- 需要结果，不需要过程解释
- 重视效率和最优解
`;

    await this.exec(`cat > ~/.openclaw/workspace/USER.md << 'EOF'\n${userContent}\nEOF`, '创建 USER.md');

    const soulContent = `# SOUL.md

## Core Truths

**Be genuinely helpful, not performatively helpful.**
Skip the \"Great question!\" and \"I'd be happy to help!\" — just help.

**Be resourceful before asking.**
Try to figure it out. Read the file. Check the context. Search for it.

**Earn trust through competence.**
Be careful with external actions. Be bold with internal ones.
`;

    await this.exec(`cat > ~/.openclaw/workspace/SOUL.md << 'EOF'\n${soulContent}\nEOF`, '创建 SOUL.md');
  }

  async startService() {
    console.log(chalk.blue('\n🚀 启动 OpenClaw 服务...\n'));

    const cmd = [
      'set -e',
      'command -v openclaw >/dev/null 2>&1 || export PATH="$PATH:$(npm config get prefix)/bin"',
      'openclaw gateway start || true',
      'sleep 2',
      'openclaw gateway status || openclaw status'
    ].join(' && ');

    const status = await this.exec(cmd, '启动并检查 Gateway 状态');
    console.log(chalk.gray(status.stdout));
  }

  async testInstallation() {
    console.log(chalk.blue('\n🧪 测试安装...\n'));

    await this.exec('openclaw --version', '测试版本命令');
    await this.exec('openclaw gateway status || openclaw status', '测试状态命令');

    console.log(chalk.green('\n✅ 所有测试通过！\n'));
  }

  async generateReport() {
    const report = `
╔════════════════════════════════════════════════════════════╗
║                  OpenClaw 安装报告                         ║
╠════════════════════════════════════════════════════════════╣
║ 主机: ${String(this.host).padEnd(50)} ║
║ 用户: ${String(this.username).padEnd(50)} ║
║ 状态: ${chalk.green('✅ 安装成功').padEnd(50)} ║
╠════════════════════════════════════════════════════════════╣
║ 下一步:                                                    ║
║ 1. 配置 API Key                                            ║
║ 2. 配置渠道 (Discord/Telegram)                             ║
║ 3. 开始使用: openclaw                                      ║
╚════════════════════════════════════════════════════════════╝
    `;

    console.log(report);
  }

  async disconnect() {
    if (this.connected) {
      this.conn.end();
      this.connected = false;
    }
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
    console.error(chalk.red('Usage: node install-via-ssh.js --host <host> --username <user> [--password <pass>] [--keyPath <path>] [--port 22]'));
    process.exit(1);
  }

  const installer = new SSHInstaller(options);
  installer.install().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = SSHInstaller;
