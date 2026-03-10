#!/usr/bin/env node

/**
 * Test Installation Script
 * 测试远程安装工具的各个组件
 */

const { Client } = require('ssh2');
const chalkPkg = require('chalk');
const chalk = chalkPkg.default || chalkPkg;
const oraPkg = require('ora');
const ora = oraPkg.default || oraPkg;
const os = require('os');

function expandHome(p) {
  if (!p) return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return require('path').join(os.homedir(), p.slice(2));
  return p;
}

class InstallationTester {
  constructor() {
    this.spinner = ora();
    this.results = {
      dependencies: {},
      ssh: {},
      scripts: {}
    };
  }

  async testDependencies() {
    console.log(chalk.blue('\n📦 测试依赖包...\n'));

    const deps = ['ssh2', 'express', 'socket.io', 'inquirer', 'chalk', 'ora', 'boxen', 'qrcode'];
    
    for (const dep of deps) {
      try {
        require.resolve(dep);
        this.results.dependencies[dep] = 'OK';
        console.log(chalk.green(`✓ ${dep}`));
      } catch (err) {
        this.results.dependencies[dep] = 'MISSING';
        console.log(chalk.red(`✗ ${dep} - 缺失`));
      }
    }
  }

  async testSSHConnection(host, username, keyPath) {
    console.log(chalk.blue('\n🔌 测试 SSH 连接...\n'));
    
    const conn = new Client();
    const fs = require('fs');
    const path = require('path');

    return new Promise((resolve) => {
      this.spinner.start(`连接到 ${host}...`);

      const config = {
        host,
        port: 22,
        username
      };

      if (keyPath) {
        try {
          config.privateKey = fs.readFileSync(path.resolve(expandHome(keyPath)));
        } catch (err) {
          this.spinner.fail('SSH 密钥文件读取失败');
          this.results.ssh.connection = 'KEY_ERROR';
          resolve(false);
          return;
        }
      }

      const timeout = setTimeout(() => {
        conn.end();
        this.spinner.fail('连接超时');
        this.results.ssh.connection = 'TIMEOUT';
        resolve(false);
      }, 10000);

      conn.on('ready', () => {
        clearTimeout(timeout);
        this.spinner.succeed(`已连接到 ${host}`);
        this.results.ssh.connection = 'OK';
        
        // 测试命令执行
        conn.exec('echo "test"', (err, stream) => {
          if (err) {
            this.results.ssh.exec = 'ERROR';
            conn.end();
            resolve(false);
            return;
          }

          stream.on('close', () => {
            this.results.ssh.exec = 'OK';
            conn.end();
            resolve(true);
          });
        });
      }).on('error', (err) => {
        clearTimeout(timeout);
        this.spinner.fail(`连接失败: ${err.message}`);
        this.results.ssh.connection = 'ERROR';
        this.results.ssh.error = err.message;
        resolve(false);
      }).connect(config);
    });
  }

  async testScripts() {
    console.log(chalk.blue('\n📝 测试脚本文件...\n'));

    const fs = require('fs');
    const path = require('path');
    const scriptsDir = path.join(__dirname);

    const requiredScripts = [
      'install-via-ssh.js',
      'install-complete.js',
      'batch-install.js',
      'main.js',
      'web-server.js'
    ];

    for (const script of requiredScripts) {
      const scriptPath = path.join(scriptsDir, script);
      if (fs.existsSync(scriptPath)) {
        this.results.scripts[script] = 'OK';
        console.log(chalk.green(`✓ ${script}`));
      } else {
        this.results.scripts[script] = 'MISSING';
        console.log(chalk.red(`✗ ${script} - 缺失`));
      }
    }
  }

  printReport() {
    console.log(chalk.blue('\n📊 测试报告\n'));

    console.log(chalk.bold('依赖包:'));
    for (const [dep, status] of Object.entries(this.results.dependencies)) {
      const icon = status === 'OK' ? '✓' : '✗';
      const color = status === 'OK' ? chalk.green : chalk.red;
      console.log(color(`  ${icon} ${dep}: ${status}`));
    }

    console.log(chalk.bold('\nSSH 连接:'));
    for (const [key, status] of Object.entries(this.results.ssh)) {
      const icon = status === 'OK' ? '✓' : '✗';
      const color = status === 'OK' ? chalk.green : chalk.red;
      console.log(color(`  ${icon} ${key}: ${status}`));
    }

    console.log(chalk.bold('\n脚本文件:'));
    for (const [script, status] of Object.entries(this.results.scripts)) {
      const icon = status === 'OK' ? '✓' : '✗';
      const color = status === 'OK' ? chalk.green : chalk.red;
      console.log(color(`  ${icon} ${script}: ${status}`));
    }

    // 总体状态
    const allOk = Object.values(this.results.dependencies).every(s => s === 'OK') &&
                  Object.values(this.results.scripts).every(s => s === 'OK');

    console.log('\n' + chalk.bold('总体状态: ') + 
      (allOk ? chalk.green('✓ 就绪') : chalk.yellow('⚠ 需要修复')));
  }

  async run(options = {}) {
    console.log(chalk.bold.blue('\n🧪 OpenClaw 远程安装工具 - 测试套件\n'));

    await this.testDependencies();
    await this.testScripts();

    if (options.host && options.username) {
      await this.testSSHConnection(options.host, options.username, options.keyPath);
    } else {
      console.log(chalk.yellow('\n⚠ 跳过 SSH 连接测试（未提供主机信息）'));
      console.log(chalk.gray('  使用方式: npm test -- --host <host> --username <user> [--keyPath <path>]'));
    }

    this.printReport();
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

  const tester = new InstallationTester();
  tester.run(options).catch(err => {
    console.error(chalk.red('\n测试失败:'), err);
    process.exit(1);
  });
}

module.exports = InstallationTester;
