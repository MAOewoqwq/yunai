"use client"
import type { ButtonHTMLAttributes } from 'react'

type PixelButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary'
  size?: 'sm' | 'md'
}

export default function PixelButton({ variant = 'default', size = 'sm', className, disabled, children, ...rest }: PixelButtonProps) {
  const base = [
    'rounded-none border transition-colors select-none',
    'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10',
  ]
  const tone = variant === 'primary'
    ? 'border-white/30 bg-[rgba(255,255,255,0.12)]'
    : 'border-white/25 bg-[rgba(18,18,26,0.65)]'
  const pad = size === 'md' ? 'px-3 py-2 text-sm' : 'px-2 py-1 text-xs sm:text-sm'
  return (
    <button className={[...base, tone, pad, className || ''].join(' ')} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
