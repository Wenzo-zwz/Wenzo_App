# PUFF · 出气事务所

一个轻松、无血腥的网页解压玩具。上传照片制作专属卡通照片布偶，用夸张的玩具动画释放情绪。适配桌面和手机，无需账号或后端。

## 本地运行

推荐 Node.js 24，最低 Node.js 22.12。

```bash
npm ci
npm run dev
```

开发服务默认使用 5173 端口。生产构建与本地预览：

```bash
npm run build
npm run preview
```

## 可以玩什么

- 12 种工具：拳拳出击、拍拍脑袋、弹簧大锤、番茄投手、枕头大战、闪电充能、烦恼旋风、冰冻一下、小火苗、挠痒痒、彩纸派对、抱抱时间。
- 点击、长按连续互动，或聚焦布偶后按空格 / 回车；可调节力度、切换配色、开启合成音效。
- 选择或拖入照片，调节放大与位置，用本地滤镜生成卡通头像，再放进布偶；支持自定义小名。
- 连击反馈、60 秒限时挑战、36 秒呼吸放松、PNG 解压战报下载。
- 尊重系统减少动态效果设置；弹窗支持键盘焦点管理与 Escape 关闭。

## 照片与数据

照片的裁切、滤镜、预览和导出都由浏览器完成，不上传服务器、不使用远端 AI 接口，不写入 localStorage、数据库或分析服务。当前页面内存中的照片及互动记录在刷新后清除；主动下载的战报由用户自行保管。

照片功能是卡通滤镜与头像布偶化，并非生成式 AI 人物重建。支持 JPG、PNG、WebP、GIF、BMP 和 AVIF，单张最大 12 MB。轻松指数是游戏中的趣味反馈，不是健康评估。

## 验证

```bash
npm run build
npm test
```

浏览器测试优先使用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定的 Chromium，然后使用系统 `/usr/bin/chromium`，没有系统浏览器时使用 Playwright 自带的 Chromium。普通开发机首次运行测试可执行 `npx playwright install chromium`。测试自动启动 Vite，覆盖互动、连续点击、计时、照片处理、隐私、弹窗、下载及手机布局。

## 云环境

工作目录：`/workspace/Wenzo_App`。云环境已提供 Node.js 24 与 Chromium；npm 缓存使用可写目录：

```bash
npm ci --cache /workspace/.cache/npm
npm run build
npm test
npm run dev -- --port 5173 --strictPort
```

每个云任务本身已隔离，直接使用当前检出目录即可，无需额外创建 Git worktree。依赖与构建产物可以保留，开发服务器需在新任务中重新启动。项目不需要 API 密钥、数据库或额外运行环境变量。

在线版使用 GitHub Pages 静态托管，发布方式见下文。

## 离线单文件版

```bash
npm run build:offline
```

构建生成 `dist/PUFF.html`，把这一个文件保存到电脑，直接用 Chrome、Edge、Firefox 或 Safari 打开即可玩，无需安装 Node.js、启动服务器或联网。手机需使用能直接打开本地 HTML 的浏览器；部分聊天软件或系统文件预览器只预览文件，不会执行网页，需要选择“在浏览器中打开”。

离线版内置页面脚本、样式和图标，不加载 CDN 或远端资源。12 种工具、照片裁切与卡通滤镜、计时、呼吸放松及 PNG 战报下载均在浏览器本地运行；照片和本次互动记录在刷新或关闭后清除。部分浏览器的本地文件模式可能限制全屏或下载，这时可使用其他浏览器，或用 `npm run preview` 启动本地预览。

离线验证已在断网且阻断 HTTP(S) 请求的 Chromium 中，直接载入完整 HTML，覆盖 12 种工具、键盘互动、本地照片生成和 1080 × 1350 PNG 下载，未产生网络请求或页面错误。云环境的浏览器管理策略禁止 `file://` 导航，因此这里未能直接验证双击本地文件打开；未修改或绕过该策略。

## 在线发布到 GitHub Pages

```bash
npm run build:pages
```

命令先构建自包含网页，再将发布文件写入 `docs/index.html`，同时创建 `docs/.nojekyll`。发布网页不依赖根目录资源路径，可直接托管在 `/Wenzo_App/` 等子路径。将源码和 `docs` 一并提交推送后，在仓库设置中进行一次配置：

1. 打开 <https://github.com/Wenzo-zwz/Wenzo_App/settings/pages>。
2. 在 **Build and deployment** 中，将 **Source** 设为 **Deploy from a branch**。
3. 将 **Branch** 设为 **main**，目录设为 **/docs**，点击 **Save**。
4. 等待 GitHub 的 Pages 部署完成，再使用设置页显示的 **Visit site**。

首次启用后，默认站点地址应为 <https://wenzo-zwz.github.io/Wenzo_App/>。只有 Pages 部署成功后该地址才可访问；构建成功或推送代码不等于站点已上线。

后续更新页面时，重新执行 `npm run build:pages`，将变更后的 `docs` 一并提交推送即可更新网站。
