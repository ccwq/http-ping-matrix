<script setup lang="ts">
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

const formatMs = (value: number) => `${value}ms`
</script>

<template>
  <section class="panel grid-area-controls controls-panel">
    <div class="controls-row">
      <button class="btn" :disabled="isRunning" @click="emit('start')">[ START ]</button>
      <button class="btn" :disabled="!isRunning" @click="emit('stop')">[ STOP ]</button>
      <button class="btn" @click="emit('clear')">[ CLEAR LOG ]</button>
    </div>

    <fieldset class="fieldset slider-fieldset">
      <legend>[ INTERVAL ]</legend>
      <label class="slider-label">
        <span>INTERVAL: {{ formatMs(interval) }}</span>
        <input
          type="range"
          :value="interval"
          min="1000"
          max="30000"
          step="500"
          @input="emit('update:interval', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
    </fieldset>

    <fieldset class="fieldset slider-fieldset">
      <legend>[ TIMEOUT ]</legend>
      <label class="slider-label">
        <span>TIMEOUT: {{ formatMs(timeout) }}</span>
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
      <label class="sync-row">
        <input
          type="checkbox"
          :checked="syncTimers"
          @change="emit('update:syncTimers', ($event.target as HTMLInputElement).checked)"
        />
        <span>[ SYNC TIMEOUT TO INTERVAL ]</span>
      </label>
    </fieldset>
  </section>
</template>

<style scoped>
.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

input[type='checkbox'] {
  width: 14px;
  height: 14px;
  background: transparent;
  border: 1px solid var(--color-border);
  accent-color: var(--color-accent);
}
</style>
