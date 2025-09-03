# Runtime-only image for Next.js using prebuilt .next artifact
FROM node:20-bullseye-slim

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev && npm cache clean --force

# App runtime files required by Next at start time
COPY next.config.mjs ./
COPY public ./public

# Bring in the prebuilt artifact; Docker will auto-extract the tarball
# The artifact is uploaded at the build context root on server
ADD next-node-artifact.tgz /app/

EXPOSE 3000

# Use the local Next binary to serve the prebuilt output
# Bind to 0.0.0.0 to allow external connections in Docker
CMD ["npm", "run", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
