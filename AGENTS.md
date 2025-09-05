# Repository Guidelines

## Project Structure & Module Organization
- 技术栈：Next.js 14（App Router）+ React 18 + TypeScript + TailwindCSS。
- `app/`：页面与布局；`app/api/*/route.ts` 提供 AI 流式 SSE、资源上传与枚举。
- `components/`：主要界面与交互（如 `GameScene.tsx`、`InventoryShop.tsx`）；`lib/`：`env.ts`、`prompt.ts`、`emotion.ts`、`voice.ts`、`sse.ts`、`shims/`。
- 静态与上传：`public/`；用户上传位于 `public/uploads/{bg,sprites,avatars,items,photos}`。脚本/构建：`scripts/pack-standalone.sh`、`dist/`。Path 别名：`@/components/*`、`@/lib/*`。

## 三、关键文件与职责
- 人设与开场：`lib/prompt.ts` 提供 `DEFAULT_SYSTEM_PERSONA`、`DEFAULT_OPENING_LINES`；可在 `public/opening-lines.json` 运行时覆盖（支持 `{ text, voice }` 或纯字符串）。
- 游戏场景与对话：`components/GameScene.tsx` 负责主场景、SSE 渲染、语音播放、立绘/头像联动、好感度 HUD；情绪推断在 `lib/emotion.ts`；语音映射在 `lib/voice.ts`（映射到 `/public/audio/voice/*.mp3`）。
- 后端 API：`app/api/ai/route.ts` 代理 DeepSeek 流式并解析开头情绪标签 `(normal)/(change)` 通过 `meta` 下发；`app/api/assets/route.ts` 枚举 `public/uploads` 资产；`app/api/upload/route.ts` 处理表单上传（支持 `type`/`char`）。
- 首页与路由：`app/page.tsx` 读取已上传背景作为首页背景并提供“开始游戏”；`app/game/page.tsx` 动态加载 `GameScene`（禁 SSR）。

## Build, Test, and Development Commands
- `npm run dev`：启动本地开发；访问 `http://localhost:3000` 或 `/game`。
- `npm run typecheck`：TypeScript 严格类型检查。
- `npm run build` / `npm start`：生产构建与启动（Next `output: 'standalone'`）。
- `npm run pack:standalone`：打包 `.next/standalone` 为 `dist/next-standalone.tgz`；Docker 示例：`npm run pack:standalone && docker build -t app . && docker run -p 3000:3000 app`。

## Coding Style & Naming Conventions
- 2 空格缩进；组件文件 PascalCase（如 `GameScene.tsx`），函数/变量驼峰；API 文件为 `route.ts`。
- App Router 约定：页面 `app/**/page.tsx`，布局 `app/layout.tsx`。
- 样式优先 Tailwind；保持导入顺序与路径别名使用；提交前运行 `npm run typecheck`。

## Testing Guidelines
- 尚未配置测试；如新增，推荐 Vitest + React Testing Library，E2E 用 Playwright。
- 命名 `*.test.ts(x)`，与源码同目录或 `__tests__/`；确保快速、稳定、可在 CI 运行。

## Commit & Pull Request Guidelines
- 遵循 Conventional Commits（示例：`feat(album): ...`、`fix(audio): ...`）。
- PR 聚焦单一变更；附清晰描述、关联 issue、UI 截图/GIF（如有）。
- 合并前确保 `npm run typecheck && npm run build` 通过，并更新文档（`docs/`、`DEPLOYMENT.md`）。

## 四、AI 接入与流式细节
- 环境变量（见 `lib/env.ts` 与 `env.example`）：必填 `DEEPSEEK_API_KEY`；可选 `DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`（默认 `deepseek-chat`）、`AI_TEMPERATURE`、`AI_MAX_TOKENS`、`FREECHAT_DEFAULT`（默认允许自由对话）、`UPLOAD_DIR`、`NEXT_PUBLIC_BASE_URL`。
- 人设注入：`app/api/ai/route.ts` 将 `DEFAULT_SYSTEM_PERSONA` 注入 system prompt（可用 `systemOverride` 覆盖）。
- 情绪标签解析：模型如在输出最前面添加 `(normal)` / `(change)`（首段、半/全角括号均可），后端会发出 `meta:{ emotion }`；前端据此切立绘并触发语音。
- 自我介绍特例：包含“自我介绍”等关键词时，后端直接返回固定介绍语，避免跑偏。

