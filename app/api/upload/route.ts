import { env } from '@/lib/env'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const form = await req.formData()
  const files: File[] = []
  for (const entry of form.values()) {
    if (entry instanceof File) files.push(entry)
  }
  if (files.length === 0) return new Response(JSON.stringify({ error: 'No file' }), { status: 400 })

  const dir = env.UPLOAD_DIR
  try { mkdirSync(dir, { recursive: true }) } catch {}

  const results: Array<{ name: string; url: string; size: number }> = []
  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer())
    const safeName = `${Date.now()}-${(f.name || 'file').replace(/[^\w.\-]+/g, '_')}`
    const abs = join(dir, safeName)
    writeFileSync(abs, buf)
    const publicUrl = `/uploads/${safeName}`
    results.push({ name: safeName, url: publicUrl, size: buf.length })
  }

  return Response.json({ files: results })
}

