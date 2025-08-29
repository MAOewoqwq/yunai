"use client"
import { useEffect, useMemo, useRef, useState } from 'react'

type MessageChunk = { type: 'token' | 'done' | 'meta'; data: string }

export default function GameScene() {
  const [bgUrl, setBgUrl] = useState<string>('/uploads/bg/sample-bg.jpg')
  const [spriteUrl, setSpriteUrl] = useState<string>('/uploads/sprites/hero/neutral.png')
  const [dialogue, setDialogue] = useState<string>('你好，我是测试角色。')
  const [input, setInput] = useState<string>('')
  const [affection, setAffection] = useState<number>(0)

  const containerRef = useRef<HTMLDivElement>(null)

  const aspectPadding = useMemo(() => ({ paddingTop: `${(9 / 16) * 100}%` }), [])

  useEffect(() => {
    // 占位：未来根据情绪切换立绘
  }, [])

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
              const map: Record<string, string> = {
                happy: '/uploads/sprites/hero/happy.png',
                angry: '/uploads/sprites/hero/angry.png',
                shy: '/uploads/sprites/hero/shy.png',
                sad: '/uploads/sprites/hero/sad.png',
                neutral: '/uploads/sprites/hero/neutral.png',
              }
              setSpriteUrl(map[meta.emotion] || map['neutral'])
            }
          }
        } catch {}
      }
    }
    setInput('')
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="relative w-full overflow-hidden rounded-lg shadow-lg" style={aspectPadding} ref={containerRef}>
        {/* 背景层 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgUrl})` }}
        />

        {/* 立绘层 */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={spriteUrl}
            alt="sprite"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[70%] drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* HUD - 好感度 */}
        <div className="absolute top-3 right-3 w-40">
          <div className="text-xs mb-1 text-white/80">好感度</div>
          <div className="h-2 w-full rounded bg-white/10 overflow-hidden">
            <div className="h-full bg-pink-500" style={{ width: `${affection}%` }} />
          </div>
        </div>

        {/* 对话框 */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="rounded-xl border border-dialogue-border bg-dialogue-bg backdrop-blur px-4 py-3">
            <div className="mb-2 text-sm text-white/70">角色A</div>
            <div className="min-h-[64px] text-lg leading-relaxed text-shadow">{dialogue}</div>
            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                placeholder="输入并按回车与角色对话"
                className="flex-1 rounded bg-white/10 px-3 py-2 outline-none placeholder:text-white/40"
              />
              <button onClick={sendMessage} className="rounded bg-white/15 px-3 py-2 hover:bg-white/25">发送</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

