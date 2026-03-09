# Homebrew Formula for OpenClaw Remote Installer

class OpenclawInstaller < Formula
  desc "Remote OpenClaw installation tool for macOS"
  homepage "https://github.com/openclaw/remote-installer"
  url "https://github.com/openclaw/remote-installer/archive/v1.0.0.tar.gz"
  sha256 "REPLACE_WITH_ACTUAL_SHA256"
  license "MIT"
  
  depends_on "node"

  def install
    # 安装 npm 依赖
    system "npm", "install", "--production", "--ignore-scripts"
    
    # 安装所有文件到 libexec
    libexec.install Dir["*"]
    
    # 创建可执行文件
    (bin/"openclaw-installer").write <<~EOS
      #!/bin/bash
      cd "#{libexec}" && exec ./start.sh "$@"
    EOS
    
    (bin/"openclaw-installer-web").write <<~EOS
      #!/bin/bash
      cd "#{libexec}" && exec node scripts/web-server.js "$@"
    EOS
    
    chmod 0755, bin/"openclaw-installer"
    chmod 0755, bin/"openclaw-installer-web"
  end

  def caveats
    <<~EOS
      OpenClaw Remote Installer 已安装！

      使用方法：
        openclaw-installer              # 交互式菜单
        openclaw-installer-web          # 启动 Web 界面

      Web 界面地址：
        http://localhost:3456

      文档：
        #{opt_libexec}/README.md
        #{opt_libexec}/GUIDE.md
        #{opt_libexec}/NAT-SOLUTIONS.md

      首次使用建议：
        1. 配置 Tailscale（解决无公网 IP）
        2. 使用完整安装模式
        3. 查看安装向导：http://localhost:3456/wizard
    EOS
  end

  test do
    # 测试可执行文件存在
    assert_predicate bin/"openclaw-installer", :exist?
    assert_predicate bin/"openclaw-installer-web", :exist?
    
    # 测试 Node.js 脚本可以执行
    system "node", "#{libexec}/scripts/main.js", "--help"
  end
end
