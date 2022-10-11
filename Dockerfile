FROM node:alpine as build

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY prisma/schema.prisma .

RUN yarn --frozen-lockfile

COPY . .

RUN yarn build

FROM node:alpine

ENV PORT 3000
EXPOSE 3000

WORKDIR /usr/src/app

COPY --from=build /app .
COPY docker_start.sh .

ENTRYPOINT [ "./docker_start.sh" ]
