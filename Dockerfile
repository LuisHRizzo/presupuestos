# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY vite.config.js ./

# Install frontend deps
RUN npm install

# Copy source
COPY public ./public
COPY index.html .
COPY src ./src

# Build
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

# Install nginx for serving static files
RUN apk add --no-cache nginx

# Create app directory
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma

# Install backend deps
WORKDIR /app/backend
RUN npm install

# Copy backend source (excluding node_modules)
COPY backend/server.js ./backend/
COPY backend/controllers ./backend/controllers
COPY backend/services ./backend/services

# Restore working directory
WORKDIR /app

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist ./dist

# Create nginx config directory
RUN mkdir -p /etc/nginx/http.d

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Expose port
EXPOSE 80

# Start nginx and node
CMD sh -c "node backend/server.js & nginx -g 'daemon off;'"
