FROM mhart/alpine-node:latest

RUN npm install browserify uglifyjs pm2 -g

RUN mkdir -p /usr/src/app

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN apk add --no-cache git

RUN npm install && npm run prod && npm prune --production

EXPOSE 3001

CMD ["pm2", "start", "app.json", "--no-daemon"]
