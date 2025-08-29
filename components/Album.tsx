"use client"
import { useEffect, useMemo, useState, useCallback } from 'react'
import PixelPanel from './ui/PixelPanel'
import PixelButton from './ui/PixelButton'

type Photo = { url: string; name?: string; type?: string }

type Props = {
  onClose: () => void
}

export default function Album({ onClose }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/assets?type=photos', { cache: 'no-store' })
        const j = await r.json().catch(() => ({ files: [] }))
        if (mounted) setPhotos(Array.isArray(j.files) ? j.files : [])
      } catch {
        if (mounted) setPhotos([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!loading && photos.length > 0) setSelected(0)
  }, [loading, photos.length])

  const canPrev = useMemo(() => selected > 0 && photos.length > 0, [selected, photos.length])
  const canNext = useMemo(() => selected < photos.length - 1 && photos.length > 0, [selected, photos.length])
  const cleanName = useCallback((n?: string) => {
    if (!n) return ''
    return n.replace(/\.(png|jpe?g|webp|gif)$/i, '')
  }, [])

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <PixelPanel className="relative z-10 w-[94%] max-w-[980px] p-3 sm:p-4 [image-rendering:pixelated]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg">相册</div>
          <button className="px-3 py-1 text-sm border hover:bg-white/10" onClick={onClose}>关闭</button>
        </div>

        {/* 预览区 */}
        {loading ? (
          <div className="mb-4">
            <div className="w-full aspect-video bg-white/10 animate-pulse" />
          </div>
        ) : photos.length === 0 ? (
          <div className="mb-4">
            <div className="w-full aspect-video border-2 border-dashed border-white/20 bg-black/20 flex items-center justify-center text-white/60">
              暂无照片预览
            </div>
          </div>
        ) : (
          <div className="mb-4 relative">
            <img
              src={photos[selected]?.url}
              alt={cleanName(photos[selected]?.name) || 'photo'}
              className="w-full max-h-[60vh] object-contain bg-black/30"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-2 bg-gradient-to-t from-black/50 to-transparent">
              <div className="text-xs sm:text-sm truncate pr-2">{cleanName(photos[selected]?.name) || '未命名'}</div>
              <div className="flex items-center gap-2">
                <PixelButton size="sm" disabled={!canPrev} onClick={() => canPrev && setSelected((i) => Math.max(0, i - 1))}>
                  上一张
                </PixelButton>
                <PixelButton size="sm" disabled={!canNext} onClick={() => canNext && setSelected((i) => Math.min(photos.length - 1, i + 1))}>
                  下一张
                </PixelButton>
              </div>
            </div>
          </div>
        )}

        {/* 缩略图网格 / 占位 */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div>
            <div className="text-white/60 text-sm mb-2">
              暂无照片。请将图片放入 `public/uploads/photos/`，或在管理页上传。
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-2 border-dashed border-white/20 bg-black/20 h-24 flex items-center justify-center text-[10px] text-white/40">
                  示例照片 {String(i + 1).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {photos.map((p, idx) => (
              <button
                key={p.url}
                className={[
                  'text-left border bg-white/5 focus:outline-none',
                  idx === selected ? 'border-white/60' : 'border-white/15 hover:border-white/30',
                ].join(' ')}
                onClick={() => setSelected(idx)}
              >
                <img src={p.url} alt={cleanName(p.name) || 'photo'} className="w-full h-24 object-cover" />
                <div className="text-[10px] p-1 truncate" title={cleanName(p.name) || ''}>{cleanName(p.name)}</div>
              </button>
            ))}
          </div>
        )}
      </PixelPanel>
    </div>
  )
}
