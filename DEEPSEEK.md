# DeepSeek API 集成与最佳实践

本文档结合官方文档要点与本项目实际技术栈（Next.js 14 + Edge/Node 运行时 + 流式 SSE），提供 DeepSeek API 的集成示例与最佳实践指引。

- 基于 Context7 检索到的官方要点：
  - OpenAI Chat Completions 兼容（可用 `base_url` 指向 DeepSeek）。
  - 支持多轮对话、流式输出、函数调用（严格模式 JSON Schema）、Anthropic API 兼容格式。
  - 推理模型 `deepseek-reasoner` 可同时返回思维链 `reasoning_content` 与最终 `content`（流式/非流式）。
  - 上下文硬盘缓存（Context Caching）：重复前缀触发命中，降低延迟与费用；`usage` 中有 `prompt_cache_hit_tokens/miss_tokens` 统计。
  - 建议在版本更新或效果波动时，协同调整 System Prompt 与 Temperature。
  - 并发与容量弹性强（适合横向扩展）。

---

## 1) 环境配置与模型

- 本项目已有环境变量键位（见 `lib/env.ts`）：
  - `DEEPSEEK_API_KEY`：你的 API Key
  - `DEEPSEEK_BASE_URL`：默认 `https://api.deepseek.com`（也可留空走默认）
  - `DEEPSEEK_MODEL`：如 `deepseek-chat`、`deepseek-reasoner`

- 推荐模型：
  - `deepseek-chat`：通用对话（非“思考”模式），响应更轻、便宜。
  - `deepseek-reasoner`：推理模型（“思考”模式），支持 `reasoning_content`。

- OpenAI 兼容初始化（Node/TypeScript）：
```ts
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
})
```

---

## 2) Chat Completions（非流式与流式）

- 非流式（`deepseek-chat` 示例）：
```ts
const res = await client.chat.completions.create({
  model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: '用一句话解释量子纠缠。' },
  ],
  max_tokens: 512,
  temperature: 0.7,
})
const text = res.choices?.[0]?.message?.content || ''
```

- 流式（SSE）：
```ts
const stream = await client.chat.completions.create({
  model: 'deepseek-chat',
  messages,
  stream: true,
})
for await (const chunk of stream) {
  const delta = chunk.choices?.[0]?.delta?.content
  if (delta) process.stdout.write(delta)
}
```

- 推理模型（带思维链）：
```ts
const stream = await client.chat.completions.create({
  model: 'deepseek-reasoner',
  messages,
  stream: true,
})
let reasoning = ''
let final = ''
for await (const chunk of stream) {
  if (chunk.choices?.[0]?.delta?.reasoning_content) {
    reasoning += chunk.choices[0].delta.reasoning_content
  } else if (chunk.choices?.[0]?.delta?.content) {
    final += chunk.choices[0].delta.content
  }
}
```

最佳实践：
- 如果只需要最终回答，不展示思维链，可忽略 `reasoning_content`（能省带宽/渲染）。
- 使用 `max_tokens` 控制输出长度；R1 系列的 `max_tokens` 代表包含“思考”+“答案”的总输出上限，注意适当放大避免截断。

---

## 3) Next.js API 路由内的流式代理（与本项目对接）

本项目已有一个占位的 SSE 路由 `app/api/ai/route.ts`。要接入 DeepSeek，可参考：

```ts
// app/api/ai/route.ts（Node runtime）
import OpenAI from 'openai'
import { sseFormat } from '@/lib/sse'

export const runtime = 'nodejs'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
})

export async function POST(req: Request) {
  const { message, history = [], model = process.env.DEEPSEEK_MODEL || 'deepseek-chat' } = await req.json()

  const openaiMessages = [
    ...history,
    { role: 'user', content: message },
  ] as any

  const stream = await client.chat.completions.create({
    model,
    messages: openaiMessages,
    stream: true,
  })

  const encoder = new TextEncoder()
  const rs = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta
          if (!delta) continue
          if (delta.content) controller.enqueue(encoder.encode(sseFormat({ type: 'token', data: delta.content })))
          // 如使用 deepseek-reasoner 可选择把 reasoning_content 分开发给前端
          // if (delta.reasoning_content) controller.enqueue(...)
        }
        controller.enqueue(encoder.encode(sseFormat({ type: 'done', data: '' })))
        controller.close()
      } catch (e: any) {
        controller.enqueue(encoder.encode(sseFormat({ type: 'error', data: e?.message || 'stream error' })))
        controller.close()
      }
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
```

