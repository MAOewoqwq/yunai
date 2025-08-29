import { NextRequest } from 'next/server'
import { join, extname, basename } from 'node:path'
import { readdirSync, statSync } from 'node:fs'

export const runtime = 'nodejs'

type AssetType = 'bg' | 'sprites' | 'avatars'

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

    if (type === 'bg' || type === 'avatars') {
      const files = readdirSync(target, { withFileTypes: true })
      for (const f of files) {
        if (!f.isFile()) continue
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
        const p = join(target, it.name)
        if (it.isDirectory()) {
          const charId = it.name
          if (charFilter && charFilter !== charId) continue
          const imgs = readdirSync(p, { withFileTypes: true })
          for (const img of imgs) {
            if (!img.isFile()) continue
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
          // flat: character inferred from filename before first '-'
          if (!isImage(it.name)) continue
          const baseName = basename(it.name, extname(it.name))
          const [charId, emotion] = baseName.includes('-')
            ? baseName.split('-', 2)
            : ['default', baseName]
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

