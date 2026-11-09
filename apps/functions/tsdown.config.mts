import { defineConfig } from 'tsdown'

// NOTE: 分割無効時は複数入力を指定できないため、エントリごとにビルドする
export default defineConfig(
  ['src/index.ts', 'src/dev.ts'].map((entry) => ({
    entry,
    outDir: 'lib',
    format: 'cjs',
    platform: 'node',
    target: 'node22',
    fixedExtension: false,
    dts: false,
    minify: false,
    sourcemap: true,
    clean: true,
    // NOTE: コールドスタートの内訳を測るため、バンドルの先頭で評価開始時刻を記録する
    // ソースの import は external の require としてバンドル先頭に移るので、ソース側では最初に記録できない
    banner:
      entry === 'src/index.ts'
        ? 'console.log(`[startup] code eval started: ${process.uptime().toFixed(3)}s`)'
        : undefined,
    // NOTE: 各エントリを依存込みの単一ファイルにし、共有チャンクを作らない
    outputOptions: { codeSplitting: false },
    deps: {
      // NOTE: dependencies を external にする既定を外し、依存もバンドルする
      alwaysBundle: /./,
      onlyBundle: false,
      neverBundle: [
        // NOTE: Firebase CLI の関数検出ローダーと同じコピーを使うため除外する
        /^firebase-(functions|admin)(\/.*)?$/,
        // NOTE: pg / ws が任意で require するネイティブ拡張はバンドルできない
        'pg-native',
        'bufferutil',
        'utf-8-validate',
      ],
    },
  })),
)
