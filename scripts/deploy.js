#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pkgPath = join(process.cwd(), 'package.json')

const commands = [
  { label: 'npm run build', command: 'npm', args: ['run', 'build'] },
  {
    label: 'npm version patch',
    command: 'npm',
    args: ['version', 'patch', '--force', '-m', 'chore: deploy v%s']
  },
  { label: 'npx gh-pages', command: 'npx', args: ['gh-pages', '-d', 'dist'] },
  {
    label: 'git push master with tags',
    command: 'git',
    args: ['push', 'origin', 'master', '--follow-tags']
  }
]

function runStep(step) {
  console.log(`\n> ${step.label}`)
  const result = spawnSync(step.command, step.args, { stdio: 'inherit' })

  if (result.status !== 0) {
    const error = result.error || new Error(`${step.label} failed`)
    console.error(`\n✗ ${step.label} 失败：${error.message}`)
    process.exit(1)
  }
}

function getVersion() {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, { encoding: 'utf-8' }))
    return pkg.version
  } catch (error) {
    console.warn('无法读取 package.json 以获知版本号：', error.message)
    return null
  }
}

(async () => {
  for (const step of commands) {
    runStep(step)
    if (step.label === 'npm version patch') {
      const nextVersion = getVersion()
      if (nextVersion) {
        console.log(`✔ 版本已自动 bump 到 ${nextVersion}`)
      }
    }
  }

  console.log('\n🎉 发布流程完成，gh-pages 分支已更新。')
})()
