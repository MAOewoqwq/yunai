#!/usr/bin/env node
/**
 * 构建时扫描 public/uploads 目录，生成资源清单 JSON
 * 解决 Vercel Serverless 函数无法通过 fs 读取 public 目录的问题
 */
const { join, extname, basename } = require('path')
const { readdirSync, existsSync, writeFileSync, mkdirSync } = require('fs')

const PUBLIC_DIR = join(__dirname, '..', 'public')
const UPLOADS_DIR = join(PUBLIC_DIR, 'uploads')
const OUTPUT_FILE = join(PUBLIC_DIR, 'assets-manifest.json')

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif']

function isImage(name) {
  const ext = extname(name).toLowerCase()
  return IMAGE_EXTS.includes(ext)
}

function scanDirectory(type) {
  const target = join(UPLOADS_DIR, type)
  const result = []

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

function main() {
  const manifest = {
    generatedAt: new Date().toISOString(),
    assets: {
      bg: scanDirectory('bg'),
      sprites: scanDirectory('sprites'),
      avatars: scanDirectory('avatars'),
      items: scanDirectory('items'),
      photos: scanDirectory('photos'),
    },
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2))
  console.log(`[generate-assets-manifest] Generated ${OUTPUT_FILE}`)
  console.log(`  - bg: ${manifest.assets.bg.length} files`)
  console.log(`  - sprites: ${manifest.assets.sprites.length} files`)
  console.log(`  - avatars: ${manifest.assets.avatars.length} files`)
  console.log(`  - items: ${manifest.assets.items.length} files`)
  console.log(`  - photos: ${manifest.assets.photos.length} files`)
}

main()
