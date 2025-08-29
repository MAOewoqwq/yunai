"use client"

type Props = {
  bgUrl?: string
  spriteUrl?: string
}

function BasicStage({ bgUrl, spriteUrl }: Props) {
  return (
    <>
      {/* 背景层 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
      />

      {/* 立绘层 */}
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

// 预留：NarraLeaf 渲染层（当前回退到 BasicStage）。
function NarraLeafStage(props: Props) {
  // 待安装接入 @narraleaf/react 后替换实现
  return <BasicStage {...props} />
}

export default function EngineStage(props: Props) {
  if (process.env.NEXT_PUBLIC_USE_NARRALEAF === 'true') {
    return <NarraLeafStage {...props} />
  }
  return <BasicStage {...props} />
}

