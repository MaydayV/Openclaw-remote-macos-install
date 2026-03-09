#!/bin/bash

# OpenClaw Remote Installer - 创建独立安装包
# 可以在没有 OpenClaw 环境的情况下运行

set -e

DIST_DIR="openclaw-installer-standalone"
VERSION="1.0.0"

echo "🦞 创建 OpenClaw Remote Installer 独立安装包"
echo "================================================"
echo ""

# 清理旧文件
if [ -d "$DIST_DIR" ]; then
  echo "清理旧文件..."
  rm -rf $DIST_DIR
fi

# 创建目录
echo "创建目录结构..."
mkdir -p $DIST_DIR

# 复制文件
echo "复制文件..."
cp -r scripts $DIST_DIR/
cp -r web $DIST_DIR/
cp -r config $DIST_DIR/
cp package.json $DIST_DIR/
cp start.sh $DIST_DIR/
cp README.md $DIST_DIR/
cp GUIDE.md $DIST_DIR/
cp NAT-SOLUTIONS.md $DIST_DIR/
cp INSTALLATION-COMPARISON.md $DIST_DIR/
cp PACKAGING.md $DIST_DIR/

# 创建安装脚本
echo "创建安装脚本..."
cat > $DIST_DIR/install.sh << 'EOF'
#!/bin/bash

echo "🦞 OpenClaw Remote Installer"
echo "=============================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo "❌ 未检测到 Node.js"
  echo ""
  echo "请先安装 Node.js:"
  echo "  macOS: brew install node"
  echo "  或访问: https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 版本过低（需要 18+）"
  echo "当前版本: $(node --version)"
  echo ""
  echo "请升级 Node.js:"
  echo "  macOS: brew upgrade node"
  exit 1
fi

echo "✅ Node.js $(node --version) 已安装"
echo ""

# 安装依赖
echo "📦 安装依赖..."
npm install --production --silent

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 安装完成！"
  echo ""
  echo "使用方法："
  echo "  ./start.sh"
  echo ""
  echo "或者："
  echo "  npm start              # 启动 Web 界面"
  echo "  npm run cli            # 命令行交互式"
  echo "  npm run install-complete  # 完整安装"
  echo ""
else
  echo ""
  echo "❌ 安装失败"
  exit 1
fi
EOF

chmod +x $DIST_DIR/install.sh
chmod +x $DIST_DIR/start.sh

# 创建快速启动脚本
cat > $DIST_DIR/quick-start.sh << 'EOF'
#!/bin/bash

# 快速启动脚本 - 自动安装依赖并启动

if [ ! -d "node_modules" ]; then
  echo "首次运行，正在安装依赖..."
  ./install.sh
fi

./start.sh
EOF

chmod +x $DIST_DIR/quick-start.sh

# 创建 README
cat > $DIST_DIR/QUICK-START.md << 'EOF'
# OpenClaw Remote Installer - 快速开始

## 安装

```bash
# 1. 解压文件
tar -xzf openclaw-installer-v1.0.0.tar.gz
cd openclaw-installer-standalone

# 2. 安装依赖
./install.sh

# 3. 启动
./start.sh
```

## 或者一键启动

```bash
./quick-start.sh
```

## 使用方式

启动后选择：

1. **Web 界面** - 最直观，推荐新手
2. **命令行交互式** - 适合单次安装
3. **SSH 快速安装** - 基础功能
4. **SSH 完整安装** - 包含配置（推荐）
5. **批量安装** - 同时安装多台
6. **配置 Tailscale** - 解决无公网 IP

## 帮朋友安装

推荐使用 **选项 4: SSH 完整安装**

会自动配置：
- API Key
- 模型选择
- Discord/Telegram 渠道
- 上下文窗口

安装完成后朋友可以直接使用！

## 文档

- `README.md` - 完整文档
- `GUIDE.md` - 使用指南
- `NAT-SOLUTIONS.md` - 内网穿透方案
- `INSTALLATION-COMPARISON.md` - 安装方式对比

## 问题反馈

https://github.com/openclaw/openclaw/issues
EOF

# 打包
echo ""
echo "打包..."
tar -czf openclaw-installer-v${VERSION}.tar.gz $DIST_DIR

# 计算大小
SIZE=$(du -h openclaw-installer-v${VERSION}.tar.gz | cut -f1)

echo ""
echo "✅ 打包完成！"
echo ""
echo "文件: openclaw-installer-v${VERSION}.tar.gz"
echo "大小: $SIZE"
echo ""
echo "使用方法："
echo "  tar -xzf openclaw-installer-v${VERSION}.tar.gz"
echo "  cd $DIST_DIR"
echo "  ./quick-start.sh"
echo ""

# 生成校验和
echo "生成校验和..."
shasum -a 256 openclaw-installer-v${VERSION}.tar.gz > openclaw-installer-v${VERSION}.tar.gz.sha256
echo "SHA256: $(cat openclaw-installer-v${VERSION}.tar.gz.sha256)"
echo ""

echo "🎉 完成！"
