#!/usr/bin/env node

/**
 * Tailscale Setup Helper
 * 自动配置 Tailscale 内网穿透
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

const execAsync = promisify(exec);

class TailscaleHelper {
  constructor() {
    this.spinner = ora();
  }

  async checkInstalled() {
    this.spinner.start('检查 Tailscale 是否已安装...');
    
    try {
      await execAsync('which tailscale');
      this.spinner.succeed('Tailscale 已安装');
      return true;
    } catch (err) {
      this.spinner.warn('Tailscale 未安装');
      return false;
    }
  }

  async install() {
    this.spinner.start('安装 Tailscale...');
    
    try {
      await execAsync('brew install tailscale');
      this.spinner.succeed('Tailscale 安装成功');
    } catch (err) {
      this.spinner.fail('安装失败');
      throw err;
    }
  }

  async checkStatus() {
    try {
      const { stdout } = await execAsync('tailscale status');
      return stdout.trim();
    } catch (err) {
      return null;
    }
  }

  async login() {
    this.spinner.start('启动 Tailscale...');
    
    try {
      // 启动 Tailscale（会打开浏览器登录）
      await execAsync('sudo tailscale up');
      this.spinner.succeed('Tailscale 已启动');
    } catch (err) {
      this.spinner.fail('启动失败');
      throw err;
    }
  }

  async getIP() {
    try {
      const { stdout } = await execAsync('tailscale ip -4');
      return stdout.trim();
    } catch (err) {
      return null;
    }
  }

  async getDevices() {
    try {
      const { stdout } = await execAsync('tailscale status --json');
      const status = JSON.parse(stdout);
      return status.Peer || {};
    } catch (err) {
      return {};
    }
  }

  async run() {
    console.log(chalk.blue('\n🔧 Tailscale 配置助手\n'));

    // 1. 检查是否已安装
    const installed = await this.checkInstalled();
    
    if (!installed) {
      const { shouldInstall } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldInstall',
          message: '是否安装 Tailscale?',
          default: true
        }
      ]);

      if (!shouldInstall) {
        console.log(chalk.yellow('\n取消安装\n'));
        return;
      }

      await this.install();
    }

    // 2. 检查状态
    const status = await this.checkStatus();
    
    if (!status) {
      console.log(chalk.yellow('\nTailscale 未运行，需要登录\n'));
      
      const { shouldLogin } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldLogin',
          message: '是否启动 Tailscale?（会打开浏览器登录）',
          default: true
        }
      ]);

      if (!shouldLogin) {
        console.log(chalk.yellow('\n取消启动\n'));
        return;
      }

      await this.login();
    } else {
      console.log(chalk.green('\n✅ Tailscale 已运行\n'));
    }

    // 3. 获取 IP
    const ip = await this.getIP();
    
    if (ip) {
      console.log(chalk.blue('📍 你的 Tailscale IP:\n'));
      console.log(chalk.green(`   ${ip}\n`));
    }

    // 4. 获取设备列表
    const devices = await this.getDevices();
    const deviceList = Object.values(devices);

    if (deviceList.length > 0) {
      console.log(chalk.blue('📱 网络中的其他设备:\n'));
      
      deviceList.forEach(device => {
        const name = device.HostName || device.DNSName || 'Unknown';
        const ip = device.TailscaleIPs?.[0] || 'N/A';
        const online = device.Online ? chalk.green('在线') : chalk.gray('离线');
        console.log(`   ${name.padEnd(20)} ${ip.padEnd(15)} ${online}`);
      });
      
      console.log();
    }

    // 5. 提供下一步指引
    console.log(chalk.blue('📋 下一步:\n'));
    console.log(chalk.gray('1. 在目标 Mac 上也安装并启动 Tailscale'));
    console.log(chalk.gray('2. 使用同一个账号登录'));
    console.log(chalk.gray('3. 在 Web 界面填写目标 Mac 的 Tailscale IP'));
    console.log(chalk.gray('4. 开始远程安装！\n'));

    // 6. 生成安装命令
    console.log(chalk.blue('💻 目标 Mac 上执行:\n'));
    console.log(chalk.yellow('   brew install tailscale'));
    console.log(chalk.yellow('   sudo tailscale up'));
    console.log(chalk.yellow('   tailscale ip -4\n'));

    // 7. 提供测试命令
    if (deviceList.length > 0) {
      const firstDevice = deviceList[0];
      const targetIP = firstDevice.TailscaleIPs?.[0];
      
      if (targetIP) {
        console.log(chalk.blue('🧪 测试连接:\n'));
        console.log(chalk.yellow(`   ping ${targetIP}`));
        console.log(chalk.yellow(`   ssh user@${targetIP}\n`));
      }
    }
  }
}

// 主程序
if (require.main === module) {
  const helper = new TailscaleHelper();
  helper.run().catch(err => {
    console.error(chalk.red('\n❌ 发生错误:'), err.message);
    process.exit(1);
  });
}

module.exports = TailscaleHelper;
