'use client'

import type { ReactNode } from 'react'

import { XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'

import { AdminOdaiDetailSkeleton } from './AdminOdaiDetailSkeleton'
import { useAdminOdaiSelection } from './AdminOdaiSelection'

type AdminOdaiDetailDrawerProps = {
  /** サーバーで取得した詳細。取得中は骨格に差し替える */
  children: ReactNode
}

/**
 * お題の集計をドロワーで表示する
 * 開閉を URL に持たせつつ、行を押した時点で開いて詳細の到着を待たせない
 */
export function AdminOdaiDetailDrawer({
  children,
}: AdminOdaiDetailDrawerProps) {
  const { openOdai, isDetailPending, closeOdai } = useAdminOdaiSelection()

  return (
    <Drawer
      // NOTE: 開いている間も一覧を操作できるよう、オーバーレイを出さない
      modal={false}
      open={openOdai !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeOdai()
      }}
      swipeDirection="right"
      showSwipeHandle
    >
      <DrawerContent className="w-full border-l shadow-xl sm:w-[560px]">
        <DrawerTitle className="sr-only">{openOdai?.title ?? ''}</DrawerTitle>
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
          {isDetailPending ? (
            <AdminOdaiDetailSkeleton title={openOdai?.title ?? ''} />
          ) : (
            children
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
