"use client"
import type { ReactElement } from 'react'

type PixelHeartProps = {
  size?: number // pixel size per grid unit
  color?: string
  className?: string
}

// Pixel-style heart drawn on an 8x7 grid using crisp rectangles
export default function PixelHeart({ size = 3, color = '#F7C3F4', className }: PixelHeartProps) {
  // 参考常见像素心形（对称，单尖底），使用 11x9 网格以获得居中尖端
  const cols = 11
  const rows = 9
  const width = cols * size
  const height = rows * size

  const rect = (x: number, y: number) => (
    <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />
  )

  // 单色主体填充：每行一个或两个区间（含端点），所有像素使用同一颜色
  const fillRanges: Array<Array<[number, number]>> = [
    // y=0 顶部两个半圆
    [ [2, 3], [7, 8] ],
    // y=1 两侧厚度加深
    [ [1, 4], [6, 9] ],
    // y=2 整体展开
    [ [0, 10] ],
    // y=3 稍窄
    [ [0, 10] ],
    // y=4 收束
    [ [1, 9] ],
    // y=5 继续收束
    [ [2, 8] ],
    // y=6
    [ [3, 7] ],
    // y=7
    [ [4, 6] ],
    // y=8 底尖
    [ [5, 5] ],
  ]

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: 'block' }}
    >
      {fillRanges.flatMap((ranges, y) =>
        ranges.flatMap(([sx, ex]) => {
          const els: ReactElement[] = []
          for (let x = sx; x <= ex; x++) els.push(rect(x, y))
          return els
        }),
      )}
    </svg>
  )
}
