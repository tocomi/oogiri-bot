'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type AdminTruncatedTextProps = {
  /** 表示する文章 */
  text: string
  className?: string
}

/**
 * 1 行に収まらない文章を省略し、ホバーで全文を見せる
 * 回答は長さがまちまちで、一覧の行高を揃えたまま中身も読めるようにするために使う
 */
export function AdminTruncatedText({
  text,
  className,
}: AdminTruncatedTextProps) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className={cn('block min-w-0 truncate text-left', className)}>
              {text}
            </span>
          }
        />
        <TooltipContent className="max-w-sm text-pretty">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
