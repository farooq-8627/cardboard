FROM node:20-slim

WORKDIR /app

# Install curl for healthcheck and other build dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Vite globally
RUN npm install -g vite

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=production
ENV PATH /app/node_modules/.bin:$PATH
RUN npm run build:client && npm run build:server

# Clean up dev dependencies
RUN npm prune --production --legacy-peer-deps

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"] 