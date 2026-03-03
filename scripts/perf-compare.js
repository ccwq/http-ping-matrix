import fs from 'node:fs'

const [beforePath, afterPath] = process.argv.slice(2)

if (!beforePath || !afterPath) {
  console.error('Usage: node scripts/perf-compare.js <before.json> <after.json>')
  process.exit(1)
}

const readJson = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

const before = readJson(beforePath)
const after = readJson(afterPath)

const compareRows = [
  ['avgFps', before.avgFps, after.avgFps, 'higher'],
  ['fpsP50', before.fpsP50, after.fpsP50, 'higher'],
  ['fpsP10', before.fpsP10, after.fpsP10, 'higher'],
  ['longTasks', before.longTasks, after.longTasks, 'lower'],
  ['longTaskDurationMs', before.longTaskDurationMs, after.longTaskDurationMs, 'lower'],
  ['heapPeakMb', before.heapPeakMb, after.heapPeakMb, 'lower'],
  ['heapP95Mb', before.heapP95Mb, after.heapP95Mb, 'lower'],
  ['crashCount', before.crashCount, after.crashCount, 'lower']
]

const formatDelta = (from, to, trend) => {
  const delta = Number((to - from).toFixed(2))
  const sign = delta > 0 ? '+' : ''
  const improved = trend === 'higher' ? delta >= 0 : delta <= 0
  return {
    before: from,
    after: to,
    delta: `${sign}${delta}`,
    result: improved ? 'improved' : 'regressed'
  }
}

const table = Object.fromEntries(compareRows.map(([key, from, to, trend]) => [key, formatDelta(from, to, trend)]))
console.table(table)