## 五、资源与目录结构
- 资源目录：`public/uploads/{ bg | sprites | avatars | items | photos }`
  - 背景：`/uploads/bg/*`；立绘：`/uploads/sprites/*` 或 `/uploads/sprites/{charId}/*`（文件名/子目录用于标注情绪/角色）
  - 头像：`/uploads/avatars/*`；道具：`/uploads/items/*`；相册：`/uploads/photos/*`
- 上传 API：`POST /api/upload`（字段 `type`、可选 `char`）；返回 `url/name/size`。
- 枚举 API：`GET /api/assets?type=bg|sprites|avatars|items|photos`。
- 提示：部署在子路径或独立域/CDN 时设置 `.env.local` 的 `NEXT_PUBLIC_BASE_URL`；前端对音频仅对“最后一段文件名”做 `encodeURIComponent`，避免 `[]`、空格等字符导致 404。

## 六、语音与情绪联动
- 语音映射：`lib/voice.ts` 基于文本/情绪选择 `/public/audio/voice/*.mp3`；`change` 时在两段“生气”语音中随机。
- 开场白：可在 `public/opening-lines.json` 直接绑定 `voice` 字段（URL）。
- 播放策略（`GameScene.tsx`）：开场白仅播一次，若被浏览器拦截则在首次交互补播；`change` 或本地推断愤怒仅播一次并抑制次轮兜底；未播则在流结束后基于完整文本兜底匹配。

## 七、商城/背包与好感度
- 组件：`components/InventoryShop.tsx`；购入消耗金币、入背包；“送出”触发好感度增减与台词，并尝试换立绘/语音；好感度限定在 0–100，带正/负飘字动画。
- 自定义：扩展 `shopCatalog`（`id/name/price/affectionDelta/emotion/icon/giftLines`）与 `lib/voice.ts` 映射。

## 八、可定制项（建议路径）
- 人设与语气：编辑 `lib/prompt.ts` 或覆盖 `public/opening-lines.json`。
- 模型/温度：`.env.local` 中调整 `DEEPSEEK_MODEL`、`AI_TEMPERATURE`、`AI_MAX_TOKENS`。
- 语音与立绘：向 `public/audio/voice`、`public/uploads/*` 添加资源，并在 `lib/voice.ts` 增加映射规则。
- 情绪策略：可优化 `lib/emotion.ts` 规则，或在后端增加分类器。

## 九、常见问题（FAQ）
- 启动报错 `Missing DEEPSEEK_API_KEY`：在 `.env.local` 设置有效密钥。
- 开场语音不播放：浏览器自动播放限制；首次点击/按键会补播。
- 图片/音频加载失败：确认放在 `public/` 下、注意大小写/空格；音频 URL 的最后一段会自动 `encodeURIComponent`。
- 部署在子路径/CDN：设置 `NEXT_PUBLIC_BASE_URL`；静态资源与 API 将以此前缀访问。

## 十、语音与音频命名（维护说明）

- 概述：`lib/voice.ts` 的 `matchVoice(text, emotion)` 负责“台词/情绪 → mp3 路径”的映射；特殊情绪 `change` 在两段“生气”语音中随机挑选。开场白语音可由 `public/opening-lines.json` 绑定 `voice` 字段覆盖。
- 播放与编码：前端在播放音频时仅对“URL 的最后一段文件名”做 `encodeURIComponent`，避免 `[]` 等保留字符导致 404；不要对整个 URL 编码。
  - 代码参考：`components/GameScene.tsx:58–83` 的 `playVoice()` 与 `components/GameScene.tsx:86–110` 的 `playVoiceUrl()` 都内置“仅编码最后一段”的逻辑。
- 子路径部署：如部署在子路径或经独立域名/CDN，请设置 `.env.local` 的 `NEXT_PUBLIC_BASE_URL`，并确保 `public/opening-lines.json` 与 `lib/voice.ts` 中的路径都能在此前缀下正确访问。

