"use client"
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
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
  // 是否可折叠：单击音符展开为播放条，再次单击收起
  collapsible?: boolean
  // 初始是否收起（仅在 collapsible=true 时生效）
  initialCollapsed?: boolean
  // 折叠/收起按钮的自定义图标（占位用，可自行替换图片）
  iconSrc?: string
  iconAlt?: string
  // 边框/外框使用的贴图（默认使用项目中的音乐外框）
  frameSrc?: string
}

export default function PixelAudioBar({
  src,
  title,
  autoPlay = false,
  loop = false,
  initialVolume = 1,
  className,
  size = 'sm',
  collapsible = false,
  initialCollapsed = true,
  iconSrc,
  iconAlt = 'music icon',
  frameSrc,
}: PixelAudioBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [duration, setDuration] = useState<number>(0)
  const [current, setCurrent] = useState<number>(0)
  const [canPlay, setCanPlay] = useState<boolean>(false)
  const [collapsed, setCollapsed] = useState<boolean>(collapsible ? initialCollapsed : false)

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

  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el || duration <= 0) return
    // Use currentTarget to ensure we measure the bar container, not an inner child
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
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
  // 尺寸：用于包裹图像的轻量容器
  const toggleBtnSizeCls = size === 'md' ? 'w-8 h-8' : 'w-7 h-7'
  const toggleBtnOverride = ['p-0', 'relative', toggleBtnSizeCls].join(' ')
  const rotatingImgCls = isPlaying ? 'spin-slow' : ''
  const frameURL = frameSrc ?? '/uploads/avatars/music-bg_副本.PNG'
  const scaleCls = 'scale-150' // 在之前基础上放大 1.5x（即再放大 30%）

  if (collapsible && collapsed) {
    // 收起状态：仅显示原图（无方框），点击后展开
    return (
      <div className={className}>
        <button
          aria-label="展开音乐播放条"
          onClick={() => setCollapsed(false)}
          className={[toggleBtnOverride, 'bg-transparent border-0 outline-none appearance-none'].join(' ')}
        >
          {/* 背景外框图 */}
          <img src={frameURL} alt={iconAlt} className={[
            'absolute', 'inset-0', 'w-full', 'h-full', 'object-contain', 'block', 'pointer-events-none', 'transform', scaleCls
          ].join(' ')} />
          {/* 居中圆形音乐图标（使用外层包裹进行平移，内层仅负责旋转） */}
          <div className={[
            'absolute', 'left-1/2', 'top-1/2', '-translate-x-1/2', '-translate-y-1/2', 'transform',
            'w-[62%]', 'h-[62%]', 'pointer-events-none'
          ].join(' ')}>
            <img
              src={iconSrc || '/uploads/avatars/musicmina.png'}
              alt={iconAlt}
              className={[
                'w-full', 'h-full', 'rounded-full', 'object-cover', 'block', rotatingImgCls
              ].join(' ')}
            />
          </div>
        </button>
      </div>
    )
  }

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
      {collapsible && (
        <button
          className={["ml-1", toggleBtnOverride, 'bg-transparent border-0 outline-none appearance-none'].join(' ')}
          aria-label="收起音乐播放条"
          onClick={() => setCollapsed(true)}
        >
          {/* 背景外框图 */}
          <img src={frameURL} alt={iconAlt} className={[
            'absolute', 'inset-0', 'w-full', 'h-full', 'object-contain', 'block', 'pointer-events-none', 'transform', scaleCls
          ].join(' ')} />
          {/* 居中圆形音乐图标（使用外层包裹进行平移，内层仅负责旋转） */}
          <div className={[
            'absolute', 'left-1/2', 'top-1/2', '-translate-x-1/2', '-translate-y-1/2', 'transform',
            'w-[62%]', 'h-[62%]', 'pointer-events-none'
          ].join(' ')}>
            <img
              src={iconSrc || '/uploads/avatars/musicmina.png'}
              alt={iconAlt}
              className={[
                'w-full', 'h-full', 'rounded-full', 'object-cover', 'block', rotatingImgCls
              ].join(' ')}
            />
          </div>
        </button>
      )}
      {/* playback is controlled via an off-DOM HTMLAudioElement held in ref */}
    </PixelPanel>
  )
}
