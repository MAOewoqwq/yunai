"use client"
import React from 'react'

type PixelAvatarFrameProps = {
  src?: string
  alt?: string
  className?: string
}

// A simple pixel-style avatar frame with hard borders and corner bits.
export default function PixelAvatarFrame({ src, alt = 'avatar', className }: PixelAvatarFrameProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-none',
        // base sizing comes from parent via className
        // subtle panel background to match HUD
        'bg-[rgba(18,18,26,0.85)] border border-white/25 backdrop-blur',
        className || '',
      ].join(' ')}
      style={{ imageRendering: 'pixelated' as any }}
    >
      {/* inner frame */}
      <div
        className="pointer-events-none absolute"
        style={{ inset: 2, border: '1px solid rgba(255,255,255,0.25)' }}
      />

      {/* content */}
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-white/10 to-white/5" />
      )}
    </div>
  )
}
