<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { LogEntry, Target } from '@/composables/usePingMatrix'

const props = defineProps<{
  log: LogEntry[]
  targets: Target[]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const groupedSeries = computed(() => {
  const groups: Record<string, [number, number][]> = {}
  props.targets.forEach((target) => {
    groups[target.name] = []
  })

  for (const entry of props.log) {
    const bucket = groups[entry.targetName] ?? (groups[entry.targetName] = [])
    bucket.push([entry.timestamp, entry.duration])
    if (bucket.length > 200) {
      bucket.shift()
    }
  }
  return groups
})

const buildSeries = computed(() => {
  return props.targets.map((target) => ({
    name: target.name,
    type: 'line',
    smooth: true,
    showSymbol: false,
    color: target.color,
    areaStyle: { opacity: 0.25 },
    emphasis: {
      focus: 'series',
      lineStyle: { width: 3 }
    },
    data: groupedSeries.value[target.name] ?? []
  }))
})

const baseOptions: echarts.EChartsOption = {
  backgroundColor: 'transparent',
  grid: { left: 40, right: 20, top: 50, bottom: 40 },
  legend: {
    top: 10,
    textStyle: {
      color: '#c9d1d9',
      fontFamily: 'Press Start 2P',
      fontSize: 9
    },
    itemWidth: 10,
    itemHeight: 10
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'line' },
    backgroundColor: '#0b0f18',
    borderColor: '#00ffff',
    formatter: (params: any) => {
      const header = `<div>TIME: ${new Date(params[0].axisValue).toLocaleTimeString()}</div>`
      const rows = params
        .map(
          (item: any) =>
            `<div style="color:${item.color};font-family:'Fira Code', monospace;">${item.seriesName}: ${item.data[1]}ms</div>`
        )
        .join('')
      return header + rows
    }
  },
  xAxis: {
    type: 'time',
    boundaryGap: [0, 0],
    splitLine: {
      show: true,
      lineStyle: { color: '#1f2937', type: 'dashed' }
    },
    axisLine: { lineStyle: { color: '#00ffff' } },
    axisLabel: { color: '#c9d1d9' }
  },
  yAxis: {
    type: 'value',
    name: 'Latency (ms)',
    splitLine: {
      show: true,
      lineStyle: { color: '#1f2937', type: 'dashed' }
    },
    axisLine: { lineStyle: { color: '#00ffff' } },
    axisLabel: { color: '#c9d1d9' }
  },
  dataZoom: [
    {
      type: 'inside',
      throttle: 50
    },
    {
      type: 'slider',
      showDetail: false,
      height: 10,
      bottom: 6,
      borderColor: '#00ffff',
      handleStyle: { color: '#39ff14' },
      textStyle: { color: '#c9d1d9' }
    }
  ],
  series: []
}

const renderChart = () => {
  if (!chartInstance || !chartRef.value) return
  chartInstance.setOption({
    ...baseOptions,
    series: buildSeries.value
  })
}

const resizeChart = () => {
  chartInstance?.resize()
}

onMounted(() => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  renderChart()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
})

watch(
  buildSeries,
  () => {
    renderChart()
  },
  { deep: true }
)
</script>

<template>
  <section class="panel grid-area-chart chart-panel">
    <header class="panel-title">
      <span class="geek-title">Latency (ms)</span>
      <span class="meta">数据点：{{ log.length }}</span>
    </header>
    <div ref="chartRef" class="chart-container"></div>
  </section>
</template>

<style scoped>
.chart-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.meta {
  color: var(--color-muted);
}

.chart-container {
  width: 100%;
  height: 280px;
}

@media (min-height: 900px) {
  .chart-container {
    height: 360px;
  }
}
</style>
