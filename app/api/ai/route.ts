import { sseFormat } from '@/lib/sse'

export const runtime = 'nodejs'

type Req = {
  message: string
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  personaId?: string
  freechat?: boolean
  emotionHint?: string
  affection?: number
  systemOverride?: string
}

export async function POST(req: Request) {
  const body = (await req.json()) as Req
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // 占位：先输出一个简单的meta，模拟情绪/好感度变化
      controller.enqueue(encoder.encode(sseFormat({ type: 'meta', data: JSON.stringify({ emotion: 'neutral', affectionDelta: 1 }) })))

      const tokens = [`你`, `好`, `，`, `你`, `说`, `：`, body.message || '…']
      let i = 0
      const iv = setInterval(() => {
        if (i < tokens.length) {
          controller.enqueue(encoder.encode(sseFormat({ type: 'token', data: tokens[i++] })))
        } else {
          clearInterval(iv)
          controller.enqueue(encoder.encode(sseFormat({ type: 'done', data: '' })))
          controller.close()
        }
      }, 80)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

