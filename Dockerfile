FROM node:20-slim

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY server ./server
COPY shared ./shared

# Build TypeScript files
RUN npm install -g tsx

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose the port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/ || exit 1

# Start the server
CMD ["tsx", "server/websocket-server.ts"] 