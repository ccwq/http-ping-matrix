## 1. Session Window State

- [x] 1.1 在 `usePingMatrix` 中定义并暴露会话窗口状态（实时/历史、时间锚点、窗口跨度、预算配置）。
- [x] 1.2 新增窗口选择器，提供日志表与图表可复用的窗口化数据访问接口。
- [x] 1.3 增加窗口边界处理（空数据、清空日志、暂停/恢复、历史越界回退）。

## 2. Log Table Virtualization Refactor

- [x] 2.1 将 `LogTable` 的数据源切换为窗口化数据，移除每 tick 全量 map/reduce 的派生路径。
- [x] 2.2 引入行数据增量缓存策略，仅对新增/失效区间更新 row 映射。
- [x] 2.3 保持现有虚拟列表交互与样式语义不变，验证移动端与桌面端滚动表现。

## 3. Latency Chart Windowed Series

- [x] 3.1 将 `LatencyChart` 的 groupedSeries 构建改为基于会话窗口和增量更新。
- [x] 3.2 增加每序列点数预算与超预算降级策略（采样或截断）。
- [x] 3.3 校验 realtime/history 切换下图表与日志表时间窗口一致性。

## 4. Persistence Decoupling

- [x] 4.1 为日志存储增加增量写入接口，避免每 tick 全量 clear + rewrite。
- [x] 4.2 将 retention 清理改为独立、低频任务，不阻塞热路径渲染。
- [x] 4.3 验证导入/导出、清空日志与增量写入路径的兼容性。

## 5. Performance Validation

- [ ] 5.1 建立长时运行压测脚本与手工场景（20-40 分钟）记录 FPS、主线程占用、内存曲线。
- [ ] 5.2 对比改造前后 GC 频率、卡顿时长与崩溃复现率。
- [x] 5.3 更新 README 与变更说明，补充会话窗口与性能调优配置说明。
