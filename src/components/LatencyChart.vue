<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseEChart from '@/components/BaseEChart.vue'
import type { LogEntry, Target } from '@/composables/usePingMatrix'
import type { EChartsOption } from 'echarts'
import { LOG_RETENTION_MS } from '@/config/logConfig'

const props = defineProps<{
  log: LogEntry[]
  targets: Target[]
}>()

const FIXED_WINDOW_MS = 5 * 60 * 1000
const WINDOW_PADDING_MS = 3 * 1000
const CLOCK_INTERVAL_MS = 1000
const MAX_POINTS_PER_SERIES = 600
const REALTIME_EPSILON_MS = 1000
const TIME_SLIDER_STEP_MS = 1000
const RANGE_MIN_MS = 60 * 1000
const RANGE_STEP_MS = 60 * 1000
const CHART_PADDING_MIN_MS = 30 * 1000
const { t, locale } = useI18n()

const chartClock = ref(Date.now())
const rangeWindowMs = ref(FIXED_WINDOW_MS)
const isRealtime = ref(true)
const selectedTimestamp = ref(Date.now())
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

const timelineBounds = computed(() => {
  const now = chartClock.value
  if (!props.log.length) {
    return {
      min: now - Math.max(rangeWindowMs.value, CHART_PADDING_MIN_MS),
      max: now
    }
  }
  const newest = props.log[0]?.timestamp ?? now
  const oldest = props.log[props.log.length - 1]?.timestamp ?? now
  const retentionFloor = now - LOG_RETENTION_MS
  return {
    min: Math.max(oldest, retentionFloor),
    max: Math.max(newest, now)
  }
})

const rangeSliderMax = computed(() => {
  const span = timelineBounds.value.max - timelineBounds.value.min
  return Math.min(LOG_RETENTION_MS, Math.max(RANGE_MIN_MS, span || FIXED_WINDOW_MS))
})

watch(
  rangeSliderMax,
  (max) => {
    if (rangeWindowMs.value > max) {
      rangeWindowMs.value = max
    }
    if (rangeWindowMs.value < RANGE_MIN_MS) {
      rangeWindowMs.value = RANGE_MIN_MS
    }
  },
  { immediate: true }
)

watch(
  timelineBounds,
  ({ min, max }) => {
    if (isRealtime.value) {
      selectedTimestamp.value = max
      return
    }
    if (selectedTimestamp.value > max) {
      selectedTimestamp.value = max
    }
    if (selectedTimestamp.value < min) {
      selectedTimestamp.value = min
    }
  },
  { immediate: true }
)

const effectiveEnd = computed(() => (isRealtime.value ? timelineBounds.value.max : selectedTimestamp.value))

const windowRange = computed(() => {
  const end = effectiveEnd.value
  const start = Math.max(end - rangeWindowMs.value, timelineBounds.value.min)
  return { start, end }
})

const sliderFormatter = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
)

const formatTimestamp = (timestamp: number) => sliderFormatter.value.format(new Date(timestamp))

const timeSliderLabel = computed(() =>
  t(isRealtime.value ? 'chart.timeSliderRealtime' : 'chart.timeSliderHistory', {
    value: formatTimestamp(isRealtime.value ? timelineBounds.value.max : selectedTimestamp.value)
  })
)

const formatRangeLabel = (value: number) => {
  const minutes = Math.round(value / (60 * 1000))
  if (value >= 60 * 60 * 1000) {
    const hours = Math.round((value / (60 * 60 * 1000)) * 10) / 10
    return t('chart.rangeHours', { value: hours })
  }
  return t('chart.rangeMinutes', { value: Math.max(1, minutes) })
}

const rangeSliderLabel = computed(() => t('chart.rangeSliderLabel', { value: formatRangeLabel(rangeWindowMs.value) }))


const modeBadgeText = computed(() => t(isRealtime.value ? 'chart.modeRealtime' : 'chart.modeHistory'))

const handleTimeSliderInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  const nearRealtime = Math.abs(value - timelineBounds.value.max) <= REALTIME_EPSILON_MS
  if (nearRealtime) {
    isRealtime.value = true
    selectedTimestamp.value = timelineBounds.value.max
    return
  }
  isRealtime.value = false
  selectedTimestamp.value = value
}

const resumeRealtime = () => {
  isRealtime.value = true
  selectedTimestamp.value = timelineBounds.value.max
}

const handleRangeChange = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  const clamped = Math.min(Math.max(value, RANGE_MIN_MS), rangeSliderMax.value)
  rangeWindowMs.value = clamped
}

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
    lineStyle: { width: 0.5 },
    emphasis: {
      focus: 'series' as const,
      lineStyle: { width: 0.5 }
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
      <div class="panel-title-main">
        <span class="geek-title">{{ t('chart.title') }}</span>
        <span class="meta">{{ t('chart.points', { count: totalPoints }) }}</span>
      </div>
      <div class="panel-title-actions">
        <span class="mode-chip">{{ modeBadgeText }}</span>
        <button class="btn realtime-btn" :disabled="isRealtime" @click="resumeRealtime">
          {{ t('chart.backToRealtime') }}
        </button>
      </div>
    </header>
    <div class="chart-controls" :aria-label="t('chart.timeControls')">
      <div class="control-section time-section">
        <div class="section-title">
          {{ t('chart.timeControls') }}
          <span class="label-text" style="margin-left: auto;">{{ timeSliderLabel }}</span>
        </div>

        <input
          class="time-slider"
          type="range"
          :min="timelineBounds.min"
          :max="timelineBounds.max"
          :step="TIME_SLIDER_STEP_MS"
          :value="selectedTimestamp"
          @input="handleTimeSliderInput"
        />
      </div>
      <div class="control-section range-section">
        <span class="section-title">{{ rangeSliderLabel }}</span>
        <input
          class="range-slider"
          type="range"
          :min="RANGE_MIN_MS"
          :max="rangeSliderMax"
          :step="RANGE_STEP_MS"
          :value="rangeWindowMs"
          @input="handleRangeChange"
        />
      </div>
    </div>
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
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.panel-title-main {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.meta {
  color: var(--color-muted);
}

.panel-title-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chart-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
}

.control-section {
  flex: 1 1 330px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.range-section{
  flex: 80px;
}

.section-title {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
  display: flex;
}

.label-text {
  color: var(--color-muted);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
}

.mode-chip {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.62rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.time-slider,
.range-slider {
  width: 100%;
  accent-color: var(--color-accent);
}

.realtime-btn {
  font-size: 0.68rem;
  padding: 0.3rem 0.6rem;
  white-space: nowrap;
}

.chart-container {
  width: 100%;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
</style>
