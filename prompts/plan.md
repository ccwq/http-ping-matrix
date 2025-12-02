refined-demand: PingMatrix 开发者需求规格

1. 🎨 视觉与风格 (Geek / Pixel / Tech)

设计稿参考: prompts\Gemini_Generated_Image_xto8nfxto8nfxto8.png

布局: 采用 CSS Grid 实现紧凑的三栏式布局（或上下布局），无任何多余的 margin / padding。

配色 (Tech Dark Mode):

背景: #0d1117 (类 GitHub Dark) 或更深的 #0a0f1a。

主文本/边框: #c9d1d9 (淡灰)。

主色 (Accent): #39ff14 (矩阵绿) 或 #00ffff (科技青)。

图表线条: 采用高对比度的亮色系 (如: Cyan, Magenta, Yellow, Green)。

表格高亮 (Latency):

Success (< 200ms): #39ff14 (绿色)

Warn (200ms - 800ms): #f1e05a (黄色)

Danger (> 800ms): #ff7b72 (红色)

Timeout / Error: #f85149 (深红)

字体:

UI/文本: 使用等宽字体, 如 'Fira Code', 'JetBrains Mono', 'Roboto Mono'。

标题/Logo: (可选) 使用像素字体, 如 'Press Start 2P', 'Silkscreen' 来强化 Geek 风格。

组件风格:

无圆角: 所有元素（按钮、输入框、面板）使用 border-radius: 0;。

边框: 使用 1px solid 的主色 (Accent) 边框。

按钮: 悬停 (Hover) 时，使用 invert() 颜色反转或 box-shadow 发光效果。

Slider: 自定义样式，使其看起来更“方块化”和“像素化”。

1. 🧬 核心逻辑与状态 (State Management)

我们将使用 @vueuse/core 来管理大部分响应式状态。

usePingMatrix.js (Composable): 建议将核心逻辑抽离到一个 Composable 中。

State:

targets: ref<Target[]> (存储目标 URL 列表，包含 name, url 等)。

log: ref<LogEntry[]> (核心数据源: 扁平化的日志数组，供表格和图表使用)。

interval: ref(5000) (间隔时间, ms)。

timeout: ref(5000) (超时时间, ms)。

syncTimers: ref(true) (是否同步间隔和超时时间)。

isRunning: ref(false) (是否正在运行)。

LogEntry 类型定义:

TypeScript



interface LogEntry {

  id: string;          // 唯一ID (e.g., nanoid())

  timestamp: number;   // Date.now()

  targetName: string;  // e.g., 'Taobao', 'Google'

  url: string;         // 请求的URL

  status: 'success' | 'timeout' | 'error';

  duration: number;    // 耗时 (ms)

  error?: string;      // 错误信息

}

核心 Ping 函数 (替代 useFetch):

虽然需求提到了 useFetch，但对于 批量、循环、需精确计时 且 需处理超时 的场景，useFetch 并不如原生的 fetch + AbortController 灵活。

建议实现一个 ping(url, timeout) 辅助函数：

JavaScript



async function ping(url: string, timeout: number): Promise<Omit<LogEntry, 'id' | 'targetName'>> {

  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), timeout);

  const startTime = performance.now();



  try {

    // 关键: 附加时间戳, 破坏HTTP缓存

    const uniqueUrl = `${url}?_t=${Date.now()}`;



    await fetch(uniqueUrl, {

      signal: controller.signal,

      cache: 'no-store', // 确保不走缓存

      mode: 'no-cors'    // 注意: no-cors 模式下无法获取真实 status，但可以测量连接时间

    });



    const duration = Math.round(performance.now() - startTime);

    return { timestamp: Date.now(), url, status: 'success', duration };



  } catch (e) {

    const duration = Math.round(performance.now() - startTime);

    if (e.name === 'AbortError') {

      return { timestamp: Date.now(), url, status: 'timeout', duration: timeout, error: 'Timeout' };

    }

    return { timestamp: Date.now(), url, status: 'error', duration, error: e.message };

  } finally {

    clearTimeout(timer);

  }

}

useInterval 驱动:

使用 useIntervalFn (来自 @vueuse/core)，而不是 useInterval，因为它提供了更精细的控制。

useIntervalFn 的回调 (tick) 负责:

遍历 targets 列表。

await Promise.allSettled() 批量执行 ping() 函数。

将所有 Promise.allSettled 的结果（成功或失败）格式化为 LogEntry 对象。

推入 (push) 到 log.value 数组中。

3. 🧩 组件拆分 (Component Structure)

src/

├── App.vue           (主布局)

├── components/

│   ├── Header.vue      (标题, GitHub链接, Geek风格装饰)

│   ├── Controls.vue    (控制面板: Sliders, 按钮)

