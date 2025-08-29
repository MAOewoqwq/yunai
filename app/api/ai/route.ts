import { sseFormat } from '@/lib/sse'

export const runtime = 'nodejs'

type Req = {
  message: string
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  model?: string
  systemOverride?: string
  temperature?: number
  max_tokens?: number
}

export async function POST(req: Request) {
  const body = (await req.json()) as Req
  const encoder = new TextEncoder()

  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const model = body.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  const temperature = typeof body.temperature === 'number' ? body.temperature : Number(process.env.AI_TEMPERATURE || 0.7)
  const maxTokens = typeof body.max_tokens === 'number' ? body.max_tokens : Number(process.env.AI_MAX_TOKENS || 512)

  if (!apiKey) {
    return new Response('Missing DEEPSEEK_API_KEY', { status: 500 })
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []
  if (body.systemOverride) messages.push({ role: 'system', content: body.systemOverride })
  if (Array.isArray(body.history)) messages.push(...(body.history as any))
  messages.push({ role: 'user', content: body.message || '' })

  const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '')
    return new Response(`data: ${JSON.stringify({ type: 'error', data: errText || 'upstream error' })}\n\n`, {
      status: upstream.status || 502,
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
    })
  }

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // 把 DeepSeek 的 SSE 转换为前端消费的 token/done 事件
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''
          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith('data:')) continue
            const payload = line.replace(/^data:\s*/, '')
            if (payload === '[DONE]') {
              controller.enqueue(encoder.encode(sseFormat({ type: 'done', data: '' })))
              controller.close()
              return
            }
            try {
              const json = JSON.parse(payload)
              const delta = json?.choices?.[0]?.delta
              const content: string | undefined = delta?.content
              // 可选：忽略 reasoning_content，或按需单独发送
              if (content) controller.enqueue(encoder.encode(sseFormat({ type: 'token', data: content })))
            } catch {}
          }
        }
        controller.enqueue(encoder.encode(sseFormat({ type: 'done', data: '' })))
        controller.close()
      } catch (e: any) {
        controller.enqueue(encoder.encode(sseFormat({ type: 'error', data: e?.message || 'stream error' })))
        controller.close()
      }
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
