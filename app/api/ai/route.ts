import { sseFormat } from '@/lib/sse'
import { DEFAULT_SYSTEM_PERSONA } from '@/lib/prompt'

export const runtime = 'nodejs'

type Req = {
  message: string
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  model?: string
  systemOverride?: string
  temperature?: number
  max_tokens?: number
  freechat?: boolean
}

export async function POST(req: Request) {
  const body = (await req.json()) as Req
  const encoder = new TextEncoder()

  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const model = body.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  const temperature = typeof body.temperature === 'number' ? body.temperature : Number(process.env.AI_TEMPERATURE || 0.7)
  const maxTokens = typeof body.max_tokens === 'number' ? body.max_tokens : Number(process.env.AI_MAX_TOKENS || 512)

  // Freechat gating: only forward when default enabled or content has trigger
  function parseFreechat(msg: string) {
    const raw = (msg || '').trim()
    const defaultOn = String(process.env.FREECHAT_DEFAULT || 'true').toLowerCase() === 'true'
    const patterns: Array<RegExp> = [
      /^(?:自由对话[:：])\s*(.*)$/i,
      /^\/ai\s+(.*)$/i,
      /^#ai\s+(.*)$/i,
    ]
    let matched = false
    let pure = raw
    for (const re of patterns) {
      const m = raw.match(re)
      if (m) {
        matched = true
        pure = (m[1] || '').trim() || raw.replace(re, '').trim()
        break
      }
    }
    const allow = defaultOn || matched
    return { allow, pure }
  }

  const { allow: allowFreechat, pure: userText } = parseFreechat(body.message || '')

  // Special rule: if user mentions self-introduction, output ONLY the fixed line
  const selfIntroRegexes: RegExp[] = [
    /自我\s*介绍(?:一下|下)?/,
    /介绍一下你(?:自己)?/,
    /介绍下你(?:自己)?/,
    /介绍你自己/,
    /请.*自我\s*介绍/,
    /来个?自我\s*介绍/,
    /做(?:一)?个?自我\s*介绍/,
  ]
  // 自我介绍特例：无需访问上游模型，即使缺少 API KEY 也能返回固定回答
  if (selfIntroRegexes.some((re) => re.test(userText || ''))) {
    const fixed = '自我介绍？好吧，我叫東嘉弥真 御奈。如果你有任何时尚方面的问题想问我，随时欢迎。'
    const rs = new ReadableStream<Uint8Array>({
      start(controller) {
        // 明确下发情绪为 normal，便于前端立绘/语音状态同步
        controller.enqueue(encoder.encode(sseFormat({ type: 'meta', data: JSON.stringify({ emotion: 'normal' }) })))
        controller.enqueue(encoder.encode(sseFormat({ type: 'token', data: fixed })))
        controller.enqueue(encoder.encode(sseFormat({ type: 'done', data: '' })))
        controller.close()
      },
    })
    return new Response(rs, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []
  // 固定人设：如未传入 systemOverride，则注入默认人设
  const sys = (body.systemOverride && body.systemOverride.trim()) || DEFAULT_SYSTEM_PERSONA
  messages.push({ role: 'system', content: sys })
  if (Array.isArray(body.history)) messages.push(...(body.history as any))
  messages.push({ role: 'user', content: userText || (body.message || '') })

  // 自由对话未开启：无需访问上游模型，直接回传提示
  if (body.freechat && !allowFreechat) {
    const rs = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(sseFormat({ type: 'meta', data: JSON.stringify({ note: 'freechat_blocked', hint: '以“自由对话:”或“/ai ”开头以启用自由对话' }) })))
        controller.enqueue(encoder.encode(sseFormat({ type: 'token', data: '（未进入自由对话模式）' })))
        controller.enqueue(encoder.encode(sseFormat({ type: 'done', data: '' })))
        controller.close()
      },
    })
    return new Response(rs, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  }

  // 仅当需要请求上游模型时，再检查 API KEY
  if (!apiKey) {
    const rs = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(sseFormat({ type: 'error', data: 'Missing DEEPSEEK_API_KEY' })))
        controller.enqueue(encoder.encode(sseFormat({ type: 'done', data: '' })))
        controller.close()
      },
    })
    return new Response(rs, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
      status: 500,
    })
  }

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
        // 把 DeepSeek 的 SSE 转换为前端消费的 token/done/meta(情绪) 事件
        let lastOut: string | null = null
        // 立绘情绪解析状态：仅在输出正文开始前解析形如（normal）/(normal)
        let hasVisibleOutput = false
        let tagOpen = false
        let tagBuf = ''
        let lastEmotion: string | null = null

        const isOpen = (ch: string) => ch === '(' || ch === '（'
        const isClose = (ch: string) => ch === ')' || ch === '）'
        const allowedEmotions = new Set(['normal', 'change'])
        function processChunk(raw: string): { text: string; emotion?: string } {
          if (!raw) return { text: '' }
          let out = ''
          let detected: string | undefined
          for (let i = 0; i < raw.length; i++) {
            const ch = raw[i]
            if (!hasVisibleOutput) {
              if (tagOpen) {
                tagBuf += ch
                if (isClose(ch)) {
                  // parse tag content
                  const body = tagBuf.slice(1, -1).trim().toLowerCase()
                  const emo = body.replace(/^emotion[:=]\s*/, '')
                  if (allowedEmotions.has(emo)) detected = emo
                  tagOpen = false
                  tagBuf = ''
                }
                continue
              }
              if (isOpen(ch)) {
                tagOpen = true
                tagBuf = ch
                continue
              }
            }
            // 非标签或正文开始后的普通字符
            out += ch
            if (!hasVisibleOutput && /\S/.test(ch)) hasVisibleOutput = true
          }
          return { text: out, emotion: detected }
        }
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
              if (content) {
                const processed = processChunk(content)
                if (processed.emotion && processed.emotion !== lastEmotion) {
                  lastEmotion = processed.emotion
                  controller.enqueue(encoder.encode(sseFormat({ type: 'meta', data: JSON.stringify({ emotion: lastEmotion }) })))
                }
                const clean = processed.text
                if (clean) {
                  // 简单去重：忽略与上一个完全相同的连续切片
                  if (lastOut === clean) continue
                  lastOut = clean
                  controller.enqueue(encoder.encode(sseFormat({ type: 'token', data: clean })))
                }
              }
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
