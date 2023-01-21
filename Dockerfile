FROM node:lts as build

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY prisma/schema.prisma .

RUN yarn --frozen-lockfile --no-cache --production

COPY . .

RUN yarn build

FROM node:lts

ENV PORT 3000
EXPOSE 3000

WORKDIR /usr/src/app

COPY --from=build /app .
COPY docker-start.sh .

ENTRYPOINT ["./docker-start.sh"]
