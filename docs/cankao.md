## 一、项目概览

- 技术栈：Next.js 14（App Router）+ React 18 + TypeScript + TailwindCSS
- 运行模式：前端通过 SSE 与后端 `/api/ai` 交互；支持本地资源上传与动态加载
- 角色设定：人设与开场白集中在 `lib/prompt.ts`，可通过 `public/opening-lines.json` 覆盖

---

## 二、启动与配置

1) 复制环境变量并填写 Key：

```bash
cp env.example .env.local
# 在 .env.local 中设置：
# DEEPSEEK_API_KEY=你的密钥
# （可选）DEEPSEEK_BASE_URL=https://api.deepseek.com
# （可选）DEEPSEEK_MODEL=deepseek-chat
# （可选）NEXT_PUBLIC_BASE_URL=   # 子路径或独立域/CDN 时设置，如 /myapp 或 https://cdn.example.com
```

2) 本地启动：

```bash
npm run dev
# 打开 http://localhost:3000 主页，点击“开始游戏”，或直接访问 /game
```

3) 构建与启动：

```bash
npm run build
npm start
```

---

## 三、关键文件与职责

- 人设与开场
  - `lib/prompt.ts`: 人设 `DEFAULT_SYSTEM_PERSONA` 与默认开场白 `DEFAULT_OPENING_LINES`
  - `public/opening-lines.json`: 运行时覆盖开场白（支持 `{ text, voice }` 或纯字符串数组）

- 游戏场景与对话
  - `components/GameScene.tsx`: 主场景/对话框/SSE 渲染/语音播放/立绘与头像联动/好感度 HUD
  - 情绪推断：`lib/emotion.ts`（关键词 + 好感度兜底）
  - 语音映射：`lib/voice.ts`（文本/情绪 → `/public/audio/voice/*.mp3`）

- 后端 API
  - `app/api/ai/route.ts`: 代理 DeepSeek Chat Completions（流式），解析开头情绪标签 `(normal)/(change)` → 通过 `meta` 事件下发
  - `app/api/assets/route.ts`: 枚举 `public/uploads` 下的图片资产（背景/立绘/头像/道具/相册）
  - `app/api/upload/route.ts`: 表单上传到 `public/uploads`（支持 `type` 与 `char`）

- 首页与路由
  - `app/page.tsx`: 读取已上传背景图作为首页背景，入口按钮“开始游戏”
  - `app/game/page.tsx`: 动态加载 `GameScene`（禁 SSR）

---

## 四、AI 接入与流式细节

- 环境变量（`lib/env.ts` 与 `env.example`）：
  - `DEEPSEEK_API_KEY`（必填），`DEEPSEEK_BASE_URL`（可选），`DEEPSEEK_MODEL`（默认 `deepseek-chat`）
  - 温控/长度：`AI_TEMPERATURE`、`AI_MAX_TOKENS`
  - 自由对话门控：`FREECHAT_DEFAULT`（默认允许）

- 人设注入：`app/api/ai/route.ts` 会把 `lib/prompt.ts` 的 `DEFAULT_SYSTEM_PERSONA` 作为 system prompt 注入（可用 `systemOverride` 覆盖）

- 情绪标签解析：模型若在输出最前面添加 `(normal)` / `(change)`（首段且带半/全角括号），后端会截获并发出 `meta:{ emotion }` 事件；前端根据 `meta` 切立绘与播放语音

- 自我介绍特例：当用户输入包含“自我介绍”等关键词时，后端直接下发固定介绍台词（与人设一致），避免跑偏

---

## 五、资源与目录结构

- 资源目录：`public/uploads/{ bg | sprites | avatars | items | photos }`
  - 背景：`/uploads/bg/*`
  - 立绘：`/uploads/sprites/*` 或 `/uploads/sprites/{charId}/*`（文件名/子目录用于标注情绪与角色）
  - 头像：`/uploads/avatars/*`（可按角色命名方便匹配）
  - 道具：`/uploads/items/*`（也用于 HUD 的按钮图标候选）
  - 相册：`/uploads/photos/*`

- 上传 API：`POST /api/upload`
  - 字段：`type`（bg/sprites/avatars/items/photos），`char`（可选，仅 sprites 用于入库子目录）
  - 返回：已保存文件的 `url/name/size`

- 枚举 API：`GET /api/assets?type=bg|sprites|avatars|items|photos`

提示（路径前缀与文件名编码）
- 如部署在子路径（例：`https://example.com/myapp`）或使用独立域名/反代，请在 `.env.local` 设置 `NEXT_PUBLIC_BASE_URL`（如 `/myapp` 或 `https://cdn.example.com`）；前端会为 `/api/*`、`/uploads/*`、`/audio/*`、`/opening-lines.json` 等相对路径自动加此前缀。
- 对于包含保留字符（如 `[` `]` 空格 全角符号等）的音频文件名，前端仅对“最后一段文件名”做 `encodeURIComponent`，避免 404（例如 `/audio/voice/[yunai]有事儿吗？.mp3` → 实际请求为 `/audio/voice/%5Byunai%5D有事儿吗？.mp3`）。

---

## 六、语音与情绪联动

- 语音映射：`lib/voice.ts`
  - 文本精确/包含匹配到对应的音频文件路径（位于 `public/audio/voice`）
  - 情绪为 `change` 时，从两段“生气”语音中随机一段
  - 开场白可在 `public/opening-lines.json` 绑定 `voice` 字段直接指定 URL

- 播放策略（`components/GameScene.tsx`）：
  - 开场白仅播放一次，若自动播放被浏览器拦截，则在首次交互时播放
  - 模型标注 `change` 或本地推断为“愤怒”时，本轮仅播放一次对应语音，并对次轮进行兜底抑制，避免连播突兀
  - 若无 `change` 且本轮未播放，流结束后基于完整文本兜底匹配语音

---

## 七、商城/背包与好感度

- 组件：`components/InventoryShop.tsx`
  - 购入道具消耗金币、进入背包；“送出”时触发好感度增减与台词，并尝试切换立绘/语音
  - 好感度范围限制 0–100，并伴随正/负飘字动画

- 自定义：可扩展 `shopCatalog`（id/name/price/affectionDelta/emotion/icon/giftLines）与 `lib/voice.ts` 的语音映射

---

## 八、可定制项（建议路径）

- 人设与语气：编辑 `lib/prompt.ts` 或运行时覆盖 `public/opening-lines.json`
- 模型/温度：`.env.local` 中调整 `DEEPSEEK_MODEL`、`AI_TEMPERATURE`、`AI_MAX_TOKENS`
- 语音与立绘：向 `public/audio/voice`、`public/uploads/*` 添加资源，并在 `lib/voice.ts` 增加映射规则
- 情绪策略：根据需要改进 `lib/emotion.ts` 规则（或在后端追加情绪分类器）

---

## 九、常见问题

- 启动报错 `Missing DEEPSEEK_API_KEY`：在 `.env.local` 设置有效密钥
- 开场语音不播放：浏览器自动播放策略导致，首次点击/按键会补播
- 图片/音频加载失败：确保文件路径位于 `public` 下并注意大小写与空格；前端会对 URL 最后一段做 `encodeURIComponent`（尤其 `[]` 等需编码）。
- 部署在子路径或使用 CDN：设置 `NEXT_PUBLIC_BASE_URL`，前端会为静态资源与 API 自动加此前缀。
- 资源未显示：检查 `GET /api/assets` 的 `type` 是否正确、资源目录是否存在、文件扩展名是否在允许列表