FROM node:8.9-alpine

ARG dev

RUN if [ "$dev" = "true" ] ; then npm install -g nodemon ; fi;

RUN npm install -g bower

RUN apk --update add git

USER node

WORKDIR /home/node

COPY package.json .

COPY package-lock.json .

COPY bower.json .

COPY .bowerrc .

RUN npm install --only=production

COPY . .

RUN npm run config -- -d

EXPOSE 3000

CMD ["node", "./bin/www"]
