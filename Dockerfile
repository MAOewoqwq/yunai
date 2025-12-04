# Minimal runtime for Next.js standalone output
FROM node:20-bullseye-slim

ENV NODE_ENV=production \
    PORT=3000 \
    UPLOAD_DIR=/app/.next/standalone/public/uploads \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Bring in the prebuilt standalone artifact; Docker will auto-extract the tarball
# Expectation: dist/next-standalone.tgz exists in the build context
ADD dist/next-standalone.tgz /app/

EXPOSE 3000

# Basic container healthcheck (requires only Node stdlib)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3000;const req=http.request({host:'127.0.0.1',port,path:'/',method:'GET'},res=>{process.exit(res.statusCode>=200&&res.statusCode<500?0:1)});req.on('error',()=>process.exit(1));req.end();"

# Start the standalone server directly (no Next CLI or npm install needed)
CMD ["node", ".next/standalone/server.js"]
