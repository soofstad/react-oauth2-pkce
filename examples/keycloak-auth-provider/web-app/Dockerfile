FROM node:18-alpine as base
WORKDIR /app
COPY package.json ./
RUN yarn install
COPY ./public ./public
COPY ./src ./src
CMD ["yarn", "start"]