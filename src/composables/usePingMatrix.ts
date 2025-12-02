import { computed, ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import { useIntervalFn, useStorage } from '@vueuse/core'

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

const DEFAULT_TARGETS: Target[] = [
  { id: nanoid(), name: 'taobao', url: 'https://www.taobao.com/favicon.ico?1764636922369', color: '#39ff14' },
  { id: nanoid(), name: 'baidu', url: 'https://www.baidu.com/favicon.ico?1764636922421', color: '#00c8ff' },
  { id: nanoid(), name: 'wechat', url: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico?1764636922469', color: '#ff00c3' },
  { id: nanoid(), name: 'chatgpt', url: 'https://chatgpt.com/favicon.ico?1764636922717', color: '#ffd500' },
  { id: nanoid(), name: 'github', url: 'https://github.com/favicon.ico?1764636922671', color: '#8b5cf6' },
  { id: nanoid(), name: 'youtube', url: 'https://www.youtube.com/favicon.ico?1764636922617', color: '#ff4d4f' },
  { id: nanoid(), name: 'cloudflare', url: 'https://www.cloudflare.com/favicon.ico?1764636922572', color: '#ff7b00' }
]

const LOG_LIMIT = 1000

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
  const interval = useStorage<number>('ping-matrix-interval', 5000)
  const timeout = ref(5000)
  const syncTimers = ref(true)
  const isRunning = ref(false)

  const pushLog = (entry: LogEntry) => {
    log.value.unshift(entry)
    if (log.value.length > LOG_LIMIT) {
      log.value.splice(LOG_LIMIT)
    }
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
    pushLog({
      id: nanoid(),
      timestamp: tickTimestamp,
      results
    })
  }

  const { pause, resume } = useIntervalFn(
    async () => {
      if (!isRunning.value) return
      await runTick()
    },
    interval,
    { immediate: false }
  )

  const start = async () => {
    if (isRunning.value) return
    isRunning.value = true
    await runTick()
    resume()
  }

  const stop = () => {
    if (!isRunning.value) return
    isRunning.value = false
    pause()
  }

  const clearLog = () => {
    log.value = []
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
      pause()
      resume()
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
