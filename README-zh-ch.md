# Ping Matrix

**在线演示**: [https://ccwq.github.io/http-ping-matrix](https://ccwq.github.io/http-ping-matrix)

一个基于 Vite + Vue 3 + TypeScript 的网络探测面板，主打 Geek/Pixel 风。通过 `fetch + AbortController` 按间隔轮询一组目标站点，记录耗时/状态/错误，并以堆叠折线图 + 虚拟列表实时展示。

## 功能特色
- 🚦 **核心 Ping 逻辑**：`usePingMatrix` 组合式函数集中管理目标、日志、interval/timeout，同步模式一键生效。
- 📈 **堆叠延迟图**：ECharts 硬折线堆叠，空数据保持固定时间窗口，Tooltip 自动列出所有站点与合计。
- 📋 **虚拟列表日志**：`useVirtualList` 保障大数据渲染效率，行高固定、状态颜色高亮，内部滚动不撑开布局。
- 🧩 **四种布局**：Header/Controls/Chart/Table 可随时切换布局，且布局与 Interval 设置都会持久化。
- 🎛️ **矩阵风 UI**：深色背景 + 亮色边框，配合等宽/像素字体与复古按钮、滑块。

## 使用方式
```bash
# 安装依赖
npm install

# 开发调试（默认 http://localhost:5173）
npm run dev

# 构建生产包
npm run build

# 预览构建结果
npm run preview
```

启动后点击 `[ START ]` 开始轮询，可通过滑块调整 Interval/Timeout，或使用布局标签查看不同面板排布；日志支持 `[ CLEAR LOG ]` 清空。更多高级自定义（如新增目标、ECharts 按需引入）欢迎参考源码。
