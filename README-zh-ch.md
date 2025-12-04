# Ping Matrix

<p align="center">
  <img src="public/icon.png" width="120" alt="Ping Matrix 标志" />
</p>

一个基于 Vite + Vue 3 + TypeScript 构建的复古风格 HTTP 探测矩阵面板。应用使用 `fetch` + `AbortController`（由 `worker-timers` 提供更稳定的定时器）并行轮询多个站点，将成功/超时/异常及耗时写入可持久化的日志流，同时以 ECharts 堆叠折线图呈现实时与历史延迟。

**在线演示** · https://ccwq.github.io/http-ping-matrix

### 预览
![Ping Matrix 仪表板](readme-assets/1764810991064.png)

## 目录
- [Ping Matrix](#ping-matrix)
  - [目录](#目录)
  - [概述](#概述)
  - [功能亮点](#功能亮点)
    - [监控与控制](#监控与控制)
    - [可视化与日志](#可视化与日志)
    - [持久化与协作](#持久化与协作)
    - [本地化与用户体验](#本地化与用户体验)
    - [安装与离线体验](#安装与离线体验)
  - [架构与目录结构](#架构与目录结构)
  - [快速开始](#快速开始)
    - [环境要求](#环境要求)
    - [安装与运行](#安装与运行)
  - [使用指南](#使用指南)
  - [安装成 Chrome App](#安装成-chrome-app)
  - [持久化与数据迁移](#持久化与数据迁移)
    - [导出 / 导入配置](#导出--导入配置)
    - [导出 / 导入日志](#导出--导入日志)
  - [自定义配置](#自定义配置)
    - [修改默认监控目标](#修改默认监控目标)
    - [调整日志保留或导出 schema](#调整日志保留或导出-schema)
    - [更新多语言](#更新多语言)
  - [技术栈](#技术栈)
  - [部署](#部署)
  - [故障排除与常见问题](#故障排除与常见问题)

## 概述
Ping Matrix 是一个单页仪表板，保持控制流、可视化和日志的同步：

1. `usePingMatrix` 负责维护目标站点、定时器、日志和本地偏好（间隔/超时/同步规则）。
2. `HeaderBar` 同时处理布局切换、语言选择、配置&日志导入导出等操作。
3. `LatencyChart` 在一个固定窗口内渲染实时/历史曲线，并允许拖动时间轴或范围。
4. `LogTable` 使用 `useVirtualList` 虚拟滚动表格，即使数千条记录也能保持流畅。

## 功能亮点

### 监控与控制
- 🔁 **Worker 定时器驱动**：使用 `worker-timers` 减少后台标签页被限制导致的 tick 漏拍。
- ⚙️ **同步/独立超时**：可将超时锁定为等同于轮询间隔，或分别指定 0.5s–30s。
- 💾 **IndexedDB 日志持久化**：保留最近 3 天数据（可通过 `src/config/logConfig.ts` 调整）。

### 可视化与日志
- 📈 **多布局 ECharts 面板**：4 组布局在桌面/移动端都能保持网格排布。
- 🧮 **实时/历史窗口**：时间轴可在“实时”与历史任意点位切换，范围滑块可放大 1–60 分钟窗口。
- 📜 **虚拟列表日志**：色彩标签标示 success/warn/error/timeout，tooltip 暴露错误信息。

### 持久化与协作
- 🔐 **偏好存储**：间隔、超时、同步开关、布局模式、语言选择均通过 `useStorage` 持久化。
- 📦 **JSON 导入导出**：提供配置（定时器+布局+语言）与日志（同导出的 JSON 即可导入）互通。

### 本地化与用户体验
- 🌐 **三语界面**：默认自动读取 `localStorage` 保存的语言，内置 `en` / `zh-CN` / `zh-TW`。
- 🧩 **矩阵风 UI**：深色背景搭配亮色边框，配合等宽/像素字体与复古按钮、滑块。

### 安装与离线体验
- 📲 **支持 Chrome 安装**：Manifest + Service Worker 让浏览器在地址栏展示“安装应用”入口，并以独立窗口运行。
- 🚀 **自动更新的 Service Worker**：借助 `vite-plugin-pwa` 管理静态资产缓存，用户无需手动刷新即可获得最新部署。

## 架构与目录结构

```
src/
├─ components/         # UI 组件如 Header、Controls、Chart、Log Table
├─ composables/        # usePingMatrix 集中式业务逻辑
├─ config/             # 可调常量如日志保留策略
├─ services/           # IndexedDB 持久化、配置/日志导入导出
├─ locales/            # i18n 资源 (en, zh-CN, zh-TW)
├─ assets/ & public/   # 静态资源，构建时直接复制
├─ main.ts             # 应用启动 + i18n 初始化
└─ style.css           # 全局像素风格 CSS & 布局预设
```

关键交互自上而下保持“单一数据源”：
- `usePingMatrix` → 统一触发 `start/stop/clear`、执行 `ping()`、写入日志并同步到 IndexedDB。
- `HeaderBar` → 通过 `configTransfer` / `logTransfer` 对应的 JSON schema 进行数据交换。
- `LogTable` / `LatencyChart` → 只消费 `log` 和 `targets`，完全无副作用，方便未来复用。

## 快速开始

### 环境要求
- Node.js **20+**
- npm **10+**

### 安装与运行
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 类型检查 + Vite 构建输出到 dist/
npm run preview    # 用本地服务器预览 dist/
```

> 提示：页面初次加载时会自动调用 `start()`。点击 Stop 可观察空闲状态。

## 使用指南
1. **按下 `[ START ]`** 开始轮询。LED 指示灯与 Header 状态会同步更新。
2. **拖动 Interval/Timeout 滑块** 调整频率；勾选 “Sync” 将两者锁定。
3. **选择布局 & 语言**：Header 中的布局标签与语言下拉会即时保存偏好。
4. **导出 / 导入**：Header 内的 Config / Logs 组各自负责 JSON 导入导出（见下文）。
5. **日志面板**：悬停在单元格可查看错误详情，表头显示总条目数。
6. **图表面板**：实时模式下按 “Back to Realtime” 可恢复自动滚动。

## 安装成 Chrome App
1. 在 Chrome 中打开 https://ccwq.github.io/http-ping-matrix/（或你的部署地址）。
2. 在页面中任意点击一次并停留约 30 秒，满足 Chrome 的交互判定。
3. 选择其一：
   - 点击 Header 中出现的 **[ 安装应用 ]** 按钮。
   - 或使用 Chrome 地址栏安装图标 / 菜单 `⋮ > 安装 Ping Matrix...`。
4. 安装完成后会自动隐藏按钮，仪表板将以独立窗口运行。

## 持久化与数据迁移

| 类型 | 位置 | 说明 |
| --- | --- | --- |
| 偏好设置 | `localStorage` (`ping-matrix-*`) | 自定义间隔/布局/语言，浏览器重启时自动加载。 |
| 日志 | IndexedDB (`http-ping-logs`) | 保留 3 天数据，过期记录在写入/读取时清理。 |
| 配置导出 | `services/configTransfer.ts` | `type=http-ping-config`，跨设备导入以保持一致行为。 |
| 日志导出 | `services/logTransfer.ts` | `type=http-ping-logs`，包含保留信息并按时间倒序排列。 |

### 导出 / 导入配置
1. 点击 Header 中齿轮组的下载按钮 → 下载 `ping-config-*.json`。
2. 在目标环境点击上传按钮 → 选择 JSON → 验证通过后显示成功消息。

### 导出 / 导入日志
1. 日志导出文件包含 `entries` 数组，可用于支持/故障排除。
2. 导入时自动覆写 IndexedDB 并立即刷新界面中的日志列表。

## 自定义配置

### 修改默认监控目标
编辑 `src/composables/usePingMatrix.ts` 中的 `DEFAULT_TARGETS`：
```ts
const DEFAULT_TARGETS = [
  { id: 'github', name: 'github', url: 'https://github.com/favicon.ico', color: '#8b5cf6' },
  { id: 'new-api', name: 'internal api', url: 'https://api.example.com/ping', color: '#ffd500' }
]
```
- 确保 `id` 唯一，`color` 使用图表可读的 HEX 值。
- 目标未在 UI 表单中暴露；生产环境可考虑使用配置中心生成此列表。

### 调整日志保留或导出 schema
- 在 `src/config/logConfig.ts` 中修改 `retentionDays`，其他服务会自动读取毫秒值。
- 若修改导入导出字段，请同步更新 `configTransfer` / `logTransfer` 中的验证逻辑。

### 更新多语言
编辑 `src/locales/*.json`，添加新的 key 后即可在组件中通过 `t('key')` 使用。

## 技术栈
- **Vue 3 + `<script setup>`**：驱动 UI 与响应式状态。
- **Vite 7**：极速开发体验，支持 `__APP_VERSION__` 注入。
- **ECharts 6**：堆叠折线图 + dataZoom + 自定义 tooltip。
- **@vueuse/core**：提供 `useStorage`、`useVirtualList` 等工具。
- **worker-timers**：即使在后台标签页也能更准确地触发 `setInterval`。
- **IndexedDB + nanoid**：持久化日志与唯一 ID。
- **unplugin-icons**：按需导入 Material Design Icons。

## 部署
```bash
npm run build        # 构建 dist/ 并进行类型检查
npm run deploy       # 执行 scripts/deploy.js 推送到 GitHub Pages
```
`deploy` 脚本会自动：
1. 构建生产包；
2. 更新 `package.json` 中的补丁版本；
3. 使用 `gh-pages` 发布 `dist/`；
4. 推送 `master` 分支并附带标签。

> 部署前务必确认演示站点对新的 base (`/http-ping-matrix/`) 配置保持一致。

部署完成后建议访问线上地址，运行 Chrome DevTools Lighthouse（PWA 预设）确认 `manifest.webmanifest` 与 `sw.js` 可被访问，并确保 “可安装” 检查项为绿色。

## 故障排除与常见问题
- **CORS/不透明响应**：应用仅需发出 `no-cors` 请求以测量耗时。若目标完全不可访问，会显示 `ERR/Timeout`。
- **日志过大**：使用 Header 中的 `[ CLEAR LOG ]` 按钮或导入空日志文件即可重置。
- **图表无数据**：确认已按下 `[START]` 且 `targets` 列表非空；在开发者工具中查看 `ping()` 抛出的异常。
- **集成到其他项目**：将 `usePingMatrix`、`LatencyChart`、`LogTable` 复制到你的 Vue 应用，并保留 `LOG_RETENTION_MS` 相关依赖即可。

---

欢迎通过 Issue/PR 分享改进意见，或参考 [AGENTS.md](AGENTS.md) 中的项目协作指引。
