"use client"
import React from 'react'

type PixelCurrencyProps = {
  amount: number
  className?: string
}

// Small pixel coin + amount badge
export default function PixelCurrency({ amount, className }: PixelCurrencyProps) {
  const size = 2 // pixel unit
  const cols = 8
  const rows = 8
  const w = cols * size
  const h = rows * size
  const gold = '#FACC15'
  const goldDark = '#D9A71A'

  const dots: Array<[number, number, string]> = []
  // simple 8x8 round coin with a dark rim
  const fillRanges: Array<Array<[number, number]>> = [
    // y: x-range (inclusive)
    [],
    [[2, 5]],
    [[1, 6]],
    [[1, 6]],
    [[1, 6]],
    [[1, 6]],
    [[2, 5]],
    [],
  ]
  fillRanges.forEach((ranges, y) => {
    ranges.forEach(([sx, ex]) => {
      for (let x = sx; x <= ex; x++) dots.push([x, y, gold])
    })
  })
  // dark rim
  ;[[2,1],[5,1],[1,2],[6,2],[1,5],[6,5],[2,6],[5,6]].forEach(([x,y])=>dots.push([x,y,goldDark]))

  return (
    <div className={["inline-flex items-center gap-2 rounded-none border border-white/25 bg-[rgba(18,18,26,0.65)] px-2 py-1 text-xs sm:text-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]", className || ''].join(' ')}>
      <svg width={w} height={h} viewBox={`0 0 ${cols} ${rows}`} shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        {dots.map(([x, y, c], i) => (
          <rect key={i} x={x} y={y} width={1} height={1} fill={c} />
        ))}
      </svg>
      <span className="tabular-nums">{amount}</span>
    </div>
  )
}

