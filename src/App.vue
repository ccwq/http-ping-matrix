<script setup lang="ts">
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import HeaderBar from '@/components/HeaderBar.vue'
import ControlsPanel from '@/components/ControlsPanel.vue'
import LatencyChart from '@/components/LatencyChart.vue'
import LogTable from '@/components/LogTable.vue'
import { usePingMatrix } from '@/composables/usePingMatrix'

type LayoutMode = 'a' | 'b' | 'c' | 'd'

const { targets, log, interval, timeout, syncTimers, isRunning, start, stop, clearLog } = usePingMatrix()

const layoutMode = useStorage<LayoutMode>('ping-matrix-layout', 'a')
const layoutOptions = [
  { id: 'a', label: '布局A', hint: '上下布局：控制 → 图表 → 表格' },
  { id: 'b', label: '布局B', hint: '左列控制 + 右列上下结构' },
  { id: 'c', label: '布局C', hint: '图表横向拉伸，控制面板在右侧' },
  { id: 'd', label: '布局D', hint: '表格在左，图表与控制在右侧' }
] satisfies { id: LayoutMode; label: string; hint: string }[]

const appClasses = computed(() => ['app-shell', `layout-${layoutMode.value}`])

const handleIntervalChange = (value: number) => {
  interval.value = value
}
const handleTimeoutChange = (value: number) => {
  timeout.value = value
}
const handleSyncChange = (value: boolean) => {
  syncTimers.value = value
}
const handleLayoutChange = (mode: string) => {
  layoutMode.value = (mode as LayoutMode) ?? 'a'
}
</script>

<template>
  <main :class="appClasses">
    <HeaderBar
      :layout-mode="layoutMode"
      :options="layoutOptions"
      :is-running="isRunning"
      @update:layout="handleLayoutChange"
    />

    <ControlsPanel
      :interval="interval"
      :timeout="timeout"
      :sync-timers="syncTimers"
      :is-running="isRunning"
      @start="start"
      @stop="stop"
      @clear="clearLog"
      @update:interval="handleIntervalChange"
      @update:timeout="handleTimeoutChange"
      @update:sync-timers="handleSyncChange"
    />

    <LatencyChart :log="log" :targets="targets" />
    <LogTable :log="log" />
  </main>
</template>