---

## 4) 上下文硬盘缓存（Context Caching）

官方特性：自动开启、无需改代码。对“完全相同的输入前缀”命中缓存，显著降低首 token 延迟与成本。

- 计费与统计：
  - `usage.prompt_cache_hit_tokens`：命中缓存的输入 token 数（更低单价）。
  - `usage.prompt_cache_miss_tokens`：未命中的输入 token 数。
- 使用场景：
  - 多轮对话：第二轮起可命中上一轮的共同前缀。
  - Few-shot：常驻示例放在开头，后续请求只变最后问题。
  - 数据/代码分析：重复引用同一文档/仓库的长前缀。
- 注意：只对“开头前缀”匹配有效，中间重复内容不命中；缓存是“尽力而为”，不保证 100% 命中。

实践建议：
- 把稳定的 system prompt、few-shots、长上下文尽量放在消息开头，后续只变用户尾部问题。
- 监控 `usage` 字段中 cache hit/miss，评估成本优化效果。

---

## 5) 函数调用（Function Calling）与严格模式

- 定义工具（严格模式 JSON Schema）：
```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "strict": true,
    "description": "Get weather of a location",
    "parameters": {
      "type": "object",
      "properties": { "location": { "type": "string" } },
      "required": ["location"],
      "additionalProperties": false
    }
  }
}
```

- 控制 tool choice：`none | auto | required | { type:"function", function:{ name:"..." } }`
- 最佳实践：
  - 严格模式下给出完整 JSON Schema（含 required / additionalProperties:false）。
  - 工具多时使用 `auto` 让模型自由选择；必须调用时用 `required` 或点名函数。

---

## 6) Anthropic API 兼容

- 通过设置：
```bash
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_API_KEY=YOUR_API_KEY
```
- 使用 Anthropic SDK 也可直接访问 DeepSeek，字段支持包含 `model/max_tokens/stop_sequences/stream/system/temperature/top_p` 等。

---

## 7) 性能、并发与费用控制

- 并发与速率：官方宣称并发/速率限制宽松，适合高并发扩展（仍建议本地做重试与熔断）。
- 温度与提示：大版本切换后若效果波动，配合调整 System Prompt 与 Temperature。
- `max_tokens`：R1 系列为思考+答案的总上限。避免过小导致截断；需要完整思维链时适当放大。
- 日志与观测：记录 `usage`（含 cache 命中统计）、延迟指标、错误类型，用于容量与成本优化。

---

## 8) 错误处理与重试

- 超时：为每次请求设置合理超时（如 30s~60s，流式除外）。
- 重试：对网络错误/5xx 指数退避重试；对 4xx 做参数/内容修正后再试。
- 降级：在高峰或失败率升高时，临时切回 `deepseek-chat` 或关闭思维链输出。

---

## 9) 本项目接入建议（与现有代码对齐）

- 环境变量：在 `.env.local` 填写 `DEEPSEEK_API_KEY`，可选 `DEEPSEEK_BASE_URL=https://api.deepseek.com`、`DEEPSEEK_MODEL=deepseek-chat`。
- API 代理：将 `app/api/ai/route.ts` 中占位的本地 token 模拟改为上文的 OpenAI 兼容流式代理。
- 前端流读取：`components/GameScene.tsx` 已按 SSE 追加字符的方式渲染（打字机感），可直接复用。
- 推理模型：若切到 `deepseek-reasoner`，可在前端选择是否单独展示/隐藏 `reasoning_content`。
- 费用优化：将系统提示、角色设定与 Few-shot 放在 messages 开头，以最大化缓存命中率。

---

## 10) cURL / Fetch 最小示例

- cURL（流式关闭）：
```bash
curl https://api.deepseek.com/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {"role": "user", "content": "你好！用一句话介绍你自己。"}
    ],
    "max_tokens": 200
  }'
```

- Node Fetch（流式）示意：
```ts
const r = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ model: 'deepseek-chat', messages, stream: true })
})
// 然后按 ReadableStream 逐块解析 JSON 行（或使用 openai SDK 简化）
```

---

## 参考
- DeepSeek API 官方文档（Chat/Reasoner/Function Calling/Anthropic 兼容/上下文缓存/并发与费用等）。

如需，我可以直接把 `app/api/ai/route.ts` 替换为上述代理实现，并在前端显示思维链开关。
