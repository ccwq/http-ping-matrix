// 日志持久化配置接口
export interface LogPersistenceConfig {
  // 日志保留天数
  retentionDays: number
  // 数据库名称
  dbName: string
  // 存储名称
  storeName: string
  // 数据库版本
  dbVersion: number
}

// 日志持久化配置默认值
export const LOG_PERSISTENCE_CONFIG: LogPersistenceConfig = {
  retentionDays: 3,
  dbName: 'http-ping-logs',
  storeName: 'logEntries',
  dbVersion: 1
}

// 日志保留时间（毫秒）
export const LOG_RETENTION_MS = LOG_PERSISTENCE_CONFIG.retentionDays * 24 * 60 * 60 * 1000
