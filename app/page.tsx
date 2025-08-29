import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Galgame Web</h1>
        <p className="text-white/70">Next.js + Tailwind + AI 对话（占位）</p>
        <Link
          className="inline-block rounded bg-white/10 px-4 py-2 hover:bg-white/20"
          href="/game"
        >
          进入游戏
        </Link>
      </div>
    </main>
  )
}

