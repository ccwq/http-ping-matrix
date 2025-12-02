<script setup lang="ts">
const props = defineProps<{
  layoutMode: string
  options: { id: string; label: string; hint: string }[]
  isRunning: boolean
}>()

const emit = defineEmits<{
  (e: 'update:layout', value: string): void
}>()

const handleLayoutChange = (layoutId: string) => {
  emit('update:layout', layoutId)
}
</script>

<template>
  <header class="panel grid-area-header header-bar">
    <div class="header-info">
      <div>
        <p class="geek-title">PING_MATRIX v1.0.0</p>
        <p class="status-line">
          [ SYSTEM:
          <span :class="['status-flag', isRunning ? 'online' : 'offline']">
            {{ isRunning ? 'ONLINE' : 'IDLE' }}
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
      <a
        class="btn repo-link"
        href="https://github.com/"
        target="_blank"
        rel="noreferrer noopener"
      >
        [ GITHUB ]
      </a>
    </div>
    <p class="layout-hint">布局提示：{{ props.options.find((p) => p.id === layoutMode)?.hint }}</p>
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
