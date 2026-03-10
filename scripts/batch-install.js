#!/usr/bin/env node

/**
 * Batch Install - 批量安装到多台 Mac
 */

const fs = require('fs');
const path = require('path');
const chalkPkg = require('chalk');
const chalk = chalkPkg.default || chalkPkg;
const oraPkg = require('ora');
const ora = oraPkg.default || oraPkg;
const SSHInstaller = require('./install-via-ssh');
const VNCInstaller = require('./install-via-vnc');

class BatchInstaller {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = null;
    this.results = [];
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`配置文件不存在: ${this.configPath}`);
    }

    this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    console.log(chalk.blue(`\n📋 加载配置: ${this.config.targets.length} 台目标机器\n`));
  }

  async installOne(target) {
    console.log(chalk.blue(`\n🚀 开始安装: ${target.name}\n`));

    const startTime = Date.now();
    let success = false;
    let error = null;

    try {
      if (target.method === 'ssh') {
        const installer = new SSHInstaller(target);
        await installer.install();
      } else if (target.method === 'vnc') {
        const installer = new VNCInstaller(target);
        await installer.install();
      }
      success = true;
    } catch (err) {
      error = err.message;
      console.error(chalk.red(`❌ ${target.name} 安装失败: ${err.message}`));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    this.results.push({
      name: target.name,
      host: target.host,
      method: target.method,
      success,
      error,
      duration
    });

    return success;
  }

  async installAll() {
    console.log(chalk.blue('\n🔄 开始批量安装...\n'));

    for (const target of this.config.targets) {
      await this.installOne(target);
      console.log(chalk.gray('\n' + '─'.repeat(60) + '\n'));
    }
  }

  generateReport() {
    console.log(chalk.blue('\n📊 批量安装报告\n'));

    const successCount = this.results.filter(r => r.success).length;
    const failCount = this.results.filter(r => !r.success).length;

    console.log(chalk.green(`✅ 成功: ${successCount}`));
    console.log(chalk.red(`❌ 失败: ${failCount}`));
    console.log();

    console.log('详细结果:');
    console.log();

    for (const result of this.results) {
      const status = result.success ? chalk.green('✅') : chalk.red('❌');
      const duration = chalk.gray(`(${result.duration}s)`);
      console.log(`${status} ${result.name} - ${result.host} ${duration}`);
      
      if (result.error) {
        console.log(chalk.red(`   错误: ${result.error}`));
      }
    }

    console.log();

    // 保存报告到文件
    const reportPath = path.join(__dirname, '../logs/batch-install-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(chalk.gray(`报告已保存: ${reportPath}\n`));
  }

  async run() {
    try {
      this.loadConfig();
      await this.installAll();
      this.generateReport();
    } catch (err) {
      console.error(chalk.red('\n❌ 批量安装失败:'), err.message);
      throw err;
    }
  }
}

// CLI 入口
if (require.main === module) {
  const configPath = process.argv[2] || path.join(__dirname, '../config/targets.json');

  const installer = new BatchInstaller(configPath);
  installer.run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = BatchInstaller;
