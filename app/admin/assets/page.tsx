"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import PixelPanel from '@/components/ui/PixelPanel'

type Asset = { url: string; name?: string; type: 'bg' | 'sprites' | 'avatars'; char?: string; emotion?: string }

export default function AdminAssetsPage() {
  const [bgList, setBgList] = useState<Asset[]>([])
  const [avatarList, setAvatarList] = useState<Asset[]>([])
  const [spriteList, setSpriteList] = useState<Asset[]>([])
  const [spriteChar, setSpriteChar] = useState<string>('')
  const bgInputRef = useRef<HTMLInputElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const spriteInputRef = useRef<HTMLInputElement | null>(null)

  async function refreshAll() {
    try {
      const [bg, av, sp] = await Promise.all([
        fetch('/api/assets?type=bg').then((r) => r.json()).catch(() => ({ files: [] })),
        fetch('/api/assets?type=avatars').then((r) => r.json()).catch(() => ({ files: [] })),
        fetch('/api/assets?type=sprites').then((r) => r.json()).catch(() => ({ files: [] })),
      ])
      setBgList(bg.files || [])
      setAvatarList(av.files || [])
      setSpriteList(sp.files || [])
    } catch {}
  }

  useEffect(() => {
    refreshAll()
  }, [])

  async function upload(type: 'bg' | 'avatars' | 'sprites') {
    let input: HTMLInputElement | null = null
    if (type === 'bg') input = bgInputRef.current
    else if (type === 'avatars') input = avatarInputRef.current
    else input = spriteInputRef.current
    if (!input || !input.files || input.files.length === 0) return
    const fd = new FormData()
    fd.set('type', type)
    if (type === 'sprites' && spriteChar.trim()) fd.set('char', spriteChar.trim())
    for (const f of Array.from(input.files)) fd.append('file', f)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      alert('上传失败')
      return
    }
    await refreshAll()
    input.value = ''
  }

  return (
    <main className="min-h-[100dvh] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">资源管理</h1>
        <p className="text-white/70 text-sm">支持上传到 `public/uploads/bg|avatars|sprites`。立绘可按角色 `charId` 分类至 `sprites/charId/`。</p>

        <PixelPanel className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg">背景（bg）</div>
            <div className="flex items-center gap-2">
              <input ref={bgInputRef} type="file" multiple accept="image/*" />
              <button className="px-3 py-1 border hover:bg-white/10" onClick={() => upload('bg')}>上传</button>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {bgList.map((a) => (
              <div key={a.url} className="border border-white/15 bg-white/5">
                <img src={a.url} alt={a.name || 'bg'} className="w-full h-24 object-cover" />
                <div className="text-[10px] p-1 truncate">{a.name}</div>
              </div>
            ))}
            {bgList.length === 0 && (
              <div className="col-span-full text-white/60 text-sm">暂无背景，请上传。</div>
            )}
          </div>
        </PixelPanel>

        <PixelPanel className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg">头像（avatars）</div>
            <div className="flex items-center gap-2">
              <input ref={avatarInputRef} type="file" multiple accept="image/*" />
              <button className="px-3 py-1 border hover:bg-white/10" onClick={() => upload('avatars')}>上传</button>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {avatarList.map((a) => (
              <div key={a.url} className="border border-white/15 bg-white/5">
                <img src={a.url} alt={a.name || 'avatar'} className="w-full h-16 object-cover" />
                <div className="text-[10px] p-1 truncate">{a.name}</div>
              </div>
            ))}
            {avatarList.length === 0 && (
              <div className="col-span-full text-white/60 text-sm">暂无头像，请上传。</div>
            )}
          </div>
        </PixelPanel>

        <PixelPanel className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg">立绘（sprites）</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={spriteChar}
                onChange={(e) => setSpriteChar(e.target.value)}
                placeholder="角色ID（如 mina），可留空"
                className="px-2 py-1 bg-white/10 rounded outline-none text-sm"
              />
              <input ref={spriteInputRef} type="file" multiple accept="image/*" />
              <button className="px-3 py-1 border hover:bg-white/10" onClick={() => upload('sprites')}>上传</button>
            </div>
          </div>
          <div className="text-xs text-white/60 mb-2">
            提示：若未填写角色ID，文件名应包含角色与情绪，如 <code>mina-happy.png</code>，系统将自动推断；若填写角色ID，则文件名即为情绪，如 <code>happy.png</code>。
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {spriteList.map((a) => (
              <div key={a.url} className="border border-white/15 bg-white/5">
                <img src={a.url} alt={a.name || 'sprite'} className="w-full h-28 object-contain bg-black/30" />
                <div className="text-[10px] p-1 truncate">{a.char ? `${a.char} / ${a.emotion || a.name}` : a.name}</div>
              </div>
            ))}
            {spriteList.length === 0 && (
              <div className="col-span-full text-white/60 text-sm">暂无立绘，请上传。</div>
            )}
          </div>
        </PixelPanel>
      </div>
    </main>
  )
}
