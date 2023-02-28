FROM node:lts as build

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY prisma/schema.prisma .

RUN yarn --frozen-lockfile --no-cache --production --network-timeout 1000000

COPY . .

RUN yarn build

FROM node:lts

ENV PORT 3000
EXPOSE 3000

WORKDIR /usr/src/app

COPY --from=build /app .
COPY ./scripts/docker-start.sh .

ENTRYPOINT ["./scripts/docker-start.sh"]
