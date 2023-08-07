FROM node:18

WORKDIR /

COPY . .
RUN yarn install && yarn client-build

CMD ["yarn", "server-start"]