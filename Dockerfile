FROM node:18-alpine

LABEL maintainer="LasMinruk"
LABEL service="order-service"
LABEL version="1.0.0"

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 3003

USER node

CMD ["node", "server.js"]