import Link from 'next/link'
import { join, extname } from 'node:path'
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { env } from '@/lib/env'

type Asset = { url: string; name?: string }

export default async function HomePage() {
  let bgUrl: string | undefined
  const prefer = (list: Asset[]): string | undefined => {
    if (!Array.isArray(list) || list.length === 0) return undefined
    const preferred = list.find((a) => (a.name || a.url).toLowerCase().includes('home')
      || (a.name || a.url).toLowerCase().includes('index')
      || (a.name || a.url).includes('首页'))
    return (preferred?.url) || list[0]?.url
  }

  // 优先从 manifest 读取（Vercel 部署）
  const manifestPaths = [
    join(process.cwd(), 'public', 'assets-manifest.json'),
    join(process.cwd(), '.next', 'standalone', 'public', 'assets-manifest.json'),
  ]
  for (const manifestPath of manifestPaths) {
    if (!bgUrl && existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        const files: Asset[] = manifest.assets?.bg || []
        bgUrl = prefer(files)
      } catch {}
    }
  }

  // 回退：动态扫描目录（本地开发）
  if (!bgUrl) {
    try {
      const dir = join(env.UPLOAD_DIR, 'bg')
      const files = readdirSync(dir, { withFileTypes: true })
        .filter((f) => f.isFile())
        .filter((f) => !f.name.startsWith('._') && !f.name.startsWith('.') && f.name !== '.DS_Store')
        .map((f) => f.name)
        .filter((n) => ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.JPG', '.PNG', '.JPEG', '.WEBP', '.GIF'].includes(extname(n)))
      const assets: Asset[] = files.map((n) => ({ url: `/uploads/bg/${n}`, name: n }))
      bgUrl = prefer(assets)
    } catch {}
  }

  return (
    <main className="relative min-h-[100dvh] flex items-center justify-center">
      {/* 背景层 */}
      <div className="absolute inset-0 -z-10 bg-center bg-cover" style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }} />
      {/* 遮罩，增加对比度 */}
      <div className="absolute inset-0 -z-10 bg-black/20" />

      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold drop-shadow">Mina's closet</h1>
        <p className="text-white/80">御奈のクロゼット</p>
        <div className="flex items-center justify-center">
          <Link className="rounded-none border border-white/30 bg-white/10 px-4 py-2 hover:bg-white/20" href="/game">
            开始游戏
          </Link>
        </div>
      </div>
    </main>
  )
}
