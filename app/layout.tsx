import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Galgame Web',
  description: 'Single-player VN with AI dialogue',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

