import type { LogEntry, TargetLogEntry } from '@/composables/usePingMatrix'
import { LOG_RETENTION_MS } from '@/config/logConfig'

export const LOG_EXPORT_FILE_TYPE = 'http-ping-logs'
export const LOG_EXPORT_FILE_VERSION = 1

export interface LogExportFile {
  type: typeof LOG_EXPORT_FILE_TYPE
  version: typeof LOG_EXPORT_FILE_VERSION
  exportedAt: string
  retentionMs: number
  entries: LogEntry[]
}

const cloneResult = (result: TargetLogEntry): TargetLogEntry => ({
  targetId: result.targetId,
  targetName: result.targetName,
  url: result.url,
  status: result.status,
  duration: result.duration,
  error: result.error
})

const cloneEntry = (entry: LogEntry): LogEntry => ({
  id: entry.id,
  timestamp: entry.timestamp,
  results: entry.results.map((item) => cloneResult(item))
})

const sanitizeEntries = (entries: LogEntry[]) => entries.map((entry) => cloneEntry(entry))

export const buildLogExportFile = (entries: LogEntry[]): LogExportFile => ({
  type: LOG_EXPORT_FILE_TYPE,
  version: LOG_EXPORT_FILE_VERSION,
  exportedAt: new Date().toISOString(),
  retentionMs: LOG_RETENTION_MS,
  entries: sanitizeEntries(entries)
})

const isTargetLogEntry = (value: unknown): value is TargetLogEntry => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.targetId === 'string' &&
    typeof record.targetName === 'string' &&
    typeof record.url === 'string' &&
    (record.status === 'success' || record.status === 'timeout' || record.status === 'error') &&
    Number.isFinite(record.duration as number) &&
    (record.error === undefined || typeof record.error === 'string')
  )
}

const sanitizeTargetLogEntry = (value: unknown): TargetLogEntry | null => {
  if (!isTargetLogEntry(value)) return null
  return {
    targetId: value.targetId,
    targetName: value.targetName,
    url: value.url,
    status: value.status,
    duration: Math.max(0, Math.round(value.duration)),
    error: value.error
  }
}

const sanitizeLogEntry = (value: unknown): LogEntry | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || !Number.isFinite(record.timestamp as number)) return null
  if (!Array.isArray(record.results)) return null
  const sanitizedResults = record.results
    .map((result) => sanitizeTargetLogEntry(result))
    .filter((result): result is TargetLogEntry => Boolean(result))
  if (!sanitizedResults.length) return null
  return {
    id: record.id,
    timestamp: Math.round(record.timestamp as number),
    results: sanitizedResults
  }
}

const validateLogExportFile = (value: unknown): value is LogExportFile => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    record.type === LOG_EXPORT_FILE_TYPE &&
    record.version === LOG_EXPORT_FILE_VERSION &&
    typeof record.exportedAt === 'string' &&
    Number.isFinite(record.retentionMs as number) &&
    Array.isArray(record.entries)
  )
}

export const parseLogExportFile = (text: string): LogExportFile => {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new Error('日志文件不是合法的 JSON')
  }
  if (!validateLogExportFile(parsed)) {
    throw new Error('日志文件格式不受支持')
  }
  const entries = (parsed.entries as unknown[])
    .map((entry) => sanitizeLogEntry(entry))
    .filter((entry): entry is LogEntry => Boolean(entry))
    .filter((entry) => entry.timestamp >= Date.now() - LOG_RETENTION_MS)
    .sort((a, b) => b.timestamp - a.timestamp)

  return {
    type: LOG_EXPORT_FILE_TYPE,
    version: LOG_EXPORT_FILE_VERSION,
    exportedAt: parsed.exportedAt as string,
    retentionMs: LOG_RETENTION_MS,
    entries
  }
}
