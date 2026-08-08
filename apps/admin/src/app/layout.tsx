import type { Metadata } from 'next'

import './globals.css'
import { Geist } from 'next/font/google'

import { cn } from '@/lib/utils'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Oogiri Bot Admin',
  description: 'Admin console for Oogiri Bot',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={cn('font-sans', geist.variable)}>
      <body>{children}</body>
    </html>
  )
}
