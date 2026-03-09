# OpenClaw Remote Installer - 功能梳理与封装方案

## 📋 功能清单

### 核心功能
1. ✅ **SSH 远程安装**
   - 自动安装 Homebrew
   - 自动安装 Node.js
   - 安装 OpenClaw
   - 创建工作目录
   - 创建身份文件
   - 启动服务

2. ✅ **完整配置安装**
   - 交互式配置收集
   - API Key 配置
   - 模型配置
   - 渠道配置（Discord/Telegram）
   - 上下文窗口配置
   - 生成完整 config.json

3. ✅ **内网穿透支持**
   - Tailscale 自动配置
   - macOS 屏幕共享指引
   - 解决无公网 IP 问题

4. ✅ **Web 界面**
   - 可视化管理
   - 实时进度监控
   - 多任务并行
   - 安装向导

5. ✅ **批量部署**
   - 配置文件批量安装
   - 安装报告生成

### 依赖项
- Node.js 18+
- npm 包：
  - ssh2 (SSH 连接)
  - express (Web 服务器)
  - socket.io (实时通信)
  - inquirer (交互式命令行)
  - chalk (终端颜色)
  - ora (进度指示器)
  - boxen (终端框)
  - qrcode (二维码生成)

### 文件结构
```
remote-macos-install/
├── scripts/
│   ├── main.js                 # CLI 主入口
│   ├── install-via-ssh.js      # SSH 快速安装
│   ├── install-complete.js     # 完整配置安装
│   ├── setup-tailscale.js      # Tailscale 配置
│   ├── web-server.js           # Web 服务器
│   └── batch-install.js        # 批量安装
├── web/
│   ├── index.html              # Web 界面
│   └── wizard.html             # 安装向导
├── config/
│   └── targets.json.example    # 批量配置模板
├── start.sh                    # 启动脚本
├── package.json
└── README.md
```

---

## 🎯 封装方案

### 方案 1: Homebrew Formula（推荐）⭐

**优点**：
- macOS 原生包管理
- 自动处理依赖
- 一行命令安装
- 自动更新

**实现**：

```ruby
# openclaw-installer.rb
class OpenclawInstaller < Formula
  desc "Remote OpenClaw installation tool for macOS"
  homepage "https://github.com/openclaw/remote-installer"
  url "https://github.com/openclaw/remote-installer/archive/v1.0.0.tar.gz"
  sha256 "..."
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", "--production"
    libexec.install Dir["*"]
    (bin/"openclaw-installer").write_env_script libexec/"start.sh", :PATH => "#{Formula["node"].opt_bin}:$PATH"
  end

  test do
    system "#{bin}/openclaw-installer", "--version"
  end
end
```

**安装方式**：
```bash
brew tap openclaw/tap
brew install openclaw-installer
openclaw-installer
```

---

### 方案 2: pkg 打包成单个可执行文件

**优点**：
- 单个文件，无需安装
- 包含所有依赖
- 跨平台（macOS/Linux/Windows）

**实现**：

1. 安装 pkg：
```bash
npm install -g pkg
```

2. 创建 package.json 配置：
```json
{
  "name": "openclaw-installer",
  "version": "1.0.0",
  "bin": "scripts/main.js",
  "pkg": {
    "targets": ["node18-macos-arm64", "node18-macos-x64"],
    "assets": [
      "web/**/*",
      "config/**/*"
    ],
    "outputPath": "dist"
  }
}
```

3. 打包：
```bash
pkg . --out-path dist
```

4. 生成文件：
```
dist/
├── openclaw-installer-macos-arm64
└── openclaw-installer-macos-x64
```

**使用方式**：
```bash
./openclaw-installer-macos-arm64
```

---

### 方案 3: npm 全局包

**优点**：
- 简单易用
- 自动更新
- 适合开发者

**实现**：

1. 更新 package.json：
```json
{
  "name": "@openclaw/remote-installer",
  "version": "1.0.0",
  "bin": {
    "openclaw-installer": "./scripts/main.js",
    "openclaw-installer-web": "./scripts/web-server.js"
  },
  "preferGlobal": true
}
```

2. 发布到 npm：
```bash
npm publish --access public
```

**安装方式**：
```bash
npm install -g @openclaw/remote-installer
openclaw-installer
openclaw-installer-web
```

---

