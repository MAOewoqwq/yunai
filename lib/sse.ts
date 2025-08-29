export function sseFormat(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`
}

