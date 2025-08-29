import dynamic from 'next/dynamic'

const GameScene = dynamic(() => import('@/components/GameScene'), { ssr: false })

export const metadata = {
  title: '游戏 - Galgame Web',
}

export default function GamePage() {
  return (
    <main className="min-h-[100svh] p-0">
      <GameScene />
    </main>
  )
}
