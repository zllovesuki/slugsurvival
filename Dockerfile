FROM mhart/alpine-node:latest

RUN apk add --no-cache git

RUN npm install pm2 -g

RUN mkdir -p /usr/src/app

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN cd $(npm root -g)/npm \
 && npm install fs-extra \
 && sed -i -e s/graceful-fs/fs-extra/ -e s/fs\.rename/fs.move/ ./lib/utils/rename.js \
 && cd /usr/src/app \
 && npm install \
 && npm run prod \
 && npm prune --production

EXPOSE 3001

CMD pm2 start app.json --no-daemon
