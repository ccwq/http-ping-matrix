<script setup lang="ts">
import { computed } from 'vue'
import BaseEChart from '@/components/BaseEChart.vue'
import type { LogEntry, Target } from '@/composables/usePingMatrix'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  log: LogEntry[]
  targets: Target[]
}>()

const FIXED_WINDOW_MS = 5 * 60 * 1000

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
  Object.values(groups).forEach((entries) => entries.sort((a, b) => a[0] - b[0]))
  return groups
})

const buildSeries = computed(() =>
  props.targets.map((target) => ({
    name: target.name,
    type: 'line' as const,
    smooth: false,
    showSymbol: false,
    stack: 'latency' as const,
    color: target.color,
    areaStyle: { opacity: 0.35 },
    lineStyle: { width: 2 },
    emphasis: {
      focus: 'series' as const,
      lineStyle: { width: 3 }
    },
    data: groupedSeries.value[target.name] ?? []
  }))
)

const chartOption = computed<EChartsOption>(() => {
  const hasData = props.log.length > 0
  const now = Date.now()
  const xAxisBase = {
    type: 'time' as const,
    boundaryGap: [0, 0] as [number, number],
    splitLine: {
      show: true,
      lineStyle: { color: '#1f2937', type: 'dashed' as const }
    },
    axisLine: { lineStyle: { color: '#00ffff' } },
    axisLabel: { color: '#c9d1d9' }
  }

  return {
    backgroundColor: 'transparent',
    grid: { left: 30, right: 18, top: 40, bottom: 28 },
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
      formatter: (input: unknown) => {
        const params = (Array.isArray(input) ? input : [input]).filter(Boolean) as Array<{
          axisValue?: number
          data?: [number, number]
          seriesName: string
          color: string
        }>
        if (!params.length) return ''
        const time = params[0]?.axisValue
        const sorted = [...params].sort((a, b) => (b.data?.[1] ?? 0) - (a.data?.[1] ?? 0))
        const rows = sorted
          .map(
            (item) =>
              `<div style="color:${item.color};font-family:'Fira Code', monospace;">${item.seriesName}: <strong>${item.data?.[1] ?? '--'}ms</strong></div>`
          )
          .join('')
        const total = sorted.reduce((sum, item) => sum + (item.data?.[1] ?? 0), 0)
        const header = `<div>TIME: ${time ? new Date(time).toLocaleTimeString() : '--'}</div>`
        return `${header}${rows}<div style="margin-top:4px;color:#c9d1d9;">TOTAL: ${total}ms</div>`
      }
    },
    xAxis: hasData
      ? xAxisBase
      : {
          ...xAxisBase,
          min: now - FIXED_WINDOW_MS,
          max: now,
          splitNumber: 5
        },
    yAxis: {
      type: 'value',
      name: 'Latency (ms)',
      splitLine: {
        show: true,
        lineStyle: { color: '#1f2937', type: 'dashed' as const }
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
    series: buildSeries.value
  }
})
</script>

<template>
  <section class="panel grid-area-chart chart-panel">
    <header class="panel-title">
      <span class="geek-title">Latency (ms)</span>
      <span class="meta">数据点：{{ log.length }}</span>
    </header>
    <BaseEChart :option="chartOption" class="chart-container" />
  </section>
</template>

<style scoped>
.chart-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  min-height: 0;
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
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
</style>
