'use client'

import type { ReactNode } from 'react'

import { XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'

type AdminOdaiDetailDrawerProps = {
  /** 開いているかどうか。URL に odaiId があるかで決まる */
  open: boolean
  /** 閉じたときに戻る URL */
  closeHref: string
  /** スクリーンリーダー向けの見出し */
  title: string
  children: ReactNode
}

/**
 * お題の集計をドロワーで表示する
 * 開閉を URL に持たせるため、閉じたときは検索条件だけの URL に戻す
 */
export function AdminOdaiDetailDrawer({
  open,
  closeHref,
  title,
  children,
}: AdminOdaiDetailDrawerProps) {
  const router = useRouter()

  return (
    <Drawer
      // NOTE: 開いている間も一覧を操作できるよう、オーバーレイを出さない
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) router.push(closeHref, { scroll: false })
      }}
      swipeDirection="right"
      showSwipeHandle
    >
      <DrawerContent className="w-full border-l shadow-xl sm:w-[560px]">
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        <DrawerDescription className="sr-only">
          選択したお題の集計と順位
        </DrawerDescription>

        <div className="flex shrink-0 justify-end px-2 pt-2">
          <DrawerClose
            render={
              <Button variant="ghost" size="icon" aria-label="閉じる">
                <XIcon />
              </Button>
            }
          />
        </div>

        <div className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
