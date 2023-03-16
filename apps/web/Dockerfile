FROM node:16 AS builder

WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=@rallly/web --docker

FROM node:16 AS installer

WORKDIR /app
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn --network-timeout 1000000

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN yarn db:generate
RUN yarn build

FROM node:16 AS runner

WORKDIR /app

RUN yarn global add prisma
# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-start.sh ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/prisma ./prisma
 
COPY --from=installer /app/apps/web/next.config.js .
COPY --from=installer /app/apps/web/package.json .

ENV PORT 3000
EXPOSE 3000

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD ["./docker-start.sh"]
