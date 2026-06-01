# 窝囊费

一款可以添加到 iPhone 主屏幕的 PWA 小应用。它会把月薪、出勤天数、工作时间和休息时长折算成今日工资收益，并按秒显示钱袋进账动效。

## 本地预览

```powershell
node preview-server.js
```

打开：

```text
http://127.0.0.1:4173/index.html
```

## iPhone 快速安装方式

这是当前最轻量的安装方式，不需要 App Store 审核：

1. 将本目录部署到支持 HTTPS 的静态网站服务。
2. 用 iPhone Safari 打开部署后的地址。
3. 点击 Safari 底部“分享”按钮。
4. 选择“添加到主屏幕”。
5. 从主屏幕打开“窝囊费”，会以独立 App 样式运行。

## 原生 iOS 打包

当前 Windows 环境不能直接生成可安装的 iOS `.ipa`。如果要做成真正的 iOS App，需要在 macOS 上使用 Xcode，并配置 Apple 开发者签名。

可选发布方式：

- `Development`：用 Xcode 连接自己的 iPhone 安装调试版。
- `Ad Hoc`：需要 Apple Developer Program，并登记设备 UDID。
- `TestFlight`：需要 Apple Developer Program，适合分发给测试用户。
- `App Store`：需要提交审核。

我已提供 `capacitor.config.json`、`package.json` 和静态资源准备脚本，可在 Mac 上用 Capacitor 生成 iOS 工程。

## 计算规则

- 日薪 = 月薪 / 每月出勤天数。
- 有效工作秒数 = 上班到下班的总秒数 - 当日休息时长。
- 每秒进账 = 日薪 / 有效工作秒数。
- 休息时段会自动放在工作日中间，休息期间金额暂停增长。