│   ├── LatencyChart.vue (ECharts 图表封装)

│   └── LogTable.vue    (虚拟列表格)

└── composables/

    └── usePingMatrix.js (核心状态与逻辑)

4. 📊 图表 (LatencyChart.vue)

ECharts 基础配置:

grid: 紧凑布局, grid: { left: 40, right: 20, top: 40, bottom: 30 }。

backgroundColor: transparent。

tooltip: trigger: 'axis', 自定义 formatter 显示所有目标在特定时间的延迟。

legend: 位于顶部，使用像素字体，itemWidth 和 itemHeight 设为较小值 (e.g., 10)。

X 轴 (时间):

type: 'time'。

splitLine: show: true, 使用虚线和暗色。

Y 轴 (延迟/ms):

type: 'value'。

name: 'Latency (ms)'。

splitLine: show: true, 使用虚线和暗色。

DataZoom:

提供底部 dataZoom (slider 类型) 用于时间范围选择。

Series (动态生成):

需求澄清: "堆叠" (Stack) 在延迟图表中没有意义（延迟不应相加）。你需要的应该是**"填充折线图" (Area Chart)**，但不堆叠。

使用 watch 或 computed 监听 log 的变化，并将其转换为 ECharts 需要的 series 数据。

series 结构 (每个 target 一个 series):

JavaScript



{

  name: 'Taobao',

  type: 'line',

  smooth: true,         // 平滑曲线

  showSymbol: false,    // 隐藏数据点

  areaStyle: {          // 填充区域

    opacity: 0.2

  },

  emphasis: {           // 高亮时加粗

    focus: 'series',

    lineStyle: { width: 3 }

  },

  // data: [[timestamp, duration], [timestamp, duration], ...]

  data: computedLogData['Taobao'] 

}

性能: log 数组会变得非常大。图表数据应节流 (throttle) 更新，或者在计算 series 数据时进行适当的 降采样 (downsampling)，ECharts 本身也支持。

5. 🧾 表格 (LogTable.vue)

虚拟列表 (@vueuse/core):

使用 useVirtualList hook。

const { list, containerProps, wrapperProps } = useVirtualList(log, { itemHeight: 28, overscan: 10 })

itemHeight 必须是一个固定的像素值 (e.g., 28px) 来匹配紧凑风格。

表格结构 (CSS Grid):

不使用 <table> 标签，使用 CSS Grid 来定义列，以获得最佳的对齐和性能。

.log-row { display: grid; grid-template-columns: 150px 100px 80px 100px 1fr; height: 28px; }

列定义:

Timestamp: 格式化 (e.g., HH:mm:ss.SSS)。

Target: 目标名称 (e.g., 'Baidu')。

Status: 'OK' (绿色), 'T/O' (红色), 'ERR' (红色)。

Duration (ms): 单元格根据延迟时间进行颜色编码 (见上文配色)。

Error: (如果 status === 'error')。

6. ⚙️ 控制 (Controls.vue)

布局: 使用 <fieldset> 和 <legend> 元素，营造复古终端风格。

HTML



<fieldset>

  <legend>[ CONTROLS ]</legend>

  </fieldset>

按钮:

[ START ] / [ STOP ] (切换 isRunning)

[ CLEAR LOG ] (清空 log.value = [])

Sliders (使用原生 input[type=range] 并自定义 CSS):

Interval: v-model="interval" (Min: 1000, Max: 30000, Step: 500)。

Timeout: v-model="timeout" (Min: 1000, Max: 30000, Step: 500)，:disabled="syncTimers"。

同步逻辑:

Checkbox: [ Sync Timeout to Interval ] (v-model="syncTimers")。

使用 watch 实现同步:

JavaScript



watch([interval, syncTimers], () => {

  if (syncTimers.value) {

    timeout.value = interval.value;

  }

});

🚀 总结 (TL;DR)

布局: CSS Grid 实现紧凑布局。

风格: 像素字体 (可选), 等宽字体 (必须), 无圆角, 亮色 Accent (绿/青) + 深色背景。

核心: useIntervalFn + Promise.allSettled + 原生 fetch (带 AbortController) 替代 useFetch，以实现精确的超时控制和批量请求。

状态: 核心逻辑封装在 usePingMatrix.js Composable 中，维护一个扁平化的 log 数组。

图表: ECharts 非堆叠填充折线图 (Area Chart)，X轴为 time，Y轴为 value。

表格: useVirtualList 渲染日志，行高固定 (e.g., 28px)，使用 CSS Grid 布局，单元格根据延迟着色。

这个方案在满足你所有技术栈要求的同时，强化了性能（虚拟列表、原生Fetch）和风格（Geek/Pixel）。

# 技术栈

> 需要均采用最新的版本

vite
vue
vueuse
echarts

