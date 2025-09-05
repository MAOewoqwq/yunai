#!/usr/bin/env bash
set -euo pipefail

# Build Next.js in standalone mode and package only .next/standalone
# Result: dist/next-standalone.tgz

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[pack-standalone] Building Next.js (output=standalone)..."
npm run build

echo "[pack-standalone] Ensuring .next/static is included inside .next/standalone..."
mkdir -p .next/standalone/.next
if [ -d .next/static ]; then
  rm -rf .next/standalone/.next/static
  cp -R .next/static .next/standalone/.next/static
fi

echo "[pack-standalone] Ensuring public is included inside .next/standalone..."
if [ -d public ]; then
  rm -rf .next/standalone/public
  cp -R public .next/standalone/public
fi

echo "[pack-standalone] Creating dist/next-standalone.tgz..."
mkdir -p dist
tar -czf dist/next-standalone.tgz .next/standalone

echo "[pack-standalone] Done: dist/next-standalone.tgz"

