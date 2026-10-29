FROM node:26.12.1-bookworm-slim

ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY package.json ./
COPY . .

EXPOSE 8080

CMD ["npm", "start"]
