FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source.
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
