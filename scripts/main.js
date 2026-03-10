#!/usr/bin/env node

/**
 * Remote macOS OpenClaw Installer - Main Entry
 * 主入口：自动检测最佳连接方式并执行安装
 */

const inquirer = require('inquirer');
const chalkPkg = require('chalk');
const chalk = chalkPkg.default || chalkPkg;
const boxen = require('boxen');
const fs = require('fs');
const path = require('path');

// 导入安装器
const SSHInstaller = require('./install-via-ssh');

function getVNCInstaller() {
  try {
    // 延迟加载，避免未安装 VNC 依赖时影响 SSH 主流程
    return require('./install-via-vnc');
  } catch (err) {
    throw new Error('VNC 依赖未安装，请先执行: npm install @vnc/vnc canvas');
  }
}

class RemoteInstaller {
  constructor() {
    this.config = null;
  }

  async showWelcome() {
    console.clear();
    console.log(boxen(
      chalk.bold.blue('OpenClaw Remote Installer') + '\n\n' +
      chalk.gray('远程安装 OpenClaw 到 macOS 系统\n') +
      chalk.gray('支持 SSH、VNC、屏幕共享三种方式'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    ));
  }

  async selectMethod() {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'method',
        message: '选择连接方式:',
        choices: [
          {
            name: '🚀 SSH (最快最稳定，需要开启远程登录)',
            value: 'ssh'
          },
          {
            name: '🖥️  VNC (无需额外软件，只需开启屏幕共享)',
            value: 'vnc'
          },
          {
            name: '🌐 屏幕共享链接 (通过 iCloud，最简单)',
            value: 'browser'
          },
          {
            name: '📋 从配置文件加载',
            value: 'config'
          }
        ]
      }
    ]);

    return answers.method;
  }

  async getSSHConfig() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'host',
        message: '远程 Mac 地址 (IP 或域名):',
        validate: (input) => input.length > 0 || '请输入有效地址'
      },
      {
        type: 'input',
        name: 'username',
        message: '用户名:',
        validate: (input) => input.length > 0 || '请输入用户名'
      },
      {
        type: 'list',
        name: 'authMethod',
        message: '认证方式:',
        choices: [
          { name: 'SSH 密钥 (推荐)', value: 'key' },
          { name: '密码', value: 'password' }
        ]
      }
    ]);

    if (answers.authMethod === 'key') {
      const keyAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'keyPath',
          message: 'SSH 密钥路径:',
          default: '~/.ssh/id_rsa'
        }
      ]);
      answers.keyPath = keyAnswer.keyPath;
    } else {
      const passAnswer = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: '密码:',
          mask: '*'
        }
      ]);
      answers.password = passAnswer.password;
    }

    return answers;
  }

  async getVNCConfig() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'host',
        message: '远程 Mac 地址 (IP 或域名):',
        validate: (input) => input.length > 0 || '请输入有效地址'
      },
      {
        type: 'input',
        name: 'username',
        message: 'VNC 用户名:',
        validate: (input) => input.length > 0 || '请输入用户名'
      },
      {
        type: 'password',
        name: 'password',
        message: 'VNC 密码:',
        mask: '*'
      },
      {
        type: 'input',
        name: 'port',
        message: 'VNC 端口:',
        default: '5900'
      }
    ]);

    return answers;
  }

  async getBrowserConfig() {
    console.log(chalk.yellow('\n📱 请在目标 Mac 上执行以下步骤:\n'));
    console.log(chalk.gray('1. 打开 系统设置 → 通用 → 共享'));
    console.log(chalk.gray('2. 开启 "屏幕共享"'));
    console.log(chalk.gray('3. 点击 "生成链接" 按钮'));
    console.log(chalk.gray('4. 将生成的链接发送给你\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'shareLink',
        message: '粘贴屏幕共享链接:',
        validate: (input) => {
          if (input.includes('icloud.com') || input.includes('apple.com')) {
            return true;
          }
          return '请输入有效的 iCloud 屏幕共享链接';
        }
      }
    ]);

    return answers;
  }

  async loadConfigFile() {
    const configPath = path.join(__dirname, '../config/targets.json');
    
    if (!fs.existsSync(configPath)) {
      console.log(chalk.red('\n❌ 配置文件不存在: config/targets.json\n'));
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'target',
        message: '选择目标机器:',
        choices: config.targets.map(t => ({
          name: `${t.name} (${t.method.toUpperCase()})`,
          value: t
        }))
      }
    ]);

    return answers.target;
  }

  async testConnection(method, config) {
    console.log(chalk.blue('\n🔍 测试连接...\n'));

    try {
      if (method === 'ssh') {
        const installer = new SSHInstaller(config);
        await installer.connect();
        await installer.disconnect();
      } else if (method === 'vnc') {
        const VNCInstaller = getVNCInstaller();
        const installer = new VNCInstaller(config);
        await installer.connect();
        await installer.disconnect();
      }
      
      console.log(chalk.green('✅ 连接测试成功！\n'));
      return true;
    } catch (err) {
      console.log(chalk.red(`❌ 连接失败: ${err.message}\n`));
      return false;
    }
  }

  async confirmInstall(method, config) {
    console.log(chalk.blue('\n📋 安装配置:\n'));
    console.log(chalk.gray(`   方式: ${method.toUpperCase()}`));
    console.log(chalk.gray(`   主机: ${config.host || '屏幕共享链接'}`));
    console.log(chalk.gray(`   用户: ${config.username || 'N/A'}`));
    console.log();

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: '确认开始安装?',
        default: true
      }
    ]);

    return answers.proceed;
  }

  async install(method, config) {
    try {
      if (method === 'ssh') {
        const installer = new SSHInstaller(config);
        await installer.install();
      } else if (method === 'vnc') {
        const VNCInstaller = getVNCInstaller();
        const installer = new VNCInstaller(config);
        await installer.install();
      } else if (method === 'browser') {
        console.log(chalk.yellow('\n🌐 浏览器方式安装功能开发中...\n'));
        console.log(chalk.gray('提示: 你可以手动打开链接，然后按照提示操作\n'));
      }
    } catch (err) {
      console.log(chalk.red(`\n❌ 安装失败: ${err.message}\n`));
      throw err;
    }
  }

  async run() {
    await this.showWelcome();

    const method = await this.selectMethod();

    let config;
    if (method === 'config') {
      config = await this.loadConfigFile();
    } else if (method === 'ssh') {
      config = await this.getSSHConfig();
    } else if (method === 'vnc') {
      config = await this.getVNCConfig();
    } else if (method === 'browser') {
      config = await this.getBrowserConfig();
    }

    // 测试连接（浏览器方式跳过）
    if (method !== 'browser') {
      const connected = await this.testConnection(method, config);
      if (!connected) {
        const retry = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'retry',
            message: '是否重试?',
            default: true
          }
        ]);

        if (retry.retry) {
          return this.run();
        } else {
          process.exit(1);
        }
      }
    }

    // 确认安装
    const proceed = await this.confirmInstall(method, config);
    if (!proceed) {
      console.log(chalk.yellow('\n取消安装\n'));
      process.exit(0);
    }

    // 执行安装
    await this.install(method, config);

    console.log(boxen(
      chalk.bold.green('🎉 安装完成！') + '\n\n' +
      chalk.gray('OpenClaw 已成功安装到远程 Mac\n') +
      chalk.gray('你可以通过 SSH 或 Discord 与它交互'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
  }
}

// 主程序
if (require.main === module) {
  const installer = new RemoteInstaller();
  installer.run().catch(err => {
    console.error(chalk.red('\n❌ 发生错误:'), err);
    process.exit(1);
  });
}

module.exports = RemoteInstaller;
