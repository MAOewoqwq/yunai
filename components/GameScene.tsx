"use client"
import { useEffect, useRef, useState } from 'react'
import EngineStage from './engine/EngineStage'
import InventoryShop, { type Item } from './InventoryShop'
import { inferEmotion } from '@/lib/emotion'
import { DEFAULT_OPENING_LINES } from '@/lib/prompt'

type MessageChunk = { type: 'token' | 'done' | 'meta'; data: string }

export default function GameScene() {
  const [bgUrl, setBgUrl] = useState<string>('')
  const [spriteUrl, setSpriteUrl] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [dialogue, setDialogue] = useState<string>('')
  const dialogueRef = useRef<string>('')
  useEffect(() => { dialogueRef.current = dialogue }, [dialogue])
  const [input, setInput] = useState<string>('')
  const [affection, setAffection] = useState<number>(0)
  const [coins, setCoins] = useState<number>(100)
  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [shopOpen, setShopOpen] = useState<boolean>(false)

  const [sprites, setSprites] = useState<Array<{ url: string; char?: string; emotion?: string }>>([])
  const [backgrounds, setBackgrounds] = useState<Array<{ url: string; name?: string }>>([])
  const [avatars, setAvatars] = useState<Array<{ url: string; name?: string }>>([])

  const wrapperRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 1280, height: 720 })

  // 名字展示已固定为：東嘉弥真 御奈

  // 本地持久化：金币、背包、好感度
  useEffect(() => {
    try {
      const s = window.localStorage.getItem('game_state')
      if (s) {
        const j = JSON.parse(s)
        if (typeof j.coins === 'number') setCoins(j.coins)
        if (j.inventory && typeof j.inventory === 'object') setInventory(j.inventory)
        if (typeof j.affection === 'number') setAffection(j.affection)
      }
    } catch {}
  }, [])
  useEffect(() => {
    try {
      const payload = JSON.stringify({ coins, inventory, affection })
      window.localStorage.setItem('game_state', payload)
    } catch {}
  }, [coins, inventory, affection])

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
        let avatarSet = false
        if (!spriteUrl && spList.length) {
          const preferred = spList.find((s) => (s.emotion || '').toLowerCase() === 'normal') || spList[0]
          setSpriteUrl(preferred.url)
          if (preferred.char) {
            const charId = preferred.char
            const matchedAvatar = avList.find(
              (a) => a.url.includes(`/avatars/${charId}`) || (a.name ?? '').toLowerCase().includes(charId.toLowerCase()),
            )
            if (matchedAvatar) {
              setAvatarUrl(matchedAvatar.url)
              avatarSet = true
            }
          }
        }
        if (!avatarUrl && avList.length && !avatarSet) setAvatarUrl(avList[0].url)
      } catch (e) {
        // ignore
      }
    })()

    // 初始化开场台词：优先从 /opening-lines.json 读取，否则回退到默认常量
    ;(async () => {
      try {
        let lines: string[] = []
        try {
          const r = await fetch('/opening-lines.json', { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            if (Array.isArray(j)) lines = j
            else if (Array.isArray(j?.lines)) lines = j.lines
          }
        } catch {}
        if (!lines?.length) lines = DEFAULT_OPENING_LINES
        // 只展示 1 句随机开场白
        const idx = Math.floor(Math.random() * lines.length)
        const initialText = lines[idx] || ''
        setDialogue(initialText)
        dialogueRef.current = initialText
      } catch {}
    })()

    // 计算舞台尺寸（改为占满父容器 / 全屏）
    const updateStage = () => {
      const wrap = wrapperRef.current
      const w = wrap?.clientWidth ?? window.innerWidth
      const h = wrap?.clientHeight ?? window.innerHeight
      setStageSize({ width: w, height: h })
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
    const userText = input.trim()
    if (!userText) return
    // 清空输入框（立即），并以打字机动画显示玩家输入
    setInput('')
    const header = `你：${userText}\n`
    setDialogue('')
    dialogueRef.current = ''
    // 简单打字动画（仅用于玩家输入，长度有限，性能可接受）
    for (const ch of header) {
      await new Promise((r) => setTimeout(r, 12))
      setDialogue((d) => {
        const next = d + ch
        dialogueRef.current = next
        return next
      })
    }
    // 简单关键词推断情绪并尝试切换立绘
    try {
      const hint = inferEmotion(input, affection)
      if (hint && sprites.length > 0) {
        const cur = sprites.find((s) => s.url === spriteUrl)
        let candidate = sprites.find(
          (s) => s.emotion?.toLowerCase() === hint && s.char && cur?.char && s.char === cur.char,
        )
        if (!candidate) candidate = sprites.find((s) => s.emotion?.toLowerCase() === hint)
        if (candidate) setSpriteUrl(candidate.url)
      }
    } catch {}
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText, freechat: true }),
    })
    if (!res.ok || !res.body) return
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    // Smooth streaming: coalesce micro-chunks to reduce re-renders
    const pendingRef = { text: '' }
    let raf = 0 as any
    let assistantCleared = false
    const flush = () => {
      if (!pendingRef.text) return
      const chunk = pendingRef.text
      pendingRef.text = ''
      setDialogue((d) => {
        const next = d + chunk
        dialogueRef.current = next
        return next
      })
      raf = 0
    }
    const enqueue = (t: string) => {
      if (!t) return
      // 第一次收到 AI token 时，清空对话框以移除玩家输入
      if (!assistantCleared) {
        pendingRef.text = ''
        setDialogue('')
        dialogueRef.current = ''
        assistantCleared = true
      }
      pendingRef.text += t
      if (!raf) raf = requestAnimationFrame(flush)
    }
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
          if (msg.type === 'token') enqueue(msg.data)
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
    // final flush
    if (pendingRef.text) {
      setDialogue((d) => {
        const next = d + pendingRef.text
        dialogueRef.current = next
        return next
      })
      pendingRef.text = ''
    }
    // 输入已在发送时清空，这里无需重复
  }

  function onUseItem(it: Item) {
    if (typeof it.affectionDelta === 'number') {
      setAffection((a) => Math.max(0, Math.min(100, a + it.affectionDelta!)))
    }
    if (it.emotion) {
      const target = it.emotion.toLowerCase()
      const cur = sprites.find((s) => s.url === spriteUrl)
      let candidate = sprites.find(
        (s) => s.emotion?.toLowerCase() === target && s.char && cur?.char && s.char === cur.char,
      )
      if (!candidate) candidate = sprites.find((s) => s.emotion?.toLowerCase() === target)
      if (candidate) setSpriteUrl(candidate.url)
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full h-[100dvh] flex items-center justify-center">
      {/* 全屏铺满的背景（随窗口缩放覆盖）*/}
      <div
        className="absolute inset-0 -z-10 bg-center bg-cover pixelated"
        style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
      />
      {/* 背景叠加一层轻微遮罩以提升文本可读性（更浅，避免看起来像黑边） */}
      <div className="absolute inset-0 -z-10 bg-black/10 sm:bg-black/20" />

      <div className="absolute inset-0 overflow-hidden">
        <EngineStage
          bgUrl={bgUrl}
          spriteUrl={spriteUrl}
          // 立绘上移 15%（即相对之前 60% 下移，调整为 45% 下移）
          offsetPx={Math.round(stageSize.height * 0.45)}
        />

        {/* HUD - 左侧头像 */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-3">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/10 overflow-hidden border border-white/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-white/10 to-white/5" />
            )}
          </div>
        </div>
        {/* HUD - 右侧：好感度 + 商城/背包/金币 */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col items-end gap-2 sm:gap-3">
          <div className="w-32 sm:w-48">
            <div className="text-[11px] sm:text-xs mb-1 text-white/80">好感度</div>
            <div className="h-2 w-full bg-white/10 overflow-hidden">
              <div className="h-full bg-pink-500" style={{ width: `${affection}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <div className="px-2 py-1 border bg-white/10">🪙 {coins}</div>
            <button className="px-2 py-1 border bg-white/10 hover:bg-white/20" onClick={() => setShopOpen(true)}>背包/商城</button>
          </div>
        </div>

        {/* 对话框 */}
        <div
          className="absolute bottom-0 left-0 right-0 p-3 sm:p-4"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}
        >
          <div className="rounded-none border border-dialogue-border bg-dialogue-bg backdrop-blur px-3 py-2 sm:px-4 sm:py-3">
            <div className="mb-1 sm:mb-2 text-xs sm:text-sm text-white/70">東嘉弥真 御奈</div>
            <div className="min-h-[56px] sm:min-h-[64px] text-base sm:text-lg leading-relaxed text-shadow typewriter">{dialogue}</div>
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

        {shopOpen && (
          <InventoryShop
            coins={coins}
            inventory={inventory}
            onClose={() => setShopOpen(false)}
            onCoinsChange={setCoins}
            onInventoryChange={setInventory}
            onUseItem={onUseItem}
          />
        )}
      </div>
    </div>
  )
}
