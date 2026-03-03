## Why

当前日志渲染路径虽然使用了基础虚拟列表，但仍会在每次数据更新时对全量日志执行映射与派生计算，随着会话持续时间增长会产生明显卡顿，极端情况下导致页面崩溃或闪退。需要引入“基于会话窗口”的虚拟化渲染与数据供给机制，将渲染成本稳定在可控范围内。

## What Changes

- 新增会话窗口化日志渲染能力：按“当前会话窗口”而非全量日志驱动表格与图表。
- 引入分层数据模型：内存中仅保留当前渲染窗口与必要缓存，历史数据通过按需读取补齐。
- 增加渲染与数据更新节流策略，避免高频 tick 触发全量重建。
- 为会话窗口提供统一状态（时间锚点、窗口跨度、实时/历史模式），供图表与日志表共享。

## Capabilities

### New Capabilities
- `session-virtual-log-rendering`: 基于会话窗口的数据裁剪与虚拟渲染能力，确保海量日志下 UI 仍保持流畅。

### Modified Capabilities
- (none)

## Impact

- 受影响代码：`src/composables/usePingMatrix.ts`、`src/components/LogTable.vue`、`src/components/LatencyChart.vue`、`src/services/logStorage.ts`。
- 数据访问模式从“全量读写/全量派生”转向“增量写入 + 按窗口读取/计算”。
- 需要补充性能回归验证（长时间运行、低端设备、移动端）。
