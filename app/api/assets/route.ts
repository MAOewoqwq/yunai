import { NextRequest } from 'next/server'
import { join, extname, basename } from 'node:path'
import { readdirSync } from 'node:fs'

export const runtime = 'nodejs'

type AssetType = 'bg' | 'sprites' | 'avatars' | 'items' | 'photos'

function isImage(name: string) {
  const ext = extname(name).toLowerCase()
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get('type') || 'bg') as AssetType
  const charFilter = searchParams.get('char') || undefined

  const base = join(process.cwd(), 'public', 'uploads')
  const target = join(base, type)

  try {
    const result: any[] = []

    if (type === 'bg' || type === 'avatars' || type === 'items' || type === 'photos') {
      const files = readdirSync(target, { withFileTypes: true })
      for (const f of files) {
        if (!f.isFile()) continue
        // ignore macOS AppleDouble/hidden files
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
      // allow both nested by char and flat files
      for (const it of items) {
        // skip hidden/appledouble entries at top level too
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
          // flat: character inferred from filename. Support separators: '-', '_', or space
          if (it.name.startsWith('._') || it.name.startsWith('.') || it.name === '.DS_Store') continue
          if (!isImage(it.name)) continue
          const baseNameRaw = basename(it.name, extname(it.name))
          const norm = baseNameRaw.trim()
          // Try to split into [charId, emotion]
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

    return Response.json({ files: result })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Read assets failed' }), { status: 500 })
  }
}
