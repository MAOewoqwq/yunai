"use client"
import { useEffect, useRef, useState } from 'react'
import EngineStage from './engine/EngineStage'

type MessageChunk = { type: 'token' | 'done' | 'meta'; data: string }

export default function GameScene() {
  const [bgUrl, setBgUrl] = useState<string>('')
  const [spriteUrl, setSpriteUrl] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [dialogue, setDialogue] = useState<string>('你好，我是测试角色。')
  const [input, setInput] = useState<string>('')
  const [affection, setAffection] = useState<number>(0)

  const [sprites, setSprites] = useState<Array<{ url: string; char?: string; emotion?: string }>>([])
  const [backgrounds, setBackgrounds] = useState<Array<{ url: string; name?: string }>>([])
  const [avatars, setAvatars] = useState<Array<{ url: string; name?: string }>>([])

  const wrapperRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 1280, height: 720 })

  useEffect(() => {
    // 启动时加载本地上传的资源
    ;(async () => {
      try {
        const [bgRes, spRes, avRes] = await Promise.all([
          fetch('/api/assets?type=bg'),
          fetch('/api/assets?type=sprites'),
          fetch('/api/assets?type=avatars'),
        ])
        const bgJson = await bgRes.json()
        const spJson = await spRes.json()
        const avJson = await avRes.json()
        const bgList: Array<{ url: string; name?: string }> = bgJson.files || []
        const spList: Array<{ url: string; char?: string; emotion?: string }> = spJson.files || []
        const avList: Array<{ url: string; name?: string }> = avJson.files || []
        setBackgrounds(bgList)
        setSprites(spList)
        setAvatars(avList)

        if (!bgUrl && bgList.length) setBgUrl(bgList[0].url)
        if (!spriteUrl && spList.length) setSpriteUrl(spList[0].url)
        if (!avatarUrl && avList.length) setAvatarUrl(avList[0].url)
      } catch (e) {
        // ignore
      }
    })()

    // 计算舞台尺寸（16:9 自适应，随窗口变化）
    const updateStage = () => {
      const targetRatio = 16 / 9
      const wrap = wrapperRef.current
      const w = wrap?.clientWidth ?? window.innerWidth
      const h = wrap?.clientHeight ?? window.innerHeight
      let width = w
      let height = Math.round(width / targetRatio)
      if (height > h) {
        height = h
        width = Math.round(height * targetRatio)
      }
      setStageSize({ width, height })
    }
    updateStage()
    window.addEventListener('resize', updateStage)
    return () => window.removeEventListener('resize', updateStage)
  }, [])

  // 当立绘切换时，尝试匹配同角色的头像
  useEffect(() => {
    if (!spriteUrl || avatars.length === 0 || sprites.length === 0) return
    const current = sprites.find((s) => s.url === spriteUrl)
    const charId = current?.char
    if (!charId) return
    const found = avatars.find((a) => a.url.includes(`/avatars/${charId}`) || (a.name ?? '').toLowerCase().includes(charId.toLowerCase()))
    if (found) setAvatarUrl(found.url)
  }, [spriteUrl, avatars, sprites])

  async function sendMessage() {
    setDialogue('')
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, freechat: true }),
    })
    if (!res.ok || !res.body) return
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''
      for (const part of parts) {
        if (!part.startsWith('data:')) continue
        const payload = part.replace(/^data:\s*/, '')
        try {
          const msg: MessageChunk = JSON.parse(payload)
          if (msg.type === 'token') setDialogue((d) => d + msg.data)
          if (msg.type === 'meta') {
            // 简单示例：meta里可能包含情绪或好感度浮动
            const meta = JSON.parse(msg.data)
            if (typeof meta.affectionDelta === 'number') {
              setAffection((a) => Math.max(0, Math.min(100, a + meta.affectionDelta)))
            }
            if (meta.emotion && typeof meta.emotion === 'string') {
              const current = sprites.find((s) => s.url === spriteUrl)
              const targetEmotion = String(meta.emotion).toLowerCase()
              let candidate = sprites.find(
                (s) => s.emotion?.toLowerCase() === targetEmotion && s.char && current?.char && s.char === current.char,
              )
              if (!candidate) candidate = sprites.find((s) => s.emotion?.toLowerCase() === targetEmotion)
              if (candidate) setSpriteUrl(candidate.url)
            }
          }
        } catch {}
      }
    }
    setInput('')
  }

  return (
    <div ref={wrapperRef} className="relative w-full h-[100svh] flex items-center justify-center">
      {/* 全屏铺满的背景（随窗口缩放覆盖）*/}
      <div
        className="absolute inset-0 -z-10 bg-center bg-cover"
        style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
      />
      {/* 背景叠加一层轻微遮罩以提升文本可读性（更浅，避免看起来像黑边） */}
      <div className="absolute inset-0 -z-10 bg-black/10 sm:bg-black/20" />

      <div
        className="relative overflow-hidden"
        style={{ width: stageSize.width, height: stageSize.height }}
      >
        <EngineStage
          bgUrl={bgUrl}
          spriteUrl={spriteUrl}
          offsetPx={Math.round(stageSize.height * 0.3)}
        />

        {/* HUD - 头像与好感度 */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-3">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/10 overflow-hidden border border-white/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-white/10 to-white/5" />
            )}
          </div>
        </div>
        <div className="absolute top-2 right-2 w-28 sm:top-3 sm:right-3 sm:w-40">
          <div className="text-[11px] sm:text-xs mb-1 text-white/80">好感度</div>
          <div className="h-2 w-full rounded bg-white/10 overflow-hidden">
            <div className="h-full bg-pink-500" style={{ width: `${affection}%` }} />
          </div>
        </div>

        {/* 对话框 */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <div className="rounded-xl border border-dialogue-border bg-dialogue-bg backdrop-blur px-3 py-2 sm:px-4 sm:py-3">
            <div className="mb-1 sm:mb-2 text-xs sm:text-sm text-white/70">角色A</div>
            <div className="min-h-[56px] sm:min-h-[64px] text-base sm:text-lg leading-relaxed text-shadow">{dialogue}</div>
            <div className="mt-2 sm:mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                placeholder="输入并按回车与角色对话"
                className="flex-1 rounded bg-white/10 px-2 py-2 sm:px-3 outline-none placeholder:text-white/40 text-sm sm:text-base"
              />
              <button onClick={sendMessage} className="rounded bg-white/15 px-3 py-2 hover:bg-white/25 text-sm sm:text-base">发送</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
