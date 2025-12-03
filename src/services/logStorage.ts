import type { LogEntry } from '@/composables/usePingMatrix'
import { LOG_PERSISTENCE_CONFIG, LOG_RETENTION_MS } from '@/config/logConfig'

const { dbName, dbVersion, storeName, maxEntries } = LOG_PERSISTENCE_CONFIG

let databasePromise: Promise<IDBDatabase> | null = null

const openDatabase = () => {
  if (databasePromise) return databasePromise
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion)
    request.onerror = () => {
      reject(request.error ?? new Error('无法打开日志数据库'))
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
  return databasePromise
}

const cloneLogEntry = (entry: LogEntry): LogEntry => ({
  id: entry.id,
  timestamp: entry.timestamp,
  results: entry.results.map((result) => ({
    targetId: result.targetId,
    targetName: result.targetName,
    url: result.url,
    status: result.status,
    duration: result.duration,
    error: result.error
  }))
})

const sanitizeLogs = (logs: LogEntry[]) => logs.map((entry) => cloneLogEntry(entry))

const applyRetention = (logs: LogEntry[], now = Date.now()) => {
  const cutoff = now - LOG_RETENTION_MS
  return logs.filter((entry) => entry.timestamp >= cutoff).slice(0, maxEntries)
}

export const replaceAllLogs = async (logs: LogEntry[]) => {
  const retained = applyRetention(sanitizeLogs(logs))
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    let settled = false
    const fail = (reason: unknown) => {
      if (settled) return
      settled = true
      reject(reason instanceof Error ? reason : new Error(String(reason)))
    }
    const transaction = db.transaction(storeName, 'readwrite')
    transaction.onerror = () => {
      fail(transaction.error ?? new Error('日志写入失败'))
    }
    transaction.oncomplete = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const store = transaction.objectStore(storeName)
    const clearRequest = store.clear()
    clearRequest.onerror = () => fail(clearRequest.error ?? new Error('清空旧日志失败'))
    clearRequest.onsuccess = () => {
      retained.forEach((entry) => {
        const writeRequest = store.put(entry)
        writeRequest.onerror = () => fail(writeRequest.error ?? new Error('写入日志失败'))
      })
    }
  })
}

export const loadPersistedLogs = async (): Promise<LogEntry[]> => {
  const db = await openDatabase()
  const logs = await new Promise<LogEntry[]>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    transaction.onerror = () => reject(transaction.error ?? new Error('读取日志失败'))
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve((request.result as LogEntry[]) ?? [])
    request.onerror = () => reject(request.error ?? new Error('读取日志失败'))
  })
  const normalized = logs.sort((a, b) => b.timestamp - a.timestamp)
  const retained = applyRetention(normalized)
  if (retained.length !== normalized.length) {
    await replaceAllLogs(retained)
  }
  return retained
}
