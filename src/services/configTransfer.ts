export interface TimerSettings {
  interval: number
  timeout: number
  syncTimers: boolean
}

export interface AppConfigData {
  timers: TimerSettings
  layoutMode: string
  locale: string
}

export interface AppConfigFile {
  type: typeof CONFIG_FILE_TYPE
  version: typeof CONFIG_FILE_VERSION
  exportedAt: string
  data: AppConfigData
}

export const CONFIG_FILE_VERSION = 1 as const
export const CONFIG_FILE_TYPE = 'http-ping-config' as const

export const buildConfigFile = (data: AppConfigData): AppConfigFile => ({
  type: CONFIG_FILE_TYPE,
  version: CONFIG_FILE_VERSION,
  exportedAt: new Date().toISOString(),
  data
})

export const parseConfigFile = (text: string): AppConfigFile => {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new Error('配置文件不是合法的 JSON')
  }
  if (!isAppConfigFile(parsed)) {
    throw new Error('配置文件格式不受支持')
  }
  return parsed
}

const isAppConfigFile = (value: unknown): value is AppConfigFile => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (record.type !== CONFIG_FILE_TYPE) return false
  if (record.version !== CONFIG_FILE_VERSION) return false
  if (typeof record.exportedAt !== 'string') return false
  if (!record.data || typeof record.data !== 'object') return false
  const data = record.data as Record<string, unknown>
  if (!data.timers || typeof data.timers !== 'object') return false
  const timers = data.timers as Record<string, unknown>
  if (!Number.isFinite(timers.interval as number)) return false
  if (!Number.isFinite(timers.timeout as number)) return false
  if (typeof timers.syncTimers !== 'boolean') return false
  if (typeof data.layoutMode !== 'string') return false
  if (typeof data.locale !== 'string') return false
  return true
}
