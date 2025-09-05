import Link from 'next/link'
import { join, extname } from 'node:path'
import { readdirSync } from 'node:fs'

type Asset = { url: string; name?: string }

export default async function HomePage() {
  // 尝试读取已上传的背景图（public/uploads/bg），取第一张作为首页背景
  let bgUrl: string | undefined
  const prefer = (list: Asset[]): string | undefined => {
    if (!Array.isArray(list) || list.length === 0) return undefined
    // 优先匹配文件名包含“首页”/home/index 的图片
    const preferred = list.find((a) => (a.name || a.url).toLowerCase().includes('home')
      || (a.name || a.url).toLowerCase().includes('index')
      || (a.name || a.url).includes('首页'))
    return (preferred?.url) || list[0]?.url
  }

  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/assets?type=bg`, { cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      const files: Asset[] = Array.isArray(j.files) ? j.files : []
      bgUrl = prefer(files)
    }
  } catch {}
  // 兜底：直接读取 public/uploads/bg 下的第一张图片
  if (!bgUrl) {
    try {
      const dir = join(process.cwd(), 'public', 'uploads', 'bg')
      const files = readdirSync(dir, { withFileTypes: true })
        .filter((f) => f.isFile())
        // ignore macOS AppleDouble/hidden files
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
