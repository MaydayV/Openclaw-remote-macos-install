#!/usr/bin/env node

/**
 * Web UI Server for Remote macOS Installer
 * 提供 Web 界面进行远程安装
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const SSHInstaller = require('./install-via-ssh');
const qrcode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3456;

// 静态文件
app.use(express.static(path.join(__dirname, '../web')));
app.use(express.json());

// 存储安装任务
const tasks = new Map();

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/index.html'));
});

// 向导页面
app.get('/wizard', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/wizard.html'));
});

// API: 获取任务列表
app.get('/api/tasks', (req, res) => {
  const taskList = Array.from(tasks.values()).map(t => ({
    id: t.id,
    name: t.name,
    host: t.host,
    method: t.method,
    status: t.status,
    progress: t.progress,
    startTime: t.startTime,
    endTime: t.endTime,
    error: t.error
  }));
  res.json(taskList);
});

// API: 创建安装任务
app.post('/api/install', async (req, res) => {
  const { name, method, host, username, password, keyPath } = req.body;

  if (!host || !username) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const taskId = Date.now().toString();
  const task = {
    id: taskId,
    name: name || host,
    host,
    username,
    method: method || 'ssh',
    status: 'pending',
    progress: 0,
    startTime: new Date(),
    endTime: null,
    error: null,
    logs: []
  };

  tasks.set(taskId, task);

  // 异步执行安装
  executeInstall(taskId, { host, username, password, keyPath }).catch(err => {
    console.error(`Task ${taskId} failed:`, err);
  });

  res.json({ taskId, message: '安装任务已创建' });
});

// API: 获取任务详情
app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.json(task);
});

// API: 删除任务
app.delete('/api/tasks/:id', (req, res) => {
  const deleted = tasks.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.json({ message: '任务已删除' });
});

// 执行安装
async function executeInstall(taskId, config) {
  const task = tasks.get(taskId);
  if (!task) return;

  task.status = 'running';
  emitTaskUpdate(taskId);

  const installer = new SSHInstaller(config);

  // 劫持 spinner 和 console.log 来捕获日志
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => {
    const message = args.join(' ');
    task.logs.push({ time: new Date(), level: 'info', message });
    emitTaskUpdate(taskId);
    originalLog(...args);
  };

  console.error = (...args) => {
    const message = args.join(' ');
    task.logs.push({ time: new Date(), level: 'error', message });
    emitTaskUpdate(taskId);
    originalError(...args);
  };

  try {
    task.progress = 10;
    emitTaskUpdate(taskId);

    await installer.connect();
    task.progress = 20;
    emitTaskUpdate(taskId);

    await installer.checkEnvironment();
    task.progress = 40;
    emitTaskUpdate(taskId);

    await installer.installOpenClaw();
    task.progress = 70;
    emitTaskUpdate(taskId);

    await installer.setupWorkspace();
    task.progress = 85;
    emitTaskUpdate(taskId);

    await installer.startService();
    task.progress = 95;
    emitTaskUpdate(taskId);

    await installer.testInstallation();
    task.progress = 100;
    task.status = 'completed';
    task.endTime = new Date();
    emitTaskUpdate(taskId);

    await installer.disconnect();

  } catch (err) {
    task.status = 'failed';
    task.error = err.message;
    task.endTime = new Date();
    emitTaskUpdate(taskId);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

// 通过 WebSocket 发送任务更新
function emitTaskUpdate(taskId) {
  const task = tasks.get(taskId);
  if (task) {
    io.emit('task-update', {
      id: task.id,
      name: task.name,
      host: task.host,
      status: task.status,
      progress: task.progress,
      logs: task.logs.slice(-50) // 只发送最近 50 条日志
    });
  }
}

// WebSocket 连接
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// 启动服务器
server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n🌐 Web UI 已启动: ${url}\n`);

  // 生成二维码
  qrcode.toString(url, { type: 'terminal', small: true }, (err, qr) => {
    if (!err) {
      console.log('扫描二维码访问:');
      console.log(qr);
    }
  });

  console.log('按 Ctrl+C 停止服务\n');
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
