"use client"
import { PropsWithChildren } from 'react'

type PixelPanelProps = PropsWithChildren<{
  className?: string
}>

export default function PixelPanel({ className, children }: PixelPanelProps) {
  return (
    <div
      className={
        [
          // Pixel-style panel: hard edges, 1px border, subtle inner shadow
          'rounded-none border border-white/25 bg-[rgba(18,18,26,0.85)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
          'backdrop-blur',
          className || '',
        ].join(' ')
      }
    >
      {children}
    </div>
  )
}

