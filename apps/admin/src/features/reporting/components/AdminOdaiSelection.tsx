'use client'

import type { ReactNode } from 'react'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/** ドロワーで開くお題。一覧の行だけで分かる範囲を持つ */
export type AdminOpenOdai = {
  /** お題 ID */
  id: string
  /** お題のタイトル */
  title: string
}

/**
 * 遷移の完了を待たずに反映する操作
 * 押した直後の画面を決めるためだけに持ち、URL が追いついたら捨てる
 */
type AdminPendingSelection =
  | { type: 'open'; odai: AdminOpenOdai }
  | { type: 'close' }

type AdminOdaiSelectionValue = {
  /** 開いているお題。行を押した直後は URL より先に決まる */
  openOdai: AdminOpenOdai | null
  /** 開いたお題の詳細がまだ届いていないか */
  isDetailPending: boolean
  /** 行を押したときに、遷移の完了を待たずに開く */
  openOdaiOptimistically: (odai: AdminOpenOdai) => void
  /** ドロワーを閉じて一覧だけの URL に戻す */
  closeOdai: () => void
}

const AdminOdaiSelectionContext = createContext<AdminOdaiSelectionValue | null>(
  null,
)

/**
 * ドロワーの開閉状態を一覧とドロワーで共有する
 * 行のハイライトとドロワーを同じ値で動かすために必要
 *
 * @throws Provider の外で呼ばれた場合
 */
export const useAdminOdaiSelection = () => {
  const value = useContext(AdminOdaiSelectionContext)

  if (value === null) {
    throw new Error(
      'useAdminOdaiSelection must be used within an AdminOdaiSelectionProvider.',
    )
  }

  return value
}

type AdminOdaiSelectionProviderProps = {
  /** URL から確定したお題。未選択なら null */
  selectedOdai: AdminOpenOdai | null
  /** 閉じたときに戻る URL */
  closeHref: string
  children: ReactNode
}

/**
 * 一覧の行を押した時点でドロワーを開けるようにする
 * サーバーの取得を待ってから開くと待たされるため、押した内容を先に持っておき、
 * URL が追いついたらサーバーの値だけを見る
 */
export function AdminOdaiSelectionProvider({
  selectedOdai,
  closeHref,
  children,
}: AdminOdaiSelectionProviderProps) {
  const router = useRouter()
  const [pending, setPending] = useState<AdminPendingSelection | null>(null)
  const selectedOdaiId = selectedOdai?.id ?? null

  // URL が追いついたら先取りした操作は用済みになる
  useEffect(() => {
    setPending(null)
  }, [selectedOdaiId])

  const value = useMemo<AdminOdaiSelectionValue>(() => {
    const openOdai =
      pending === null
        ? selectedOdai
        : pending.type === 'close'
          ? null
          : pending.odai

    return {
      openOdai,
      isDetailPending:
        pending?.type === 'open' && pending.odai.id !== selectedOdaiId,
      openOdaiOptimistically: (odai) => setPending({ type: 'open', odai }),
      closeOdai: () => {
        setPending({ type: 'close' })
        router.push(closeHref, { scroll: false })
      },
    }
  }, [closeHref, pending, router, selectedOdai, selectedOdaiId])

  return (
    <AdminOdaiSelectionContext.Provider value={value}>
      {children}
    </AdminOdaiSelectionContext.Provider>
  )
}
