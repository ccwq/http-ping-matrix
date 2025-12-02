<script setup lang="ts">
import { computed } from 'vue'
import { useVirtualList } from '@vueuse/core'
import type { LogEntry } from '@/composables/usePingMatrix'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  log: LogEntry[]
}>()

const { t, locale } = useI18n()

const source = computed(() => props.log)
const { list, containerProps, wrapperProps } = useVirtualList(source, {
  itemHeight: 32,
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

const resolveStatus = (entry: LogEntry) => {
  if (entry.status === 'timeout') return { text: 'T/O', class: 'timeout' }
  if (entry.status === 'error') return { text: 'ERR', class: 'error' }
  if (entry.duration <= 200) return { text: 'OK', class: 'success' }
  if (entry.duration <= 800) return { text: 'WARN', class: 'warn' }
  return { text: 'DANGER', class: 'danger' }
}

const durationBadge = (entry: LogEntry) => {
  if (entry.status === 'timeout') return 'timeout'
  if (entry.status === 'error') return 'error'
  if (entry.duration <= 200) return 'success'
  if (entry.duration <= 800) return 'warn'
  return 'danger'
}
</script>

<template>
  <section class="panel grid-area-table log-panel">
    <header class="panel-title">
      <span class="geek-title">{{ t('log.title') }}</span>
      <span class="meta">{{ t('log.total', { count: log.length }) }}</span>
    </header>
    <div class="table-head">
      <span>{{ t('log.columns.time') }}</span>
      <span>{{ t('log.columns.target') }}</span>
      <span>{{ t('log.columns.status') }}</span>
      <span>{{ t('log.columns.ms') }}</span>
      <span>{{ t('log.columns.error') }}</span>
    </div>
    <div v-bind="containerProps" class="table-body">
      <div v-bind="wrapperProps">
        <div v-for="row in list" :key="row.data.id" class="log-row">
          <span>{{ formatTimestamp(row.data.timestamp) }}</span>
          <span>{{ row.data.targetName }}</span>
          <span :class="['status-cell', resolveStatus(row.data).class]">
            {{ resolveStatus(row.data).text }}
          </span>
          <span :class="['duration-cell', durationBadge(row.data)]">
            {{ row.data.duration }}ms
          </span>
          <span class="error-cell">{{ row.data.error ?? '--' }}</span>
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
  grid-template-columns: 140px 120px 90px 90px 1fr;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  align-items: center;
}

.table-head {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.35rem;
}

.log-row {
  height: 32px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
}

.table-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.status-cell {
  font-weight: 600;
}

.status-cell.success {
  color: var(--color-accent);
}
.status-cell.warn {
  color: var(--color-warn);
}
.status-cell.danger,
.status-cell.timeout,
.status-cell.error {
  color: var(--color-danger);
}

.duration-cell {
  padding-left: 0.5rem;
}

.duration-cell.success {
  color: var(--color-accent);
}
.duration-cell.warn {
  color: var(--color-warn);
}
.duration-cell.danger,
.duration-cell.timeout,
.duration-cell.error {
  color: var(--color-danger);
}

.error-cell {
  color: var(--color-muted);
  font-size: 0.75rem;
}

@media (max-width: 640px) {
  .table-head,
  .log-row {
    grid-template-columns: 130px 100px 80px 80px 1fr;
    font-size: 0.7rem;
  }
}
</style>