### 方案 4: macOS .app 应用

**优点**：
- 原生 macOS 应用
- 双击启动
- 图形界面

**实现**：

使用 Electron 或 Tauri 打包：

```bash
# 使用 Electron
npm install -g electron-packager

electron-packager . "OpenClaw Installer" \
  --platform=darwin \
  --arch=arm64,x64 \
  --icon=icon.icns \
  --out=dist
```

生成 `OpenClaw Installer.app`

---

## 🚀 推荐方案

### 短期（立即可用）

**方案 A: 独立脚本包**

创建一个独立的安装脚本，无需 OpenClaw 环境：

```bash
# 下载安装脚本
curl -fsSL https://raw.githubusercontent.com/openclaw/remote-installer/main/install.sh | bash

# 或者
git clone https://github.com/openclaw/remote-installer.git
cd remote-installer
npm install
./start.sh
```

### 中期（最佳体验）

**方案 B: Homebrew Formula**

```bash
brew install openclaw-installer
openclaw-installer
```

### 长期（生态完善）

**方案 C: 多种分发方式**

1. Homebrew（macOS 用户）
2. npm 全局包（开发者）
3. pkg 二进制（无 Node.js 环境）
4. .app 应用（普通用户）

---

## 📦 立即可用的封装

### 创建独立安装包

```bash
#!/bin/bash
# create-standalone.sh

DIST_DIR="openclaw-installer-standalone"

# 创建目录
mkdir -p $DIST_DIR

# 复制文件
cp -r scripts $DIST_DIR/
cp -r web $DIST_DIR/
cp -r config $DIST_DIR/
cp package.json $DIST_DIR/
cp start.sh $DIST_DIR/
cp README.md $DIST_DIR/

# 创建安装脚本
cat > $DIST_DIR/install.sh << 'EOF'
#!/bin/bash
echo "🦞 OpenClaw Remote Installer"
echo "=============================="
echo ""
echo "安装依赖..."
npm install --production
echo ""
echo "✅ 安装完成！"
echo ""
echo "使用方法："
echo "  ./start.sh"
EOF

chmod +x $DIST_DIR/install.sh
chmod +x $DIST_DIR/start.sh

# 打包
tar -czf openclaw-installer-v1.0.0.tar.gz $DIST_DIR

echo "✅ 打包完成: openclaw-installer-v1.0.0.tar.gz"
```

**使用方式**：

```bash
# 下载
curl -L https://github.com/openclaw/remote-installer/releases/download/v1.0.0/openclaw-installer-v1.0.0.tar.gz -o installer.tar.gz

# 解压
tar -xzf installer.tar.gz
cd openclaw-installer-standalone

# 安装依赖
./install.sh

# 运行
./start.sh
```

---

## 🎯 最终建议

### 立即实施

1. **创建独立安装包**（tar.gz）
   - 包含所有文件
   - 一键安装依赖
   - 无需 OpenClaw 环境

2. **发布到 GitHub Releases**
   - 提供下载链接
   - 版本管理
   - 更新日志

### 后续优化

1. **创建 Homebrew Formula**
   - 最适合 macOS 用户
   - 一行命令安装

2. **发布到 npm**
   - 适合开发者
   - 全局命令

3. **pkg 打包**
   - 单个可执行文件
   - 无需 Node.js

---

## 📊 对比

| 方案 | 安装难度 | 使用难度 | 更新方式 | 适用人群 |
|------|---------|---------|---------|---------|
| 独立脚本包 | ⭐⭐ | ⭐ | 手动下载 | 所有人 |
| Homebrew | ⭐ | ⭐ | brew upgrade | macOS 用户 |
| npm 全局包 | ⭐ | ⭐ | npm update -g | 开发者 |
| pkg 二进制 | ⭐ | ⭐ | 手动下载 | 无 Node.js 环境 |
| .app 应用 | ⭐ | ⭐ | 自动更新 | 普通用户 |

---

## ✅ 结论

**当前状态**：
- ✅ 功能完整
- ✅ 可以独立运行
- ✅ 依赖清晰
- ✅ 适合封装

**推荐方案**：
1. **立即**：创建独立安装包（tar.gz）
2. **短期**：发布 Homebrew Formula
3. **长期**：多种分发方式

**下一步**：
需要我现在创建独立安装包吗？
