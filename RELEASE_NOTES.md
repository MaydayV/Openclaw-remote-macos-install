# 发布到 GitHub Release

## 方式 1: 使用 GitHub CLI（推荐）

### 1. 登录 GitHub CLI

```bash
gh auth login
```

### 2. 创建 Release

```bash
cd ~/.openclaw/workspace/skills/remote-macos-install

gh release create v1.0.0 \
  --title "v1.0.0 - Initial Release" \
  --notes-file RELEASE_NOTES.md \
  openclaw-installer-v1.0.0.tar.gz \
  openclaw-installer-v1.0.0.tar.gz.sha256
```

---

## 方式 2: 使用 GitHub Web 界面

### 1. 访问仓库

https://github.com/MaydayV/Openclaw-remote-macos-install

### 2. 创建 Release

1. 点击右侧 "Releases"
2. 点击 "Create a new release"
3. 填写信息：
   - Tag: `v1.0.0`
   - Title: `v1.0.0 - Initial Release`
   - Description: 见下方 Release Notes
4. 上传文件：
   - `openclaw-installer-v1.0.0.tar.gz`
   - `openclaw-installer-v1.0.0.tar.gz.sha256`
5. 点击 "Publish release"

---

## Release Notes

```markdown
## 🎉 OpenClaw Remote Installer v1.0.0

### Features / 功能

- ✅ SSH remote installation (quick & complete modes)
- ✅ Interactive configuration (API Key, channels, models)
- ✅ NAT traversal support (Tailscale)
- ✅ Web UI with installation wizard
- ✅ Batch deployment
- ✅ Standalone packaging

### Installation / 安装

#### Method 1: Standalone Package / 独立安装包

```bash
# Download and extract
curl -L https://github.com/MaydayV/Openclaw-remote-macos-install/releases/download/v1.0.0/openclaw-installer-v1.0.0.tar.gz -o installer.tar.gz
tar -xzf installer.tar.gz
cd openclaw-installer-standalone

# Quick start
./quick-start.sh
```

#### Method 2: Clone Repository / 克隆仓库

```bash
git clone https://github.com/MaydayV/Openclaw-remote-macos-install.git
cd Openclaw-remote-macos-install
npm install
./start.sh
```

### Documentation / 文档

- [README.md](https://github.com/MaydayV/Openclaw-remote-macos-install/blob/main/README.md) - Complete documentation
- [GUIDE.md](https://github.com/MaydayV/Openclaw-remote-macos-install/blob/main/GUIDE.md) - Usage guide
- [NAT-SOLUTIONS.md](https://github.com/MaydayV/Openclaw-remote-macos-install/blob/main/NAT-SOLUTIONS.md) - NAT traversal solutions
- [INSTALLATION-COMPARISON.md](https://github.com/MaydayV/Openclaw-remote-macos-install/blob/main/INSTALLATION-COMPARISON.md) - Installation comparison

### What's New / 更新内容

- Initial release with full functionality
- Complete installation with interactive configuration
- Web UI and installation wizard
- Tailscale integration for NAT traversal
- Batch deployment support

### Requirements / 系统要求

- macOS 10.15+ or Linux
- Node.js 18+
- SSH access to target Mac

### Quick Start / 快速开始

1. Download the standalone package
2. Extract and run `./quick-start.sh`
3. Choose installation mode
4. Follow the wizard

For detailed instructions, see [GUIDE.md](https://github.com/MaydayV/Openclaw-remote-macos-install/blob/main/GUIDE.md)

### SHA256 Checksum

```
bb9f57c6593f60572f15b6a397d31b9f4290f5234860b8284a3a56f9031cec47  openclaw-installer-v1.0.0.tar.gz
```

---

**Full Changelog**: https://github.com/MaydayV/Openclaw-remote-macos-install/commits/v1.0.0
```

---

## 文件位置

需要上传的文件：
- `~/.openclaw/workspace/skills/remote-macos-install/openclaw-installer-v1.0.0.tar.gz`
- `~/.openclaw/workspace/skills/remote-macos-install/openclaw-installer-v1.0.0.tar.gz.sha256`

---

## 完成后

Release 创建后，用户可以通过以下方式安装：

```bash
# 下载
curl -L https://github.com/MaydayV/Openclaw-remote-macos-install/releases/download/v1.0.0/openclaw-installer-v1.0.0.tar.gz -o installer.tar.gz

# 解压
tar -xzf installer.tar.gz
cd openclaw-installer-standalone

# 运行
./quick-start.sh
```
