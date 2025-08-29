"use client"
import React from 'react'

type PixelMeterProps = {
  value: number // 0-100
  className?: string
  height?: number // px
  colorA?: string
  colorB?: string
}

// Retro pixel-style meter with striped fill
export default function PixelMeter({
  value,
  className,
  height = 10,
  colorA = '#f472b6',
  colorB = '#ec4899',
}: PixelMeterProps) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      className={[
        'relative rounded-none border border-white/25 bg-[rgba(0,0,0,0.35)]',
        'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
        className || '',
      ].join(' ')}
      style={{ height }}
    >
      <div
        className="h-full"
        style={{
          width: `${v}%`,
          imageRendering: 'pixelated',
          backgroundImage: `repeating-linear-gradient(90deg, ${colorA} 0px, ${colorA} 6px, ${colorB} 6px, ${colorB} 12px)`,
          boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      />
      {/* grid overlay for extra pixel feel */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '6px 6px, 6px 6px',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  )
}
