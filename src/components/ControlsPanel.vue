<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  interval: number
  timeout: number
  syncTimers: boolean
  isRunning: boolean
}>()

const emit = defineEmits<{
  (e: 'start'): void
  (e: 'stop'): void
  (e: 'clear'): void
  (e: 'update:interval', value: number): void
  (e: 'update:timeout', value: number): void
  (e: 'update:syncTimers', value: boolean): void
}>()

const { t } = useI18n()

const formatMs = (value: number) => t('controls.ms', { value })
</script>

<template>
  <section class="panel grid-area-controls controls-panel">
    <div class="controls-row">
      <button class="btn" :disabled="isRunning" @click="emit('start')">
        {{ t('controls.start') }}
      </button>
      <button class="btn" :disabled="!isRunning" @click="emit('stop')">
        {{ t('controls.stop') }}
      </button>
      <button class="btn" @click="emit('clear')">
        {{ t('controls.clear') }}
      </button>

       <label class="sync-row sync-row--at-top">
        <input
          type="checkbox"
          :checked="syncTimers"
          @change="emit('update:syncTimers', ($event.target as HTMLInputElement).checked)"
        />
        <span>{{ t('controls.sync') }}</span>
      </label>
    </div>

  
    <fieldset class="fieldset slider-fieldset">
      <legend>[ {{ t('controls.interval') }} ]</legend>
      <label class="slider-label">
        <span>{{ t('controls.interval') }}: {{ formatMs(interval) }}</span>
        <input
          type="range"
          :value="interval"
          min="500"
          max="30000"
          step="500"
          @input="emit('update:interval', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
    </fieldset>

    <fieldset class="fieldset slider-fieldset">
      <legend>[ {{ t('controls.timeout') }} ]</legend>
      <label class="slider-label">
        <span>{{ t('controls.timeout') }}: {{ formatMs(timeout) }}</span>
        <input
          type="range"
          :value="timeout"
          min="1000"
          max="30000"
          step="500"
          :disabled="syncTimers"
          @input="emit('update:timeout', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label class="sync-row sync-row--in-slider">
        <input
          type="checkbox"
          :checked="syncTimers"
          @change="emit('update:syncTimers', ($event.target as HTMLInputElement).checked)"
        />
        <span>{{ t('controls.sync') }}</span>
      </label>
    </fieldset>
  </section>
</template>

<style scoped>
.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  min-height: 0;
}

.controls-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.slider-fieldset {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}

.sync-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sync-row--at-top {
  margin-top: -0.25rem;
  display: none;
}

input[type='checkbox'] {
  width: 14px;
  height: 14px;
  background: transparent;
  border: 1px solid var(--color-border);
  accent-color: var(--color-accent);
}
</style>
