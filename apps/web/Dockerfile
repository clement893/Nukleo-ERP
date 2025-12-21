FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* yarn.lock* ./

# Install dependencies
RUN npm install -g pnpm && pnpm install || npm install || yarn install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* yarn.lock* ./

# Install production dependencies
RUN npm install -g pnpm && pnpm install --prod || npm install --production || yarn install --production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Start application
CMD ["npm", "start"]
