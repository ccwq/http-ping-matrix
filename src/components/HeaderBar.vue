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
}>()

const { t } = useI18n()

const handleLayoutChange = (layoutId: string) => {
  emit('update:layout', layoutId)
}

const handleLocaleChange = (value: string) => {
  emit('update:locale', value)
}
</script>

<template>
  <header class="panel grid-area-header header-bar">
    <div class="header-info">
      <div>
        <p class="geek-title">{{ t('app.title') }}</p>
        <p class="status-line">
          [ {{ t('app.system') }}:
          <span :class="['status-flag', isRunning ? 'online' : 'offline']">
            {{ isRunning ? t('app.statusOnline') : t('app.statusIdle') }}
          </span>
          ]
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
      <a
        class="btn repo-link"
        href="https://github.com/"
        target="_blank"
        rel="noreferrer noopener"
      >
        [ GITHUB ]
      </a>
    </div>
    <p class="layout-hint">{{ props.options.find((p) => p.id === layoutMode)?.hint }}</p>
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
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.repo-link {
  font-size: 0.75rem;
}

.lang-switch {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
}

.lang-switch select {
  background: #05070d;
  color: var(--color-accent);
  border: 1px solid var(--color-border);
  font-family: inherit;
  padding: 0.25rem 0.5rem;
}

.layout-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-muted);
}

@media (max-width: 640px) {
  .header-info {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
