部署说明（Next.js 14）

一、两种部署方式

1) Node 运行时（推荐，功能完整）
- 服务器需要 Node.js 18+。
- 上传以下文件/目录：`.next/`、`public/`、`package.json`、`package-lock.json`、`next.config.mjs`、`tsconfig.json`。
- 或直接使用已打包好的压缩包：`dist/next-node-artifact.tgz`。
- 服务器上执行：
  - `tar -xzf dist/next-node-artifact.tgz`
  - `npm ci --omit=dev`
  - `npm run start`（默认端口 3000，可用 `PORT=8080 npm run start` 指定端口）

2) 纯静态导出（仅在所有页面可静态化时）
- 在本机或服务器将 `next.config.mjs` 设置 `output: 'export'`，确保没有必须的服务端/动态特性。
- 执行：`npm run build && npx next export`，产物在 `out/`。
- 将 `out/` 部署到任意静态服务器（Nginx、CDN 等）。

二、环境变量
- 如需环境变量，复制 `env.example` 为 `.env` 或 `.env.production` 并在服务器设置相同变量。

三、常见问题
- 如果构建时出现沙盒相关 `EPERM` 报错，多为本地沙盒限制；服务器上执行构建不会受影响。
- 使用 Node 方式部署时，推荐反向代理（Nginx/Caddy）并启用缓存静态资源（`/_next/static`、`/static`、`/public`）。

四、Docker（Standalone）

- 构建打包：
  - `npm run pack:standalone`（脚本会将 `public/` 与 `.next/static` 复制到 `.next/standalone` 并打包为 `dist/next-standalone.tgz`）
- 构建镜像：
  - `docker build -t app .`
- 运行（持久化上传目录）：
  - `docker run -d --name app -p 3000:3000 -e DEEPSEEK_API_KEY=*** -v uploads:/app/.next/standalone/public/uploads app`
- 说明：Dockerfile 已设置 `ENV UPLOAD_DIR=/app/.next/standalone/public/uploads`，与上传/静态服务路径一致；上传接口会自动创建子目录（`bg/sprites/...`）。
