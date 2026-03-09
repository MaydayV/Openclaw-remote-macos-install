# 内网穿透方案 - 解决无公网 IP 问题

## 问题

大部分家庭宽带都在 NAT 后面，没有公网 IP，无法直接 SSH 连接。

## 解决方案

### 方案 1: Tailscale（最推荐）⭐

**特点**：
- ✅ 完全免费
- ✅ 5 分钟搞定
- ✅ 自动穿透 NAT
- ✅ 点对点加密
- ✅ 跨平台

**安装**：

```bash
# 你的电脑
brew install tailscale
sudo tailscale up

# 朋友的 Mac
brew install tailscale
sudo tailscale up
```

**使用**：

1. 两台设备登录同一个 Tailscale 账号
2. 自动组网，获得虚拟 IP（例如 100.64.1.2）
3. 直接 SSH 连接虚拟 IP

```bash
# 查看 Tailscale IP
tailscale ip -4

# SSH 连接
ssh user@100.64.1.2
```

**在 Web 界面中使用**：
- 主机地址填写 Tailscale IP（100.64.x.x）
- 其他配置不变

---

### 方案 2: Cloudflare Tunnel

**特点**：
- ✅ 免费
- ✅ 不需要公网 IP
- ✅ 支持 SSH over HTTPS
- ⚠️ 配置稍复杂

**安装**：

```bash
# 朋友的 Mac
brew install cloudflared
```

**配置**：

```bash
# 1. 登录 Cloudflare
cloudflared tunnel login

# 2. 创建隧道
cloudflared tunnel create my-mac

# 3. 配置文件 ~/.cloudflared/config.yml
tunnel: <tunnel-id>
credentials-file: /Users/xxx/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: ssh.example.com
    service: ssh://localhost:22
  - service: http_status:404

# 4. 配置 DNS
cloudflared tunnel route dns my-mac ssh.example.com

# 5. 运行隧道
cloudflared tunnel run my-mac
```

**连接**：

```bash
# 你的电脑
brew install cloudflared

# SSH 连接
cloudflared access ssh --hostname ssh.example.com
```

---

### 方案 3: frp（自建内网穿透）

**特点**：
- ✅ 完全开源
- ✅ 自己控制
- ✅ 性能好
- ⚠️ 需要一台 VPS

**服务器端（VPS）**：

```bash
# 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.52.0/frp_0.52.0_linux_amd64.tar.gz
tar -xzf frp_0.52.0_linux_amd64.tar.gz
cd frp_0.52.0_linux_amd64

# 配置 frps.ini
[common]
bind_port = 7000

# 运行
./frps -c frps.ini
```

**客户端（朋友的 Mac）**：

```bash
# 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.52.0/frp_0.52.0_darwin_arm64.tar.gz
tar -xzf frp_0.52.0_darwin_arm64.tar.gz
cd frp_0.52.0_darwin_arm64

# 配置 frpc.ini
[common]
server_addr = your-vps-ip
server_port = 7000

[ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 22
remote_port = 6000

# 运行
./frpc -c frpc.ini
```

**连接**：

```bash
ssh -p 6000 user@your-vps-ip
```

---

### 方案 4: macOS 原生屏幕共享（最简单）

**特点**：
- ✅ 不需要任何配置
- ✅ Apple 自带中继
- ✅ 不需要公网 IP
- ⚠️ 需要手动操作

**步骤**：

```bash
# 朋友的 Mac
系统设置 → 通用 → 共享 → 屏幕共享 → 生成链接

# 会生成一个 iCloud 链接
https://screensharing.apple.com/xxxxx

# 你打开链接，控制屏幕
# 打开终端，执行安装命令
```

---

### 方案 5: ZeroTier

**特点**：
- ✅ 免费（25 设备以内）
- ✅ 简单易用
- ✅ 跨平台

**安装**：

```bash
# 你的电脑
brew install zerotier-one

# 朋友的 Mac
brew install zerotier-one
```

**使用**：

```bash
# 1. 注册 ZeroTier 账号，创建网络
# 2. 加入网络
sudo zerotier-cli join <network-id>

# 3. 在 Web 控制台授权设备
# 4. 获得虚拟 IP，直接 SSH 连接
```

---

## 推荐方案对比

| 方案 | 难度 | 速度 | 稳定性 | 成本 | 推荐度 |
|------|------|------|--------|------|--------|
| Tailscale | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐⭐ |
| macOS 屏幕共享 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐ |
| ZeroTier | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐ |
| Cloudflare Tunnel | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 免费 | ⭐⭐⭐ |
| frp | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | VPS 费用 | ⭐⭐⭐ |

---

## 最佳实践

### 场景 1: 帮朋友安装（一次性）

**推荐**: macOS 原生屏幕共享
- 不需要安装任何东西
- 生成链接，打开就能用
- 适合一次性操作

### 场景 2: 长期维护（多次连接）

**推荐**: Tailscale
- 一次配置，永久使用
- 速度快，延迟低
- 自动重连

### 场景 3: 公司批量部署

**推荐**: frp + 自建服务器
- 完全可控
- 性能最好
- 支持大规模部署

---

## 集成到 Remote Installer

我们的 Remote Installer 已经支持这些方案：

1. **Tailscale IP**: 直接填写 100.64.x.x
2. **Cloudflare Tunnel**: 填写隧道域名
3. **frp**: 填写 VPS IP + 映射端口
4. **macOS 屏幕共享**: 使用浏览器方式（开发中）

---

## 快速开始

**最简单的方式（Tailscale）**：

```bash
# 1. 两台 Mac 都安装 Tailscale
brew install tailscale
sudo tailscale up

# 2. 查看 IP
tailscale ip -4

# 3. 在 Web 界面填写 Tailscale IP
# 主机地址: 100.64.1.2
# 其他配置不变

# 4. 开始安装！
```

---

**问题解决了！** 🎉
