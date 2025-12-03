# Repository Guidelines

## 项目结构与模块组织
根目录下 `src/` 是 Vue 3 + TypeScript 源码，`src/components/` 放 UI 片段，`src/composables/` 为共享逻辑，`src/assets/` 与 `public/` 存放静态资源，`src/locales/` 管理 i18n 字符串。`dist/` 由 `npm run build` 产出，`scripts/deploy.js` 配合 `npm run deploy` 推送到目标站点。`assets/` 与 `public/` 中的静态资源在打包时直接复制，不需要额外处理。

## 构建、测试与本地开发命令
- `npm install`：安装依赖，确保 Node.js 20+ 环境。  
- `npm run dev`：启动 Vite 开发服务器（默认 http://localhost:5173），热更新支持组件/样式改动。  
- `npm run build`：依序运行 `vue-tsc -b` 做类型检查，再执行 `vite build` 生成生产包，产物在 `dist/`。  
- `npm run preview`：本地预览构建结果，用于验证 `dist/`。  
- `npm run deploy`：执行 `scripts/deploy.js`，根据脚本逻辑将 `dist/` 发布到 GitHub Pages（保持 `dist/` 最新后再跑）。

## 编码风格与命名约定
使用 2 个空格缩进、无终结分号、单引号字符串（参照 `src/main.ts`）。Vue SFC 中 `<script setup>` 与 `<style>` 保持组件 scoped 感觉。函数与变量使用 camelCase，组件名 PascalCase，文件命名与导出保持一致。`vue-tsc`+`typescript` 保障类型，`src/composables/useX` 习惯作可复用逻辑。

## 测试指南
目前未集成自动化测试框架，建议通过 `npm run dev` 手动验证关键交互（启动、开始轮询、切换布局、清日志）。若引入新的数据逻辑，可补充 Vue 组件/Composables 的 unit test 并记录在本节。

## 提交与 PR 指南
提交遵循 Conventional Commits（如 `feat: …`、`fix: …`、`chore(deps): …`），方便自动化变更日志。Pull request 需附简要概述、改动截图（如 UI 变化）以及关联 issue/需求链接；如涉及部署，确认 `npm run build` 成功且 `dist/` 内容同步。

## 配置与安全提示
避免把 `node_modules/` 或 `dist/` 推送到仓库。若需调整默认语言、主题或超时参数，请优先通过 `src/composables` 提供的配置接口，避免直接修改 `public/` 的静态文件版本。

## 图标资源
- 项目已集成 [Material Design Icons](https://icones.js.org/collection/mdi)（通过 `unplugin-icons` 插件）。查找所需图标后，可直接在组件中 `import FileIcon from '~icons/mdi/file'` 使用，Vite 会在构建阶段自动按需打包。
- `vite.config.ts` 已注册 `Icons()` 插件，类型声明在 `src/env.d.ts`，如新增图标库请保持相同写法，避免手动引入 SVG。
