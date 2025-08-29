"use client"
import React, { useMemo } from 'react'

type PixelMeterProps = {
  value: number // 0-100
  className?: string
  height?: number // px
  colorA?: string
  colorB?: string
  segments?: number // number of pixel cells
}

// Pixel-style segmented meter composed of crisp grid cells
export default function PixelMeter({
  value,
  className,
  height = 10,
  colorA = '#f472b6',
  colorB = '#ec4899',
  segments = 24,
}: PixelMeterProps) {
  const v = Math.max(0, Math.min(100, value))
  const seg = Math.max(1, Math.floor(segments))
  const filled = Math.round((v / 100) * seg)

  const cells = useMemo(() => Array.from({ length: seg }, (_, i) => i < filled), [seg, filled])

  return (
    <div
      className={[
        'relative rounded-none border border-white/25 bg-[rgba(0,0,0,0.35)]',
        'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
        className || '',
      ].join(' ')}
      style={{ height }}
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      role="meter"
    >
      <div
        className="grid w-full h-full p-[1px]"
        style={{
          gridTemplateColumns: `repeat(${seg}, minmax(0, 1fr))`,
          gap: '1px',
        }}
      >
        {cells.map((isFilled, i) => (
          <div
            key={i}
            className="h-full"
            style={
              isFilled
                ? {
                    imageRendering: 'pixelated',
                    backgroundImage: `repeating-linear-gradient(90deg, ${colorA} 0px, ${colorA} 6px, ${colorB} 6px, ${colorB} 12px)`,
                    boxShadow:
                      'inset 0 -1px 0 rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
                  }
                : {
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    boxShadow:
                      'inset 0 -1px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }
            }
          />
        ))}
      </div>

      {/* subtle outer pixel-grid sheen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '6px 6px, 6px 6px',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  )
}
