FROM node:boron

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json bower.json .bowerrc /usr/src/app/
RUN yarn

COPY . /usr/src/app

RUN npm run config -- -df

ENV DEBUG=rallly
EXPOSE 3000
CMD ["node", "./bin/www"]
