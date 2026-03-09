#!/bin/bash

# OpenClaw Remote Installer - 一键启动脚本

SKILL_DIR="$HOME/.openclaw/workspace/skills/remote-macos-install"

cd "$SKILL_DIR" || exit 1

echo "🦞 OpenClaw Remote Installer"
echo "=============================="
echo ""
echo "选择启动方式:"
echo ""
echo "1) Web 界面 (推荐)"
echo "2) 命令行交互式"
echo "3) SSH 快速安装 (基础功能)"
echo "4) SSH 完整安装 (包含配置) ⭐"
echo "5) 批量安装"
echo "6) 配置 Tailscale (解决无公网 IP 问题)"
echo ""
read -p "请选择 (1-6): " choice

case $choice in
  1)
    echo ""
    echo "🌐 启动 Web 界面..."
    node scripts/web-server.js
    ;;
  2)
    echo ""
    echo "💻 启动交互式安装..."
    node scripts/main.js
    ;;
  3)
    echo ""
    read -p "主机地址: " host
    read -p "用户名: " username
    read -p "使用 SSH 密钥? (y/n): " use_key
    
    if [ "$use_key" = "y" ]; then
      read -p "密钥路径 (默认 ~/.ssh/id_rsa): " keypath
      keypath=${keypath:-~/.ssh/id_rsa}
      node scripts/install-via-ssh.js --host "$host" --username "$username" --keyPath "$keypath"
    else
      read -sp "密码: " password
      echo ""
      node scripts/install-via-ssh.js --host "$host" --username "$username" --password "$password"
    fi
    ;;
  4)
    echo ""
    echo "🎯 完整安装（包含 API Key、渠道配置等）"
    read -p "主机地址: " host
    read -p "用户名: " username
    read -p "使用 SSH 密钥? (y/n): " use_key
    
    if [ "$use_key" = "y" ]; then
      read -p "密钥路径 (默认 ~/.ssh/id_rsa): " keypath
      keypath=${keypath:-~/.ssh/id_rsa}
      node scripts/install-complete.js --host "$host" --username "$username" --keyPath "$keypath"
    else
      read -sp "密码: " password
      echo ""
      node scripts/install-complete.js --host "$host" --username "$username" --password "$password"
    fi
    ;;
  5)
    echo ""
    if [ ! -f "config/targets.json" ]; then
      echo "❌ 配置文件不存在: config/targets.json"
      echo "请先创建配置文件:"
      echo "  cp config/targets.json.example config/targets.json"
      echo "  nano config/targets.json"
      exit 1
    fi
    echo "📋 批量安装..."
    node scripts/batch-install.js config/targets.json
    ;;
  6)
    echo ""
    echo "🔧 配置 Tailscale..."
    node scripts/setup-tailscale.js
    ;;
  *)
    echo "❌ 无效选择"
    exit 1
    ;;
esac
