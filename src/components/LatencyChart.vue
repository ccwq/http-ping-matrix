<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseEChart from '@/components/BaseEChart.vue'
import type { LogEntry, Target } from '@/composables/usePingMatrix'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  log: LogEntry[]
  targets: Target[]
}>()

const FIXED_WINDOW_MS = 5 * 60 * 1000
const WINDOW_PADDING_MS = 3 * 1000
const CLOCK_INTERVAL_MS = 1000
const MAX_POINTS_PER_SERIES = 600
const { t, locale } = useI18n()

const chartClock = ref(Date.now())
let clockTimer: number | null = null

// 使用内部时钟让时间轴稳定推进，避免依赖真实数据刷新频率
const tickClock = () => {
  chartClock.value = Date.now()
}

onMounted(() => {
  clockTimer = window.setInterval(tickClock, CLOCK_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (clockTimer !== null) {
    window.clearInterval(clockTimer)
    clockTimer = null
  }
})

const windowRange = computed(() => ({
  start: chartClock.value - FIXED_WINDOW_MS,
  end: chartClock.value
}))

const groupedSeries = computed(() => {
  const groups: Record<string, [number, number][]> = {}
  props.targets.forEach((target) => {
    groups[target.name] = []
  })

  const minTime = windowRange.value.start - WINDOW_PADDING_MS
  for (const entry of props.log) {
    if (entry.timestamp < minTime) continue
    entry.results.forEach((result) => {
      const bucket = groups[result.targetName] ?? (groups[result.targetName] = [])
      bucket.push([entry.timestamp, result.duration])
    })
  }
  Object.entries(groups).forEach(([name, entries]) => {
    const normalized = entries
      .filter(([timestamp]) => timestamp >= minTime)
      .sort((a, b) => a[0] - b[0])
    if (normalized.length > MAX_POINTS_PER_SERIES) {
      normalized.splice(0, normalized.length - MAX_POINTS_PER_SERIES)
    }
    groups[name] = normalized
  })
  return groups
})

const totalPoints = computed(() =>
  Object.values(groupedSeries.value).reduce((sum, series) => sum + series.length, 0)
)

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
  const hasData = totalPoints.value > 0
  const { start, end } = windowRange.value
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
      axisPointer: { type: 'line', animation: false },
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
        const formatter = new Intl.DateTimeFormat(locale.value, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
        const header = `<div>${t('chart.tooltipTime', {
          value: time ? formatter.format(new Date(time)) : '--'
        })}</div>`
        return `${header}${rows}<div style="margin-top:4px;color:#c9d1d9;">${t('chart.tooltipTotal', {
          value: total
        })}</div>`
      }
    },
    xAxis: {
      ...xAxisBase,
      min: start,
      max: end,
      splitNumber: hasData ? 6 : 5
    },
    yAxis: {
      type: 'value',
      name: t('chart.title'),
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
      <span class="geek-title">{{ t('chart.title') }}</span>
      <span class="meta">{{ t('chart.points', { count: totalPoints }) }}</span>
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
