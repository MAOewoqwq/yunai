"use client"
import { useEffect, useMemo, useRef } from 'react'

type Props = {
  bgUrl?: string
  spriteUrl?: string
}

function BasicStage({ bgUrl, spriteUrl }: Props) {
  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
      />
      <div className="absolute inset-0 pointer-events-none">
        {spriteUrl && (
          <img
            src={spriteUrl}
            alt="sprite"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[70%] drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
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

  const gameRef = useRef<any>()
  const storyRef = useRef<any>()
  const sceneRef = useRef<any>()
  const spriteRef = useRef<any>()
  const ctxRef = useRef<{ game: any; gameState: any; liveGame: any } | null>(null)
  const spriteCreatedRef = useRef<boolean>(false)

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
  useEffect(() => {
    const scene = sceneRef.current
    if (scene && bgUrl) {
      try { scene.setBackground(bgUrl) } catch {}
    }
  }, [bgUrl])

  useEffect(() => {
    const sprite = spriteRef.current
    if (!sprite) return
    if (spriteUrl) {
      try { sprite.setSrc(spriteUrl) } catch {}
    }
  }, [spriteUrl])

  const onReady = (ctx: any) => {
    ctxRef.current = ctx
    const scene = sceneRef.current
    const sprite = spriteRef.current
    if (scene && bgUrl) {
      try { scene.setBackground(bgUrl) } catch {}
    }
    if (scene && sprite && !spriteCreatedRef.current) {
      try {
        ctx.gameState.createImage(sprite, scene)
        spriteCreatedRef.current = true
      } catch {}
    }
  }

  // 容器宽高由外层父容器控制，这里填满父容器
  const Player = NL.Player as (props: any) => JSX.Element
  const GameProviders = NL.GameProviders as (props: any) => JSX.Element

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
