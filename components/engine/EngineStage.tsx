"use client"
import { useEffect, useMemo, useRef } from 'react'

type Props = {
  bgUrl?: string
  spriteUrl?: string
}

function BasicStage({ bgUrl, spriteUrl }: Props) {
  return (
    <>
      {/* 仅渲染立绘，背景由外层全屏层统一处理，避免割裂 */}
      <div className="absolute inset-0 pointer-events-none">
        {spriteUrl && (
          <img
            src={spriteUrl}
            alt="sprite"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[70%] origin-bottom scale-[1.8] drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
          />
        )}
      </div>
    </>
  )
}

// NarraLeaf 渲染层（基于 narraleaf-react@0.1.0，兼容 React 18）
function NarraLeafStage({ bgUrl, spriteUrl }: Props) {
  // 动态 import 以避免 SSR 及包体在未开启时载入
  const NL = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('narraleaf-react') as any
    return mod
  }, [])

  const gameRef = useRef<any>(null)
  const storyRef = useRef<any>(null)
  const sceneRef = useRef<any>(null)
  const spriteRef = useRef<any>(null)
  const ctxRef = useRef<{ game: any; gameState: any; liveGame: any } | null>(null)
  const spriteCreatedRef = useRef<boolean>(false)

  // 调试：全局等比缩放立绘（NEXT_PUBLIC_SPRITE_SCALE，默认 1）
  const debugScale = useMemo(() => {
    let v: number | undefined
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href)
        const qp = url.searchParams.get('scale')
        if (qp) v = Number(qp)
      } catch {}
      const gv = (globalThis as any).__SPRITE_SCALE
      if (typeof gv === 'number') v = gv
      const ls = window.localStorage.getItem('sprite_scale')
      if (!v && ls) v = Number(ls)
    }
    if (v === undefined) {
      const raw = (process.env.NEXT_PUBLIC_SPRITE_SCALE ?? '1.8') as string
      v = Number(raw)
    }
    return Number.isFinite(v) && (v as number) > 0 ? (v as number) : 1.8
  }, [])

  // 初始化 Game/Story/Scene/Image
  if (!gameRef.current) {
    gameRef.current = new NL.Game({})
    const scene = new NL.Scene('main', {})
    const story = new NL.Story('story', {})
    story.entry(scene)
    storyRef.current = story
    sceneRef.current = scene
    spriteRef.current = new NL.Image('sprite', { src: spriteUrl || '', display: !!spriteUrl })
  }

  // 背景与立绘变更时，同步到 NarraLeaf
  // 不在 NarraLeaf 内部设置背景，使用外层全屏背景，避免舞台与外层不一致导致割裂

  useEffect(() => {
    const sprite = spriteRef.current
    if (!sprite) return
    if (spriteUrl) {
      try { sprite.setSrc(spriteUrl) } catch {}
      // 应用等比缩放（调试）
      try { sprite.applyTransform(new NL.Transform({ transform: { scale: debugScale } }, { duration: 0 })) } catch {}
    }
  }, [spriteUrl, debugScale])

  const onReady = (ctx: any) => {
    ctxRef.current = ctx
    const scene = sceneRef.current
    const sprite = spriteRef.current
    if (scene && sprite && !spriteCreatedRef.current) {
      try {
        ctx.gameState.createImage(sprite, scene)
        spriteCreatedRef.current = true
        // 首次载入时立即按照比例缩放（调试）
        try {
          sprite.show(new NL.Transform({ transform: { scale: debugScale } }, { duration: 0 }))
        } catch {}
      } catch {}
    }
    // 提供全局调试方法：在控制台调用 setSpriteScale(1.2) 动态缩放并记忆
    try {
      ;(globalThis as any).setSpriteScale = (next: number) => {
        try {
          if (typeof next !== 'number' || !Number.isFinite(next) || next <= 0) return
          window.localStorage.setItem('sprite_scale', String(next))
          const s = spriteRef.current
          if (s) s.applyTransform(new NL.Transform({ transform: { scale: next } }, { duration: 0 }))
        } catch {}
      }
    } catch {}
  }

  // 容器宽高由外层父容器控制，这里填满父容器
  const Player = NL.Player as any
  const GameProviders = NL.GameProviders as any

  return (
    <div className="absolute inset-0">
      <GameProviders game={gameRef.current}>
        <Player
          story={storyRef.current}
          width="100%"
          height="100%"
          onReady={onReady}
          className="w-full h-full"
        />
      </GameProviders>
    </div>
  )
}

export default function EngineStage(props: Props) {
  if (process.env.NEXT_PUBLIC_USE_NARRALEAF === 'true') {
    return <NarraLeafStage {...props} />
  }
  return <BasicStage {...props} />
}
