# Pages 部署笔记（2025-12-03）

1. GitHub Pages 已改为使用 GitHub Actions 作为发布源，workflow 位于 `.github/workflows/pages.yml`。
2. push 到 `master` 会自动执行 `npm ci && npm run build`，并通过 `actions/deploy-pages@v4` 把 `dist/` 上传到 `github-pages` 环境。
3. 仓库不再跟踪 `dist/` 构建产物，可本地运行 `npm run build` 验证，但不要提交生成内容。
4. 如果遇到部署失败，可在 Actions 页面点击 `Deploy to GitHub Pages` workflow 查看日志，必要时手动 `Re-run all jobs`。
5. 构建已集成 `vite-plugin-pwa`，需要确保 `dist/manifest.webmanifest`、`dist/sw.js` 与 `dist/workbox-*.js` 等文件一并推送；部署后在 Chrome DevTools Lighthouse 运行 PWA 检查，确认 “Installable” 项通过。
