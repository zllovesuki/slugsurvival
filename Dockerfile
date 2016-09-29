FROM mhart/alpine-node:latest

RUN apk add --no-cache git

RUN npm install pm2 -g

RUN mkdir -p /usr/src/app

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN npm install && npm run prod && npm prune --production && rm -rf .git

EXPOSE 3001

CMD ["pm2", "start", "app.json", "--no-daemon"]
