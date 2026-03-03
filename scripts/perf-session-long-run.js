/* eslint-disable no-console */
;
(() => {
  const SAMPLE_INTERVAL_MS = 1000
  const LONG_TASK_THRESHOLD_MS = 50
  const state = {
    startedAt: performance.now(),
    frameCount: 0,
    frameBuckets: [],
    longTasks: 0,
    longTaskDurationMs: 0,
    heapSamplesMb: [],
    timer: null,
    rafId: 0,
    observers: []
  }

  const percentile = (arr, p) => {
    if (!arr.length) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const index = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))))
    return sorted[index] ?? 0
  }

  let lastFrameTime = performance.now()
  const loop = (time) => {
    const delta = time - lastFrameTime
    lastFrameTime = time
    state.frameCount += 1
    if (delta > 0) {
      state.frameBuckets.push(1000 / delta)
    }
    state.rafId = requestAnimationFrame(loop)
  }

  const longTaskObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.duration >= LONG_TASK_THRESHOLD_MS) {
        state.longTasks += 1
        state.longTaskDurationMs += entry.duration
      }
    })
  })
  longTaskObserver.observe({ entryTypes: ['longtask'] })
  state.observers.push(longTaskObserver)

  state.timer = window.setInterval(() => {
    const heap = performance.memory?.usedJSHeapSize
    if (typeof heap === 'number') {
      state.heapSamplesMb.push(heap / 1024 / 1024)
    }
  }, SAMPLE_INTERVAL_MS)

  state.rafId = requestAnimationFrame(loop)

  const stop = () => {
    if (state.timer !== null) {
      clearInterval(state.timer)
      state.timer = null
    }
    cancelAnimationFrame(state.rafId)
    state.observers.forEach((observer) => observer.disconnect())
    const durationMs = Math.max(1, performance.now() - state.startedAt)
    const seconds = durationMs / 1000
    const avgFps = state.frameCount / seconds
    const fpsP50 = percentile(state.frameBuckets, 50)
    const fpsP10 = percentile(state.frameBuckets, 10)
    const heapPeakMb = state.heapSamplesMb.length ? Math.max(...state.heapSamplesMb) : 0
    const heapP95Mb = percentile(state.heapSamplesMb, 95)
    const summary = {
      capturedAt: new Date().toISOString(),
      durationMinutes: Number((seconds / 60).toFixed(2)),
      avgFps: Number(avgFps.toFixed(2)),
      fpsP50: Number(fpsP50.toFixed(2)),
      fpsP10: Number(fpsP10.toFixed(2)),
      longTasks: state.longTasks,
      longTaskDurationMs: Number(state.longTaskDurationMs.toFixed(2)),
      heapPeakMb: Number(heapPeakMb.toFixed(2)),
      heapP95Mb: Number(heapP95Mb.toFixed(2)),
      crashCount: 0
    }
    console.table(summary)
    return summary
  }

  window.__PING_PERF_SESSION__ = {
    stop,
    sampleCount: () => state.heapSamplesMb.length,
    startedAt: new Date().toISOString()
  }

  console.info('[perf] Session capture started. Run __PING_PERF_SESSION__.stop() after 20-40 minutes.')
})()
