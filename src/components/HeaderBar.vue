<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import IconLayoutGrid from '~icons/mdi/view-grid'
import IconLayoutColumns from '~icons/mdi/view-column'
import IconLayoutWide from '~icons/mdi/view-parallel'
import IconLayoutSplit from '~icons/mdi/view-split-vertical'
import IconTranslate from '~icons/mdi/translate'
import IconDownload from '~icons/mdi/download'
import IconUpload from '~icons/mdi/upload'
import IconGithub from '~icons/mdi/github'
import IconCog from '~icons/mdi/cog'
import IconHistory from '~icons/mdi/history'

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
const fileInputConfig = ref<HTMLInputElement | null>(null)
const fileInputLogs = ref<HTMLInputElement | null>(null)
const langSelect = ref<HTMLSelectElement | null>(null)

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

const focusLangSelect = () => {
  langSelect.value?.focus()
}

const triggerConfigUpload = () => {
  fileInputConfig.value?.click()
}

const triggerLogUpload = () => {
  fileInputLogs.value?.click()
}

const layoutIcons: Record<string, typeof IconLayoutGrid> = {
  a: IconLayoutGrid,
  b: IconLayoutColumns,
  c: IconLayoutWide,
  d: IconLayoutSplit
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
        <button
          v-for="preset in props.options"
          :key="preset.id"
          type="button"
          :class="['icon-btn', 'layout-pill', { active: layoutMode === preset.id }]"
          :title="preset.hint"
          @click="handleLayoutChange(preset.id)"
        >
          <component :is="layoutIcons[preset.id]" class="icon" aria-hidden="true" />
        </button>
      </div>
      <div style="margin-left: auto;" > </div>
      <button class="icon-btn ghost" type="button" :title="t('lang.label')" @click="focusLangSelect">
        <IconTranslate class="icon" aria-hidden="true" />
      </button>
      <select
        ref="langSelect"
        class="lang-select"
        :value="currentLocale"
        @change="handleLocaleChange(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="lang in languages" :key="lang.id" :value="lang.id">
          {{ lang.label }}
        </option>
      </select>
      <div class="data-ops">
        <div class="ops-group" aria-label="Config operations">
          <IconCog class="icon muted" aria-hidden="true" />
          <button class="icon-btn ghost" type="button" :title="t('data.exportConfig')" @click="emit('export-config')">
            <IconDownload class="icon" aria-hidden="true" />
          </button>
          <button class="icon-btn ghost" type="button" :title="t('data.importConfig')" @click="triggerConfigUpload">
            <IconUpload class="icon" aria-hidden="true" />
          </button>
          <input
            ref="fileInputConfig"
            type="file"
            class="sr-only"
            accept="application/json"
            @change="handleFileChange($event, 'config')"
          />
        </div>
        <div class="ops-group" aria-label="Log operations">
          <IconHistory class="icon muted" aria-hidden="true" />
          <button class="icon-btn ghost" type="button" :title="t('data.exportLogs')" @click="emit('export-logs')">
            <IconDownload class="icon" aria-hidden="true" />
          </button>
          <button class="icon-btn ghost" type="button" :title="t('data.importLogs')" @click="triggerLogUpload">
            <IconUpload class="icon" aria-hidden="true" />
          </button>
          <input
            ref="fileInputLogs"
            type="file"
            class="sr-only"
            accept="application/json"
            @change="handleFileChange($event, 'logs')"
          />
        </div>
      </div>
      <a
        class="icon-btn ghost"
        href="https://github.com/ccwq/http-ping-matrix"
        target="_blank"
        rel="noreferrer noopener"
        :title="t('app.viewOnGithub')"
      >
        <IconGithub class="icon" aria-hidden="true" />
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
  gap: 0.5rem;
  align-items: center;
  --header-control-height: 36px;
}

.lang-select {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-accent);
  min-height: var(--header-control-height);
  padding: 0 0.5rem;
}

.data-ops {
  display: flex;
  gap: 0.3rem;
  align-items: center;
}

.ops-group {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0.3rem;
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
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
