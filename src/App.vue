<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStorage } from '@vueuse/core'
import HeaderBar from '@/components/HeaderBar.vue'
import ControlsPanel from '@/components/ControlsPanel.vue'
import LatencyChart from '@/components/LatencyChart.vue'
import LogTable from '@/components/LogTable.vue'
import { usePingMatrix } from '@/composables/usePingMatrix'

type LayoutMode = 'a' | 'b' | 'c' | 'd'

const { targets, log, interval, timeout, syncTimers, isRunning, start, stop, clearLog } = usePingMatrix()

const layoutMode = useStorage<LayoutMode>('ping-matrix-layout', 'a')
const layoutDefs = [
  { id: 'a', nameKey: 'layout.matrix', descKey: 'layout.matrixDesc' },
  { id: 'b', nameKey: 'layout.dual', descKey: 'layout.dualDesc' },
  { id: 'c', nameKey: 'layout.wide', descKey: 'layout.wideDesc' },
  { id: 'd', nameKey: 'layout.split', descKey: 'layout.splitDesc' }
] as const

const languageDefs = [
  { id: 'en', labelKey: 'lang.en' },
  { id: 'zh-CN', labelKey: 'lang.zhCN' },
  { id: 'zh-TW', labelKey: 'lang.zhTW' }
] as const

const { t, locale } = useI18n()

const layoutOptions = computed(() =>
  layoutDefs.map((item) => {
    const name = t(item.nameKey)
    return {
      id: item.id,
      label: name,
      hint: t('layout.hint', { name, description: t(item.descKey) })
    }
  })
)

const languageOptions = computed(() =>
  languageDefs.map((item) => ({
    id: item.id,
    label: t(item.labelKey)
  }))
)

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
const handleLocaleChange = (value: string) => {
  locale.value = value
  localStorage.setItem('ping-matrix-locale', value)
}
</script>

<template>
  <main :class="appClasses">
    <HeaderBar
      :layout-mode="layoutMode"
      :options="layoutOptions"
      :is-running="isRunning"
      :languages="languageOptions"
      :current-locale="locale"
      @update:layout="handleLayoutChange"
      @update:locale="handleLocaleChange"
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
