import type { Metadata } from 'next'

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
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
