FROM node:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install -q

COPY . /usr/src/app

RUN npm run config -- -d

ENV DEBUG=rallly
EXPOSE 3000
CMD ["node", "./bin/www"]
