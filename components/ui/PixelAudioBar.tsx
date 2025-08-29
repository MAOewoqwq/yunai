"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import PixelPanel from './PixelPanel'
import PixelButton from './PixelButton'
import PixelMeter from './PixelMeter'

type PixelAudioBarProps = {
  src: string
  title?: string
  autoPlay?: boolean
  loop?: boolean
  initialVolume?: number // 0..1
  className?: string
  size?: 'sm' | 'md'
}

export default function PixelAudioBar({
  src,
  title,
  autoPlay = false,
  loop = false,
  initialVolume = 1,
  className,
  size = 'sm',
}: PixelAudioBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [duration, setDuration] = useState<number>(0)
  const [current, setCurrent] = useState<number>(0)
  const [canPlay, setCanPlay] = useState<boolean>(false)

  // derived
  const pct = useMemo(() => (duration > 0 ? (current / duration) * 100 : 0), [current, duration])

  useEffect(() => {
    const el = new Audio()
    el.preload = 'metadata'
    el.src = src
    el.loop = loop
    el.volume = Math.max(0, Math.min(1, initialVolume))
    audioRef.current = el

    const onLoaded = () => {
      setDuration(el.duration || 0)
      setCanPlay(true)
      if (autoPlay) void el.play().catch(() => {})
    }
    const onTime = () => setCurrent(el.currentTime || 0)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd = () => {
      setIsPlaying(false)
      if (!loop) setCurrent(el.duration || 0)
    }

    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnd)

    return () => {
      el.pause()
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnd)
      audioRef.current = null
    }
  }, [src, loop, autoPlay, initialVolume])

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) void el.play().catch(() => {})
    else el.pause()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el || duration <= 0) return
    const rect = (e.target as HTMLDivElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const r = Math.max(0, Math.min(1, x / rect.width))
    el.currentTime = r * duration
  }

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) s = 0
    const m = Math.floor(s / 60)
    const ss = Math.floor(s % 60)
    return `${m}:${ss.toString().padStart(2, '0')}`
  }

  const padCls = size === 'md' ? 'p-2' : 'p-1.5'
  const gapCls = size === 'md' ? 'gap-3' : 'gap-2'
  const btnSize = size === 'md' ? 'md' : 'sm'
  const meterHeight = size === 'md' ? 8 : 6
  const meterSeg = size === 'md' ? 32 : 28
  const titleCls = size === 'md' ? 'text-xs mb-1' : 'text-[11px] mb-0.5'
  const timeCls = size === 'md' ? 'text-[11px]' : 'text-[10px]'

  return (
    <PixelPanel className={["flex items-center", gapCls, padCls, className || ''].join(' ')}>
      <PixelButton size={btnSize as any} variant="primary" onClick={toggle} disabled={!canPlay}>
        {isPlaying ? '❚❚' : '▶'}
      </PixelButton>
      <div className="min-w-0 flex-1">
        {title && <div className={[titleCls, 'text-white/80 truncate'].join(' ')}>{title}</div>}
        <div onClick={seek} className="cursor-pointer select-none">
          <PixelMeter value={pct} height={meterHeight} segments={meterSeg} colorA="#7dd3fc" colorB="#38bdf8" />
        </div>
        <div className={["mt-1", timeCls, 'text-white/60'].join(' ')}>
          {fmt(current)} / {fmt(duration)}
        </div>
      </div>
      {/* playback is controlled via an off-DOM HTMLAudioElement held in ref */}
    </PixelPanel>
  )
}
