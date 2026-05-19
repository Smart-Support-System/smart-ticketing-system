FROM node:26-alpine3.23
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["node", "dist/main"]