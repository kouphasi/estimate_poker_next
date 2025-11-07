import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './components/Providers'

export const metadata: Metadata = {
  title: '見積もりポーカー',
  description: 'プランニングポーカー形式で工数見積もりを行うアプリケーション',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