### A. 已有映射与关键位置

- `lib/voice.ts` 中的映射（行号基于当前仓库，仅供定位参考）：
  - `change` 怒语随机：`lib/voice.ts:9`、`lib/voice.ts:10`
  - 开场四句：`lib/voice.ts:21`、`24`、`27`、`30`
  - 关系提升：`lib/voice.ts:45`
  - 自我介绍：`lib/voice.ts:50`
  - 与花/心情相关：`lib/voice.ts:56`、`61`、`66`
  - 狐狸乌冬相关：`lib/voice.ts:71`、`76`
  - 口味/甜点相关：`lib/voice.ts:81`、`86`、`92`、`97`
  - 生姜相关：`lib/voice.ts:102`、`107`
- 开场白绑定（运行时覆盖）：`public/opening-lines.json:2–5`
- 背景音乐（非台词）：`components/GameScene.tsx:537` → `/audio/jazzmusic.mp3`

### B. 为何建议重命名音频文件

- 现状问题：仓库内 `public/audio/voice/` 部分 mp3 文件名包含保留字符（如 `[`、`]`、中文问号、全角符号等），在某些 Nginx/CDN/反代或操作系统下可能触发不一致的 URL 编码处理，导致 404。
- 代码已有兜底：前端仅编码“最后一段文件名”已能绕开大多数问题，但为长期稳定性与可移植性，推荐统一改为安全文件名。

### C. 推荐命名规范（重命名策略）

- 规则：小写字母/数字/连字符（`a-z0-9-`），不含空格与标点；示例：`yunai-angry-1.mp3`、`yunai-opener-udon.mp3`、`yunai-flower-like.mp3`。
- 结构建议：前缀使用角色名（如 `yunai-`）；同主题多条使用序号结尾（如 `yunai-angry-1.mp3`、`yunai-angry-2.mp3`）。
- 可选目录结构：将角色放入子目录（如 `/audio/voice/yunai/angry-1.mp3`），需同步更新 `lib/voice.ts` 与 `opening-lines.json`。

### D. 迁移步骤（Checklist）

- 盘点：列出实际存在的音频（`public/audio/voice/`）与所有引用处（`lib/voice.ts`、`public/opening-lines.json`）。
- 对照表：为旧文件名→新文件名建立唯一映射（建议保存在 `docs/` 便于 review）。
- 批量重命名：在本地将 mp3 文件重命名为安全名；如采用子目录结构，同步移动位置。
- 同步引用：
  - 更新 `lib/voice.ts` 返回的路径常量（见 A 节“关键位置”）；
  - 更新 `public/opening-lines.json` 的 `voice` 字段路径；
  - 如有其他手写引用，统一替换。
- 验证：
  - 本地 `npm run build && npm start`；
  - 浏览器直访重命名后的音频 URL（应 200）；
  - 实测开场白与 `change` 触发的怒语能正常播放；
  - 若配置了 `NEXT_PUBLIC_BASE_URL`，在子路径下再走一遍自测。

### E. 当前仓库中被使用的音频（需重点同步）

- change/怒语（随机 2 选 1）：
  - `/audio/voice/angry1.mp3`
  - `/audio/voice/angry2.mp3`
- 开场白 4 条：
  - `/audio/voice/udon.mp3`
  - `/audio/voice/outfit.mp3`
  - `/audio/voice/what.mp3`
  - `/audio/voice/mood.mp3`
- 其他被映射的语音（片段匹配）：
  - `/audio/voice/happytalk.mp3`
  - `/audio/voice/flowerpick.mp3`
  - `/audio/voice/happytalk2.mp3`
  - `/audio/voice/hot.mp3`
  - `/audio/voice/liketaste.mp3`
  - `/audio/voice/sweet.mp3`
  - `/audio/voice/cake.mp3`
  - `/audio/voice/cakehalf.mp3`
  - `/audio/voice/dislike2.mp3`
  - `/audio/voice/dislike1.mp3`
  - `/audio/voice/selfintroduce.mp3`
  - `/audio/voice/flowerlike.mp3`
  -`/audio/voice/warmudon.mp3`
  -`/audio/voice/yes.mp3`
  -`/audio/voice/ei.mp3`