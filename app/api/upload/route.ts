import { env } from '@/lib/env'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const form = await req.formData()
  // optional fields controlling destination
  const rawType = String(form.get('type') || '').trim().toLowerCase()
  const rawChar = String(form.get('char') || '').trim()
  const type: 'bg' | 'sprites' | 'avatars' | 'items' | 'photos' | '' =
    rawType === 'bg' || rawType === 'sprites' || rawType === 'avatars' || rawType === 'items' || rawType === 'photos'
      ? (rawType as any)
      : ''
  const charId = rawChar ? rawChar.replace(/[^\w\-]+/g, '_') : ''

  const files: File[] = []
  for (const entry of form.values()) {
    if (entry instanceof File) files.push(entry)
  }
  if (files.length === 0) return new Response(JSON.stringify({ error: 'No file' }), { status: 400 })

  // resolve destination directory
  let dir = env.UPLOAD_DIR
  if (type === 'bg') dir = join(env.UPLOAD_DIR, 'bg')
  else if (type === 'avatars') dir = join(env.UPLOAD_DIR, 'avatars')
  else if (type === 'sprites') dir = charId ? join(env.UPLOAD_DIR, 'sprites', charId) : join(env.UPLOAD_DIR, 'sprites')
  else if (type === 'items') dir = join(env.UPLOAD_DIR, 'items')
  else if (type === 'photos') dir = join(env.UPLOAD_DIR, 'photos')

  try { mkdirSync(dir, { recursive: true }) } catch {}

  const results: Array<{ name: string; url: string; size: number }> = []
  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer())
    const safeName = `${Date.now()}-${(f.name || 'file').replace(/[^\w.\-]+/g, '_')}`
    const abs = join(dir, safeName)
    writeFileSync(abs, buf)
    // compute public url
    let publicUrl = `/uploads/${safeName}`
    if (type === 'bg') publicUrl = `/uploads/bg/${safeName}`
    else if (type === 'avatars') publicUrl = `/uploads/avatars/${safeName}`
    else if (type === 'sprites') publicUrl = charId ? `/uploads/sprites/${charId}/${safeName}` : `/uploads/sprites/${safeName}`
    else if (type === 'items') publicUrl = `/uploads/items/${safeName}`
    else if (type === 'photos') publicUrl = `/uploads/photos/${safeName}`
    results.push({ name: safeName, url: publicUrl, size: buf.length })
  }

  return Response.json({ files: results })
}
