<script setup lang="ts">
import { computed } from 'vue'
import { useVirtualList } from '@vueuse/core'
import type { LogEntry, Target, TargetLogEntry } from '@/composables/usePingMatrix'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  log: LogEntry[]
  targets: Target[]
}>()

type LogRowWithCache = LogEntry & {
  resultMap: Record<string, TargetLogEntry>
}

const { t, locale } = useI18n()
const gridTemplateColumns = computed(() => {
  const targetCount = Math.max(props.targets.length, 1)
  return `140px repeat(${targetCount}, minmax(110px, 1fr))`
})

const source = computed<LogRowWithCache[]>(() =>
  props.log.map((entry) => ({
    ...entry,
    // 预先缓存站点 -> 结果的映射，避免模板内重复查找
    resultMap: entry.results.reduce((acc, item) => {
      acc[item.targetId] = item
      return acc
    }, {} as Record<string, TargetLogEntry>)
  }))
)
const { list, containerProps, wrapperProps } = useVirtualList(source, {
  itemHeight: 36,
  overscan: 6
})

const timeFormatter = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
)

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  const time = timeFormatter.value.format(date)
  const ms = `${date.getMilliseconds()}`.padStart(3, '0')
  return `${time}.${ms}`
}

const resolveStatus = (entry?: TargetLogEntry) => {
  if (!entry) return { text: '--', class: 'muted' }
  if (entry.status === 'timeout') return { text: 'T/O', class: 'timeout' }
  if (entry.status === 'error') return { text: 'ERR', class: 'error' }
  if (entry.duration <= 200) return { text: 'OK', class: 'success' }
  if (entry.duration <= 800) return { text: 'WARN', class: 'warn' }
  return { text: 'DANGER', class: 'danger' }
}

const durationBadge = (entry?: TargetLogEntry) => {
  if (!entry) return 'muted'
  if (entry.status === 'timeout') return 'timeout'
  if (entry.status === 'error') return 'error'
  if (entry.duration <= 200) return 'success'
  if (entry.duration <= 800) return 'warn'
  return 'danger'
}

const formatCell = (entry?: TargetLogEntry) => {
  if (!entry) return '--'
  return `${entry.duration}ms ${resolveStatus(entry).text}`
}

const getResultForTarget = (row: LogRowWithCache, targetId: string) => row.resultMap[targetId]
</script>

<template>
  <section class="panel grid-area-table log-panel">
    <header class="panel-title">
      <span class="geek-title">{{ t('log.title') }}</span>
      <span class="meta">{{ t('log.total', { count: log.length }) }}</span>
    </header>
    <div class="table-head" :style="{ gridTemplateColumns }">
      <span>{{ t('log.columns.time') }}</span>
      <span v-for="target in targets" :key="target.id">
        {{ target.name }}
      </span>
    </div>
    <div v-bind="containerProps" class="table-body">
      <div v-bind="wrapperProps">
        <div
          v-for="row in list"
          :key="row.data.id"
          class="log-row"
          :style="{ gridTemplateColumns }"
        >
          <span class="timestamp-cell">{{ formatTimestamp(row.data.timestamp) }}</span>
          <span
            v-for="target in targets"
            :key="target.id"
            :class="['target-cell', durationBadge(getResultForTarget(row.data, target.id))]"
            :title="getResultForTarget(row.data, target.id)?.error ?? ''"
          >
            {{ formatCell(getResultForTarget(row.data, target.id)) }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.log-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

.table-head,
.log-row {
  display: grid;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
  align-items: center;
  column-gap: 0.5rem;
}

.table-head {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.35rem;
}

.log-row {
  height: 36px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
}

.table-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.timestamp-cell {
  font-weight: 600;
}

.target-cell {
  font-family: 'Fira Code', monospace;
  font-size: 0.75rem;
  white-space: nowrap;
}

.target-cell.success {
  color: var(--color-accent);
}
.target-cell.warn {
  color: var(--color-warn);
}
.target-cell.danger,
.target-cell.timeout,
.target-cell.error {
  color: var(--color-danger);
}
.target-cell.muted {
  color: var(--color-muted);
}

@media (max-width: 640px) {
  .table-head,
  .log-row {
    font-size: 0.68rem;
  }
}
</style>
