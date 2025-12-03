<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStorage } from '@vueuse/core'
import HeaderBar from '@/components/HeaderBar.vue'
import ControlsPanel from '@/components/ControlsPanel.vue'
import LatencyChart from '@/components/LatencyChart.vue'
import LogTable from '@/components/LogTable.vue'
import { usePingMatrix } from '@/composables/usePingMatrix'
import { buildConfigFile, parseConfigFile, type AppConfigData } from '@/services/configTransfer'
import { loadPersistedLogs, replaceAllLogs } from '@/services/logStorage'
import { buildLogExportFile, parseLogExportFile } from '@/services/logTransfer'

type LayoutMode = 'a' | 'b' | 'c' | 'd'

const { targets, log, interval, timeout, syncTimers, isRunning, start, stop, clearLog } = usePingMatrix()

const layoutMode = useStorage<LayoutMode>('ping-matrix-layout', 'b')
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

type LocaleId = (typeof languageDefs)[number]['id']

const LAYOUT_IDS = layoutDefs.map((item) => item.id) as readonly LayoutMode[]
const LOCALE_IDS = languageDefs.map((item) => item.id) as readonly LocaleId[]
const MIN_INTERVAL = 500
const MAX_INTERVAL = 30000
const MIN_TIMEOUT = 1000
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const isLayoutMode = (value: string): value is LayoutMode => (LAYOUT_IDS as readonly string[]).includes(value)
const isLocaleId = (value: string): value is LocaleId => (LOCALE_IDS as readonly string[]).includes(value)
const downloadJson = (payload: unknown, prefix: string) => {
  const serialized = JSON.stringify(payload, null, 2)
  const blob = new Blob([serialized], { type: 'application/json' })
  const link = document.createElement('a')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  link.href = URL.createObjectURL(blob)
  link.download = `${prefix}-${timestamp}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

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

const applyConfigData = (config: AppConfigData) => {
  const intervalValue = clamp(Math.round(config.timers.interval), MIN_INTERVAL, MAX_INTERVAL)
  interval.value = intervalValue
  syncTimers.value = config.timers.syncTimers
  if (config.timers.syncTimers) {
    timeout.value = intervalValue
  } else {
    const timeoutValue = clamp(Math.round(config.timers.timeout), MIN_TIMEOUT, MAX_INTERVAL)
    timeout.value = timeoutValue
  }

  if (isLayoutMode(config.layoutMode)) {
    layoutMode.value = config.layoutMode
  }
  if (isLocaleId(config.locale)) {
    locale.value = config.locale
    localStorage.setItem('ping-matrix-locale', config.locale)
  }
}

const handleExportConfig = () => {
  const payload = buildConfigFile({
    timers: {
      interval: interval.value,
      timeout: timeout.value,
      syncTimers: syncTimers.value
    },
    layoutMode: layoutMode.value,
    locale: locale.value
  })
  downloadJson(payload, 'ping-config')
}

const handleImportConfig = async (file: File) => {
  try {
    const text = await file.text()
    const parsed = parseConfigFile(text)
    applyConfigData(parsed.data)
    window.alert(t('data.messages.configImportSuccess'))
  } catch (error) {
    console.error('配置导入失败', error)
    const reason = error instanceof Error ? error.message : String(error)
    window.alert(t('data.messages.configImportFailed', { reason }))
  }
}

const handleExportLogs = async () => {
  try {
    const entries = await loadPersistedLogs()
    const payload = buildLogExportFile(entries)
    downloadJson(payload, 'ping-logs')
  } catch (error) {
    console.error('日志导出失败', error)
    const reason = error instanceof Error ? error.message : String(error)
    window.alert(t('data.messages.logExportFailed', { reason }))
  }
}

const handleImportLogs = async (file: File) => {
  try {
    const text = await file.text()
    const parsed = parseLogExportFile(text)
    await replaceAllLogs(parsed.entries)
    const latest = await loadPersistedLogs()
    log.value = latest
    window.alert(t('data.messages.logImportSuccess', { count: latest.length }))
  } catch (error) {
    console.error('日志导入失败', error)
    const reason = error instanceof Error ? error.message : String(error)
    window.alert(t('data.messages.logImportFailed', { reason }))
  }
}

onMounted(() => {
  start()
})
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
      @export-config="handleExportConfig"
      @import-config="handleImportConfig"
      @export-logs="handleExportLogs"
      @import-logs="handleImportLogs"
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
    <LogTable :log="log" :targets="targets" />
  </main>
</template>
