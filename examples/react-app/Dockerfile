FROM node:16-alpine as base
WORKDIR /app
ADD package.json ./
RUN yarn install
ADD ./public ./public
ADD ./src ./src
CMD ["yarn", "start"]