<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch, ref } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  option: echarts.EChartsOption
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let instance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const renderChart = () => {
  if (!instance || !props.option) return
  instance.setOption(props.option, false, false)
}

const setupResizeObserver = () => {
  if (!chartRef.value) return
  resizeObserver = new ResizeObserver(() => {
    instance?.resize()
  })
  resizeObserver.observe(chartRef.value)
}

onMounted(() => {
  if (!chartRef.value) return
  instance = echarts.init(chartRef.value)
  setupResizeObserver()
  renderChart()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  instance?.dispose()
  instance = null
})

watch(
  () => props.option,
  () => {
    renderChart()
  },
  { deep: true }
)
</script>

<template>
  <div ref="chartRef" class="echart-root"></div>
</template>

<style scoped>
.echart-root {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
