export interface LogPersistenceConfig {
  retentionDays: number
  maxEntries: number
  dbName: string
  storeName: string
  dbVersion: number
}

export const LOG_PERSISTENCE_CONFIG: LogPersistenceConfig = {
  retentionDays: 3,
  maxEntries: 500,
  dbName: 'http-ping-logs',
  storeName: 'logEntries',
  dbVersion: 1
}

export const LOG_RETENTION_MS = LOG_PERSISTENCE_CONFIG.retentionDays * 24 * 60 * 60 * 1000

