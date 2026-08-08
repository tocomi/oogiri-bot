import '../app/globals.css'

// NOTE: next/link はブラウザでも process.env を参照するため、テスト環境に最小限の shim を置く
if (typeof globalThis.process === 'undefined') {
  Object.defineProperty(globalThis, 'process', {
    configurable: true,
    value: { env: {} },
    writable: true,
  })
}
