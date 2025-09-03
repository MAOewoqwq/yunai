"use client"
import type { ReactNode } from 'react'

type PixelItemSlotProps = {
  src?: string
  label?: string
  footer?: ReactNode
  onClick?: () => void
  className?: string
  scale?: number
  footerScale?: number
  fitToImage?: boolean
}

export default function PixelItemSlot({ src, label, footer, onClick, className, scale = 1, footerScale = 1, fitToImage = false }: PixelItemSlotProps) {
  if (fitToImage) {
    return (
      <div
        onClick={onClick}
        className={[
          'relative inline-block mx-auto rounded-none border border-white/25 bg-[rgba(18,18,26,0.65)]',
          'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-white/5 transition-colors',
          className || '',
        ].join(' ')}
        role="button"
      >
        <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {src ? (
            <img src={src} alt={label || 'item'} className="block h-auto w-auto max-w-full max-h-full object-contain [image-rendering:pixelated] pointer-events-none" />
          ) : (
            <div className="grid place-items-center text-white/40 text-xs pointer-events-none px-6 py-6">占位</div>
          )}
          {/* bottom overlay bar */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
            <div
              className="pointer-events-auto bg-[rgba(16,16,24,0.85)] border-t border-white/20 px-2 py-1 flex items-center justify-between gap-2 w-[calc(100%_-_0px)]"
              style={{ transform: `scale(${footerScale})`, transformOrigin: 'bottom center' }}
            >
              <div className="text-white/85 text-[11px] sm:text-xs break-words whitespace-normal leading-snug flex-1 min-w-0">{label}</div>
              <div onClick={(e) => e.stopPropagation()} className="shrink-0 whitespace-nowrap flex items-center gap-2">
                {footer}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div
      onClick={onClick}
      className={[
        'relative w-full aspect-square rounded-none border border-white/25 bg-[rgba(18,18,26,0.65)]',
        'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden',
        'hover:bg-white/5 transition-colors',
        className || '',
      ].join(' ')}
      role="button"
    >
      <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {src ? (
          <img src={src} alt={label || 'item'} className="absolute inset-0 w-full h-full object-contain [image-rendering:pixelated] pointer-events-none" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-white/40 text-xs pointer-events-none">占位</div>
        )}
        {/* bottom overlay bar with label and footer controls */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
          <div
            className="pointer-events-auto bg-[rgba(16,16,24,0.85)] border-t border-white/20 px-2 py-1 flex items-center justify-between gap-2 w-[calc(100%_-_0px)]"
            style={{ transform: `scale(${footerScale})`, transformOrigin: 'bottom center' }}
          >
            <div className="text-white/85 text-[11px] sm:text-xs break-words whitespace-normal leading-snug flex-1 min-w-0">{label}</div>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0 whitespace-nowrap flex items-center gap-2">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
