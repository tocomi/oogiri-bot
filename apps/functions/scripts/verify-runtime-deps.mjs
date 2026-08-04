// デプロイ先(Cloud Run)と同じ条件で、実行時依存がすべて解決できるかを検証する。
//
// Firebase Functions のデプロイでは apps/functions だけが Cloud Build に送られ、
// そこで pnpm workspace のリンクを介さず npm install が走る。そのため
// 「ローカルの pnpm では動くが本番では Cannot find module で起動失敗する」
// という状態が CI の lint/type-check/test をすべてすり抜けてしまう。
// 実際に firebase-admin@13 の @firebase/database-compat が optional peer の
// @firebase/app を無条件 require していて、この経路で本番が起動不能になった。
//
// 使い方: node verify-runtime-deps.mjs <npm install 済みディレクトリ>

import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

// package.json の dependencies には現れないが、コードが直接読み込むサブパス。
// src/index.ts の import に合わせて増減させる。
const SUBPATH_ENTRIES = [
  'firebase-functions/v2',
  'firebase-functions/v2/scheduler',
]

const targetDir = path.resolve(process.argv[2] ?? process.cwd())
const manifestPath = path.join(targetDir, 'package.json')

if (!fs.existsSync(manifestPath)) {
  console.error(`package.json が見つかりません: ${manifestPath}`)
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const entries = [
  ...Object.keys(manifest.dependencies ?? {}),
  ...SUBPATH_ENTRIES,
]

// targetDir の node_modules を基準に解決させる
const require = createRequire(path.join(targetDir, 'noop.js'))

const failures = []
for (const entry of entries) {
  try {
    require(entry)
  } catch (error) {
    failures.push({ entry, message: error.message.split('\n')[0] })
  }
}

console.log(`検証対象: ${entries.length} モジュール (${targetDir})`)

if (failures.length > 0) {
  console.error('\n以下のモジュールが解決できませんでした:')
  for (const { entry, message } of failures) {
    console.error(`  ${entry} -> ${message}`)
  }
  console.error(
    '\nこのままデプロイするとコンテナが起動できず、' +
      'Cloud Run が PORT=8080 を listen できないままロールバックされます。',
  )
  process.exit(1)
}

console.log('すべての実行時依存が解決できました')
