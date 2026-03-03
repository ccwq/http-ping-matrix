import { computed, onScopeDispose, ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import { useStorage } from '@vueuse/core'
import { clearInterval as workerClearInterval, setInterval as workerSetInterval } from 'worker-timers'
import { LOG_RETENTION_MS } from '@/config/logConfig'
import { appendLogEntry, loadPersistedLogs, prunePersistedLogs, replaceAllLogs } from '@/services/logStorage'

export type LogStatus = 'success' | 'timeout' | 'error'

export interface Target {
  id: string
  name: string
  url: string
  color: string
}

export interface TargetLogEntry {
  targetId: string
  targetName: string
  url: string
  status: LogStatus
  duration: number
  error?: string
}

export interface LogEntry {
  id: string
  timestamp: number
  results: TargetLogEntry[]
}

export interface SessionWindow {
  mode: 'realtime' | 'history'
  anchorTime: number | null
  spanMs: number
  budget: number
}

const DEFAULT_TARGETS: Target[] = [
  // { id: 'taobao', name: 'taobao', url: 'https://www.taobao.com/favicon.ico?1764636922369', color: '#39ff14' },
  { id: 'baidu', name: 'baidu', url: 'https://www.baidu.com/favicon.ico?1764636922421', color: '#00c8ff' },
  { id: 'wechat', name: 'wechat', url: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico?1764636922469', color: '#ff00c3' },
  // { id: 'chatgpt', name: 'chatgpt', url: 'https://chatgpt.com/favicon.ico?1764636922717', color: '#ffd500' },
  { id: 'github', name: 'github', url: 'https://github.com/favicon.ico?1764636922671', color: '#8b5cf6' },
  { id: 'youtube', name: 'youtube', url: 'https://www.youtube.com/favicon.ico?1764636922617', color: '#ff4d4f' },
  { id: 'cloudflare', name: 'cloudflare', url: 'https://www.cloudflare.com/favicon.ico?1764636922572', color: '#ff7b00' }
]

async function ping(url: string, timeout: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const startTime = performance.now()

  try {
    const uniqueUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`
    await fetch(uniqueUrl, {
      signal: controller.signal,
      cache: 'no-store',
      mode: 'no-cors'
    })
    const duration = Math.round(performance.now() - startTime)
    return {
      timestamp: Date.now(),
      url,
      status: 'success' as LogStatus,
      duration
    }
  } catch (error) {
    const duration = Math.round(performance.now() - startTime)
    if ((error as Error).name === 'AbortError') {
      return {
        timestamp: Date.now(),
        url,
        status: 'timeout' as LogStatus,
        duration: timeout,
        error: 'Timeout'
      }
    }
    return {
      timestamp: Date.now(),
      url,
      status: 'error' as LogStatus,
      duration,
      error: (error as Error).message ?? 'Unknown error'
    }
  } finally {
    clearTimeout(timer)
  }
}

export function usePingMatrix() {
  const targets = ref<Target[]>([...DEFAULT_TARGETS])
  const log = ref<LogEntry[]>([])
  const interval = useStorage<number>('ping-matrix-interval', 1000)
  const timeout = useStorage<number>('ping-matrix-timeout', 3000)
  const syncTimers = useStorage<boolean>('ping-matrix-sync-timers', false)
  const isRunning = ref(false)
  let workerTimerId: number | null = null

  const sessionWindow = useStorage<SessionWindow>('ping-matrix-session-window', {
    mode: 'realtime',
    anchorTime: null,
    spanMs: 5 * 60 * 1000, // 默认 5 分钟
    budget: 1000 // 默认 1000 个点
  })

  const RETENTION_CLEANUP_INTERVAL_MS = 5 * 60 * 1000
  let lastRetentionCleanupAt = 0

  const windowedLog = computed(() => {
    const { mode, anchorTime, spanMs } = sessionWindow.value
    const data = log.value
    if (!data.length) return []

    const latestTimestamp = data[0]?.timestamp ?? Date.now()
    const oldestTimestamp = data[data.length - 1]?.timestamp ?? latestTimestamp
    const requestedEnd = mode === 'realtime' ? latestTimestamp : (anchorTime ?? latestTimestamp)
    const end = Math.min(Math.max(requestedEnd, oldestTimestamp), latestTimestamp)
    const start = end - spanMs

    // 由于 log 是按时间倒序排列的（最新的在前）
    // 基础过滤实现，后续可根据性能需求优化为二分查找 + slice
    return data.filter((entry) => entry.timestamp >= start && entry.timestamp <= end)
  })

  const maybeScheduleRetentionCleanup = () => {
    const now = Date.now()
    if (now - lastRetentionCleanupAt < RETENTION_CLEANUP_INTERVAL_MS) return
    lastRetentionCleanupAt = now
    void prunePersistedLogs(now).catch((error: unknown) => {
      console.error('日志保留清理失败', error)
    })
  }

  const pruneLogs = () => {
    const cutoff = Date.now() - LOG_RETENTION_MS
    log.value = log.value.filter((entry) => entry.timestamp >= cutoff)
  }

  const loadLogs = async () => {
    try {
      const existing = await loadPersistedLogs()
      log.value = existing
      pruneLogs()
      maybeScheduleRetentionCleanup()
    } catch (error) {
      console.error('加载日志失败', error)
    }
  }
  void loadLogs()

  const pushLog = async (entry: LogEntry) => {
    log.value = [entry, ...log.value]
    pruneLogs()
    void appendLogEntry(entry).catch((error: unknown) => {
      console.error('日志增量写入失败', error)
    })
    maybeScheduleRetentionCleanup()
  }

  const runTick = async () => {
    if (!targets.value.length) return
    const tasks = targets.value.map(async (target) => {
      const result = await ping(target.url, timeout.value)
      return { target, result }
    })

    const settled = await Promise.allSettled(tasks)
    // 将同一轮采集的多站数据聚合成一条日志，便于表格按行展示
    const tickTimestamp = Date.now()
    const results: TargetLogEntry[] = []
    settled.forEach((item, index) => {
      const fallbackTarget = targets.value[index]
      if (item.status !== 'fulfilled') {
        if (!fallbackTarget) return
        results.push({
          targetId: fallbackTarget.id,
          targetName: fallbackTarget.name,
          url: fallbackTarget.url,
          status: 'error',
          duration: timeout.value,
          error: 'Unknown'
        })
        return
      }
      const {
        target,
        result: { url, status, duration, error }
      } = item.value
      results.push({
        targetId: target.id,
        targetName: target.name,
        url,
        status,
        duration,
        error
      })
    })
    await pushLog({
      id: nanoid(),
      timestamp: tickTimestamp,
      results
    })
  }

  const stopWorkerTimer = () => {
    if (workerTimerId !== null) {
      workerClearInterval(workerTimerId)
      workerTimerId = null
    }
  }

  const startWorkerTimer = () => {
    if (workerTimerId !== null) {
      workerClearInterval(workerTimerId)
    }
    workerTimerId = workerSetInterval(async () => {
      if (!isRunning.value) return
      await runTick()
    }, interval.value)
  }

  onScopeDispose(() => {
    stopWorkerTimer()
  })

  const start = async () => {
    if (isRunning.value) return
    isRunning.value = true
    await runTick()
    startWorkerTimer()
  }

  const stop = () => {
    if (!isRunning.value) return
    isRunning.value = false
    stopWorkerTimer()
  }

  const clearLog = async () => {
    log.value = []
    sessionWindow.value.anchorTime = null
    await replaceAllLogs([])
  }

  watch(
    [interval, syncTimers],
    ([currentInterval, sync]) => {
      if (sync) {
        timeout.value = currentInterval
      }
    },
    { immediate: true }
  )

  watch(interval, () => {
    if (isRunning.value) {
      startWorkerTimer()
    }
  })

  const latencyStats = computed(() => {
    const latest = log.value[0]
    if (!latest) return {}
    return latest.results.reduce((acc, entry) => {
      acc[entry.targetName] = entry.duration
      return acc
    }, {} as Record<string, number>)
  })

  return {
    targets,
    log,
    windowedLog,
    sessionWindow,
    interval,
    timeout,
    syncTimers,
    isRunning,
    latencyStats,
    start,
    stop,
    clearLog
  }
}
