"use client"
import type { ButtonHTMLAttributes } from 'react'

type AssetImageButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  src: string
  label?: string
}

export default function AssetImageButton({ src, label, className, ...rest }: AssetImageButtonProps) {
  return (
    <button
      type="button"
      className={[
        'relative inline-flex items-center justify-center',
        // Frameless, fully transparent to respect PNG alpha
        'bg-transparent border-0 outline-none appearance-none overflow-visible',
        'hover:opacity-90 transition-opacity',
        'h-8 sm:h-9',
        className || '',
      ].join(' ')}
      {...rest}
    >
      <img
        src={src}
        alt={label || 'button'}
        className="block h-full w-auto object-contain [image-rendering:pixelated] pointer-events-none"
        draggable={false}
      />
    </button>
  )
}
