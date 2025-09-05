# Minimal runtime for Next.js standalone output
FROM node:20-bullseye-slim

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Bring in the prebuilt standalone artifact; Docker will auto-extract the tarball
# Expectation: dist/next-standalone.tgz exists in the build context
ADD dist/next-standalone.tgz /app/

EXPOSE 3000

# Start the standalone server directly (no Next CLI or npm install needed)
CMD ["node", ".next/standalone/server.js"]
