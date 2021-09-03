FROM node:16-alpine as base
ARG UID=1000
WORKDIR /app
ADD package.json ./
RUN yarn install

ADD ./public ./public
ADD ./src ./src

FROM base as development

CMD ["yarn", "start"]