import type { AdminUserStats } from '@/features/users/api/adminUsers'

/** 匿名モードを URL で有効にするときの値 */
export const ADMIN_USER_ANONYMOUS_VALUE = '1'

/** 匿名モードで割り当てる動物名。十分な人数でも同じ画面内で名前が重ならないようにする */
const ADMIN_ANONYMOUS_ANIMALS = [
  'ゾウ',
  'ネコ',
  'タスマニアデビル',
  'カピバラ',
  'ペンギン',
  'ナマケモノ',
  'アルパカ',
  'ハシビロコウ',
  'カワウソ',
  'アリクイ',
  'ラッコ',
  'フクロウ',
  'カメレオン',
  'レッサーパンダ',
  'マヌルネコ',
  'オカピ',
  'キツネ',
  'タヌキ',
  'ヤマネ',
  'ハリネズミ',
  'カモノハシ',
  'イッカク',
  'ミーアキャット',
  'ワニ',
  'サイ',
  'キリン',
  'ゴリラ',
  'パンダ',
  'コアラ',
  'リス',
  'シマエナガ',
  'スナネコ',
  'フェネック',
  'ビーバー',
  'モルモット',
  'ウーパールーパー',
  'カブトムシ',
  'ダンゴムシ',
  'ナマズ',
  'ウミガメ',
  'イルカ',
  'マンボウ',
  'クラゲ',
  'エミュー',
  'ダチョウ',
  'カラス',
  'スズメ',
  'ツバメ',
  'ヒツジ',
  'ヤギ',
  'ロバ',
  'ラクダ',
  'イヌ',
  'ウサギ',
  'ブタ',
  'ウマ',
  'シカ',
  'イノシシ',
  'サル',
  'クマ',
  'オオカミ',
  'ペリカン',
  'アザラシ',
  'トナカイ',
  'ムササビ',
  'モモンガ',
] as const

/**
 * 配列の要素をランダムに並べ替える
 * 匿名ラベルの順番を毎回変え、元の回答数順から個人を推測しにくくする
 */
const shuffleAdminAnonymousAnimals = () => {
  const shuffled = [...ADMIN_ANONYMOUS_ANIMALS]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ]
  }

  return shuffled
}

/**
 * ユーザー分析の URL パラメータを匿名モードとして解釈する
 * 不正な値では通常表示に戻し、意図せず匿名状態になるのを避ける
 */
export const parseAdminUserAnonymous = (value: string | null) =>
  value === ADMIN_USER_ANONYMOUS_VALUE

/**
 * 個人名を画面に出さないため、分析内で使う表示名だけを匿名ラベルへ置き換える
 * 画面内のすべての表示で同じ対応を保ちながら、ラベル自体は毎回ランダムにする
 */
export const anonymizeAdminUserStats = (
  stats: AdminUserStats,
): AdminUserStats => {
  const animals = shuffleAdminAnonymousAnimals()

  return {
    ...stats,
    items: stats.items.map((item, index) => ({
      ...item,
      name: `${animals[index % animals.length]}さん`,
    })),
  }
}

/**
 * ユーザー分析の画面内リンクを組み立てる
 * 匿名モードの切り替えや並び替えで、期間と現在の表示状態を失わないために使う
 */
export const createAdminUserHref = ({
  anonymous,
  period,
  sort,
}: {
  /** 匿名モードを有効にするか */
  anonymous: boolean
  /** 期間の URL パラメータ */
  period: string
  /** 一覧の並び */
  sort: string
}) => {
  const params = new URLSearchParams({ period, sort })
  if (anonymous) {
    params.set('anonymous', ADMIN_USER_ANONYMOUS_VALUE)
  }
  return `/users?${params.toString()}`
}
