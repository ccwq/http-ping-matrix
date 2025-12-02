# Ping Matrix

Ping Matrix is a Vite + Vue 3 + TypeScript powered network probing dashboard with a retro geek/pixel aesthetic. It polls a set of target hosts via `fetch` + `AbortController`, records latency/status/errors, and renders stacked line charts plus a virtualized log stream in real time.

> 中文说明请查看 [README-zh-ch.md](README-zh-ch.md)。

## Highlights
- 🚦 **Centralized ping logic**: the `usePingMatrix` composable manages targets, logs, intervals/timeouts, and sync rules so changes propagate instantly.
- 📈 **Stacked latency chart**: ECharts renders hard-line stacks, retains a fixed window when there is no data, and the tooltip lists every site alongside the total latency.
- 📋 **Virtualized log stream**: `useVirtualList` keeps large datasets responsive with fixed row heights, color-coded statuses, and an internal scroll area that preserves layout.
- 🧩 **Four layout presets**: Header/Controls/Chart/Table can switch among four layouts, while layout choice and interval settings persist automatically.
- 🎛️ **Matrix-inspired UI**: dark background, neon borders, monospaced/pixel fonts, and retro buttons/sliders emphasize the console vibe.

## Getting Started
```
# Install dependencies
npm install

# Start dev server (defaults to http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview the production bundle
npm run preview
```

After launching the dev server or preview build, press `[ START ]` to begin polling, adjust Interval/Timeout with the sliders, explore alternate layouts via the header tabs, and clear the log with `[ CLEAR LOG ]`. For deeper customization (adding targets, tree-shaking ECharts, etc.), inspect the source code.
