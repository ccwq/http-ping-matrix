<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  layoutMode: string
  options: { id: string; label: string; hint: string }[]
  isRunning: boolean
  languages: { id: string; label: string }[]
  currentLocale: string
}>()

const emit = defineEmits<{
  (e: 'update:layout', value: string): void
  (e: 'update:locale', value: string): void
  (e: 'export-config'): void
  (e: 'import-config', file: File): void
  (e: 'export-logs'): void
  (e: 'import-logs', file: File): void
}>()

const { t } = useI18n()
const appVersion = __APP_VERSION__

const handleLayoutChange = (layoutId: string) => {
  emit('update:layout', layoutId)
}

const handleLocaleChange = (value: string) => {
  emit('update:locale', value)
}

const handleFileChange = (event: Event, type: 'config' | 'logs') => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    if (type === 'config') {
      emit('import-config', file)
    } else {
      emit('import-logs', file)
    }
  }
  input.value = ''
}
</script>

<template>
  <header class="panel grid-area-header header-bar">
    <div class="header-info">
      <div>
        <p class="geek-title">
          {{ t('app.title', { version: appVersion }) }}
        </p>
      </div>
      <div class="led-indicator" :class="{ online: isRunning }"></div>
    </div>
    <div class="header-actions">
      <div class="layout-switcher">
        <div
          v-for="preset in props.options"
          :key="preset.id"
          :class="['layout-pill', { active: layoutMode === preset.id }]"
          @click="handleLayoutChange(preset.id)"
        >
          {{ preset.label }}
        </div>
      </div>
      <div class="lang-switch">
        <label>{{ t('lang.label') }}</label>
        <select :value="currentLocale" @change="handleLocaleChange(($event.target as HTMLSelectElement).value)">
          <option v-for="lang in languages" :key="lang.id" :value="lang.id">
            {{ lang.label }}
          </option>
        </select>
      </div>
      <div class="data-ops">
        <div class="ops-group">
          <span class="ops-label">{{ t('data.configTitle') }}</span>
          <button class="btn btn-compact" type="button" @click="emit('export-config')">
            {{ t('data.exportConfig') }}
          </button>
          <label class="btn btn-compact file-input-btn">
            {{ t('data.importConfig') }}
            <input type="file" accept="application/json" @change="handleFileChange($event, 'config')" />
          </label>
        </div>
        <div class="ops-group">
          <span class="ops-label">{{ t('data.logTitle') }}</span>
          <button class="btn btn-compact" type="button" @click="emit('export-logs')">
            {{ t('data.exportLogs') }}
          </button>
          <label class="btn btn-compact file-input-btn">
            {{ t('data.importLogs') }}
            <input type="file" accept="application/json" @change="handleFileChange($event, 'logs')" />
          </label>
        </div>
      </div>
      <a
        class="btn repo-link"
        href="https://github.com/ccwq/http-ping-matrix"
        target="_blank"
        rel="noreferrer noopener"
      >
        {{ t('app.viewOnGithub') }}
      </a>
    </div>
    <!-- <p class="layout-hint">{{ props.options.find((p) => p.id === layoutMode)?.hint }}</p> -->
  </header>
</template>

<style scoped>
.header-bar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.65rem;
  height: 100%;
  min-height: 0;
}

.header-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.status-line {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
}

.status-flag {
  color: var(--color-danger);
}

.status-flag.online {
  color: var(--color-accent);
}

.led-indicator {
  width: 14px;
  height: 14px;
  border: 1px solid var(--color-border);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
  background: transparent;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.led-indicator.online {
  background: var(--color-accent);
  box-shadow: 0 0 16px rgba(57, 255, 20, 0.8);
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  --header-control-height: 32px;
}

.repo-link {
  font-size: 0.75rem;
}

.lang-switch {
  display: flex;
  margin-left: auto;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
}

.lang-switch select {
  background: #05070d;
  color: var(--color-accent);
  border: 1px solid var(--color-border);
  font-family: inherit;
  padding: 0 0.5rem;
  min-height: var(--header-control-height);
  display: inline-flex;
  align-items: center;
}

.layout-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-muted);
}

.header-actions .btn {
  min-height: var(--header-control-height);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0 0.75rem;
}

.data-ops {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.ops-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.ops-label {
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  color: var(--color-muted);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  min-height: var(--header-control-height);
}

.btn-compact {
  font-size: 0.65rem;
  padding: 0 0.6rem;
}

.file-input-btn {
  position: relative;
  overflow: hidden;
}

.file-input-btn input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

@media (max-width: 640px) {
  .header-info {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .data-ops {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
