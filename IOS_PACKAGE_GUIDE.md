# iOS 打包说明

当前项目已经准备好用 Capacitor 封装成 iOS App，但真正生成 `.ipa` 必须在 macOS + Xcode 环境完成。

## Mac 上的步骤

1. 安装 Xcode，并打开一次完成初始化。
2. 安装 Node.js。
3. 在项目目录安装依赖：

```bash
npm install
```

4. 生成 iOS 工程：

```bash
npm run ios:prepare
npm run ios:add
npm run ios:sync
npm run ios:open
```

5. 在 Xcode 中选择你的 Apple Team。
6. 连接 iPhone，选择真机运行，或使用 Archive 导出 `.ipa`。

## 安装到 iPhone 的方式

- 自己手机调试：Xcode 连接 iPhone 后直接 Run。
- 发给别人测试：推荐 TestFlight。
- 直接分发 `.ipa`：需要 Apple Developer Program，并使用 Ad Hoc 或 Enterprise 签名。

## 注意

iOS 不允许未签名 App 直接安装。即使已经生成 `.ipa`，也必须用有效证书签名，手机才会允许安装。
