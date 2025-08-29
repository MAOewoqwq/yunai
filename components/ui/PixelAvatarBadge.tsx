"use client"
import React from 'react'
import PixelAvatarFrame from '@/components/ui/PixelAvatarFrame'

type PixelAvatarBadgeProps = {
  src?: string
  alt?: string
  name: string
  className?: string
  variant?: 'overlay' | 'wide'
  plateClassName?: string
}

// Combines a pixel avatar frame with either a bottom nameplate (overlay) or a wide right-side nameplate.
export default function PixelAvatarBadge({ src, alt = 'avatar', name, className, variant = 'wide', plateClassName }: PixelAvatarBadgeProps) {
  if (variant === 'overlay') {
    return (
      <div className={['relative', className || ''].join(' ')}>
        <PixelAvatarFrame src={src} alt={alt} className="h-full w-full" />
        {/* bottom nameplate */}
        <div className="pointer-events-none absolute left-0 right-0 bottom-0">
          <div
            className={[
              'relative px-1 py-[2px] text-center text-[10px] sm:text-xs text-white/90',
              'bg-[rgba(18,18,26,0.92)] border-t border-white/25',
              'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
            ].join(' ')}
          >
            {name}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-white/10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[3px] bg-white/10" />
          </div>
        </div>
      </div>
    )
  }
  // wide variant: avatar on left, wide nameplate on right
  return (
    <div className={['flex items-stretch gap-2', className || ''].join(' ')}>
      <div className="h-full aspect-square">
        <PixelAvatarFrame src={src} alt={alt} className="h-full w-full" />
      </div>
      <div className={["relative flex items-center min-w-[120px] sm:min-w-[168px] px-2 sm:px-3 text-[10px] sm:text-xs text-white/90 rounded-none border border-white/25 bg-[rgba(18,18,26,0.92)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]", plateClassName || '' ].join(' ')}>
        <span className="truncate max-w-[14ch] sm:max-w-[18ch]">{name}</span>
        {/* corner squares */}
        <div className="pointer-events-none absolute top-0 left-0 w-[6px] h-[6px] bg-white/20" />
        <div className="pointer-events-none absolute top-0 right-0 w-[6px] h-[6px] bg-white/20" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-[6px] h-[6px] bg-white/20" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[6px] h-[6px] bg-white/20" />
        {/* inner lines */}
        <div className="pointer-events-none absolute inset-x-1 top-0 h-px bg-white/10" />
        <div className="pointer-events-none absolute inset-x-1 bottom-0 h-px bg-black/40" />
      </div>
    </div>
  )
}
