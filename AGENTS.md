# Agent Handbook

本指南面向协同开发与文档维护的 Agent，可快速了解项目结构、协作流程与常见任务的操作要点。

## 1. 仓库速览
- **应用类型**：Vite + Vue 3 + TypeScript 单页应用，提供实时 HTTP 探测仪表盘。
- **入口**：`src/main.ts` 创建应用并挂载 i18n；`App.vue` 组合 Header/Controls/Chart/Log。
- **关键目录**  
  - `src/components/`：UI 组件（HeaderBar、ControlsPanel、LatencyChart、LogTable、BaseEChart）。  
  - `src/composables/`：`usePingMatrix` 聚合轮询逻辑、日志维护与本地状态。  
  - `src/config/`：可调配置（如日志保留天数）。  
  - `src/services/`：IndexedDB 持久化、配置/日志导入导出。  
  - `src/locales/`：`en` / `zh-CN` / `zh-TW` i18n 文案。  
  - `scripts/deploy.js`：一键构建 + gh-pages 发布脚本。
- **前置环境**：Node.js 20+、npm 10+。

## 2. 技术栈与依赖
- Vue 3（`<script setup>`）、Vite 7、自定义 `__APP_VERSION__` 常量。
- ECharts 6（堆叠折线 + dataZoom）搭配 `BaseEChart` 自定义组件。
- `@vueuse/core` (`useStorage`, `useVirtualList`)、`worker-timers`、`nanoid`。
- unplugin-icons + `@iconify-json/mdi` 提供图标。

## 3. 开发流程
1. **同步需求**：查看 Issue/任务，确认要触达的模块与目标语言（中/英）。
2. **读取偏好**：参考 `AGENTS.md` 与 `README*.md`，保持现有语气和排版。
3. **本地运行**：`npm install` → `npm run dev`；必要时 `npm run build` 验证类型。
4. **提交前自查**：核对 UI 状态（Start/Stop、日志导入导出、布局切换、语言切换）。
5. **PR 要求**：按照 Conventional Commits，附带截图/录屏说明交互变化。

## 4. 代码风格
- 2 空格缩进、无分号、单引号字符串；CSS/SFC 遵循现有顺序（模板 -> 脚本 -> 样式）。
- 变量 camelCase，组件 PascalCase，composable 以 `useX` 命名。
- 添加逻辑性注释时突出“为什么”，避免解释显而易见的语句。
- 共享逻辑尽量放入 `src/composables`，便于复用和测试。

## 5. 测试与验证
- 目前无自动化测试，强制至少进行一次手动回归：Start/Stop、清空日志、导出/导入配置和日志、切换语言、调整时间轴。
- 修改日志相关功能时，使用浏览器 Application → IndexedDB 检查写入是否正确，并确认 retention 生效。
- 与 UI/布局相关的改动请在桌面 & 移动宽度（<=900px）下检查一遍。

## 6. 文档与知识同步
- README（英文）与 README-zh-ch（中文）需同步关键信息；若新增命令/依赖，请双语更新。
- 维护者指引或自动化约束写入本文件；若有新 Agent 角色/工作流，请新增分节描述触发条件与输出要求。
- 变更日志暂未自动生成，重要特性需在 PR 描述中说明以便后续汇总。

## 7. 常见任务 Playbook
### 7.1 新增监控目标
1. 修改 `src/composables/usePingMatrix.ts` → `DEFAULT_TARGETS`。
2. 保证 `id` 唯一、`color` 与 ECharts 区分度高。
3. 如需可视化配置，优先封装 composable 或服务，而非直接操作组件。

### 7.2 更新多语言
1. 在 `src/locales/*.json` 中添加 key，保持英文原文 → 简体 → 繁体顺序。
2. 组件内通过 `t('namespace.key')` 调用，尽量收敛到已有 namespace。
3. PR 中附上截图或录屏展示语言切换结果。

### 7.3 发布流程
1. `npm run build` 确认通过。
2. `npm run deploy` 会自动构建、`npm version patch`、`gh-pages` 发布并推送 tag。
3. QA 在 demo 页验证：曲线渲染、日志导出导入、语言切换、布局切换均正常。

## 8. 安全与配置注意
- 禁止将 `node_modules/`、`dist/`、导出的 JSON 样本等大文件入库。
- 修改日志保留策略或 schema 时，务必同步更新 `logStorage.ts` / `logTransfer.ts` 里的校验逻辑与 README。
- 远程资源 (favicon/API) 仅用于耗时测量，切勿在生产中加入需要凭证的内部接口。

## 9. 支持渠道
- 构建或脚本异常 → 查看 `scripts/deploy.js` 日志；必要时手动执行其中的命令定位问题。
- UI 异常 → 先在 `npm run dev` 下复现，再检查 console/Network，最后更新 README/DEPLOYMENT_NOTE。
- 文档策略或 Agent 职责不清 → 在 Issue 中 @Maintainers，或直接在 AGENTS.md 提 PR。
