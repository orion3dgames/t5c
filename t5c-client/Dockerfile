FROM node:18-alpine

WORKDIR /

COPY . .
RUN yarn install && yarn client-build

CMD ["yarn", "server-start"]
