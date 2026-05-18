FROM node:26-alpine3.23 AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:26-alpine3.23 AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:26-alpine3.23
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app

CMD npm run build ; npm run start