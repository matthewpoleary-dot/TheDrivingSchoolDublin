# Production-parity build.
#
# Exists so "it works on my machine" is never the evidence that a change is
# safe. This mirrors the deployed runtime: a clean install from the lockfile,
# a real production build, and a non-root user, on the Node version Vercel
# runs. If it builds and serves here, it will build and serve there.
#
#   docker build -t tds .
#   docker run --rm -p 3000:3000 --env-file .env.local tds

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` fails if the lockfile disagrees with package.json, which is the
# check we want. `npm install` would paper over that difference.
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
