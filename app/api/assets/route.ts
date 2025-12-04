import { NextRequest } from 'next/server'
import { join, extname, basename } from 'node:path'
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

type AssetType = 'bg' | 'sprites' | 'avatars' | 'items' | 'photos'

function isImage(name: string) {
  const ext = extname(name).toLowerCase()
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)
}

// 尝试从构建时生成的 manifest 读取资源列表（Vercel 部署时使用）
function tryReadManifest(type: AssetType, charFilter?: string): any[] | null {
  try {
    // manifest 在构建时生成到 public/assets-manifest.json
    // 在 Vercel 上，public 文件夹会被复制到 .next/standalone/public
    const manifestPaths = [
      join(process.cwd(), 'public', 'assets-manifest.json'),
      join(process.cwd(), '.next', 'standalone', 'public', 'assets-manifest.json'),
    ]
    
    for (const manifestPath of manifestPaths) {
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        let files = manifest.assets?.[type] || []
        
        // 对 sprites 应用 charFilter
        if (type === 'sprites' && charFilter) {
          files = files.filter((f: any) => f.char === charFilter)
        }
        
        return files
      }
    }
  } catch {}
  return null
}

// 动态扫描目录（本地开发时使用）
function scanDirectory(type: AssetType, charFilter?: string): any[] {
  const base = env.UPLOAD_DIR
  const target = join(base, type)
  const result: any[] = []

  if (!existsSync(target)) {
    return result
  }

  if (type === 'bg' || type === 'avatars' || type === 'items' || type === 'photos') {
    const files = readdirSync(target, { withFileTypes: true })
    for (const f of files) {
      if (!f.isFile()) continue
      if (f.name.startsWith('._') || f.name.startsWith('.') || f.name === '.DS_Store') continue
      if (!isImage(f.name)) continue
      result.push({
        url: `/uploads/${type}/${f.name}`,
        name: basename(f.name),
        type,
      })
    }
  } else if (type === 'sprites') {
    const items = readdirSync(target, { withFileTypes: true })
    for (const it of items) {
      if (it.name.startsWith('._') || it.name.startsWith('.') || it.name === '.DS_Store') continue
      const p = join(target, it.name)
      if (it.isDirectory()) {
        const charId = it.name
        if (charFilter && charFilter !== charId) continue
        const imgs = readdirSync(p, { withFileTypes: true })
        for (const img of imgs) {
          if (!img.isFile()) continue
          if (img.name.startsWith('._') || img.name.startsWith('.') || img.name === '.DS_Store') continue
          if (!isImage(img.name)) continue
          result.push({
            url: `/uploads/sprites/${charId}/${img.name}`,
            name: basename(img.name),
            char: charId,
            emotion: basename(img.name, extname(img.name)),
            type,
          })
        }
      } else if (it.isFile()) {
        if (!isImage(it.name)) continue
        const baseNameRaw = basename(it.name, extname(it.name))
        const norm = baseNameRaw.trim()
        let charId = 'default'
        let emotion = norm
        const trySplitters = ['-', '_', ' ']
        for (const sep of trySplitters) {
          if (norm.includes(sep)) {
            const parts = norm.split(sep).filter(Boolean)
            if (parts.length >= 2) {
              charId = parts[0]
              emotion = parts.slice(1).join(' ')
              break
            }
          }
        }
        if (charFilter && charFilter !== charId) continue
        result.push({
          url: `/uploads/sprites/${it.name}`,
          name: basename(it.name),
          char: charId,
          emotion,
          type,
        })
      }
    }
  }

  return result
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get('type') || 'bg') as AssetType
  const charFilter = searchParams.get('char') || undefined

  try {
    // 优先尝试从 manifest 读取（Vercel 部署）
    const manifestFiles = tryReadManifest(type, charFilter)
    if (manifestFiles !== null) {
      return Response.json({ files: manifestFiles })
    }

    // 回退到动态扫描（本地开发）
    const files = scanDirectory(type, charFilter)
    return Response.json({ files })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Read assets failed' }), { status: 500 })
  }
}
