# Dockerización del Proyecto - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear imagen Docker con todo el proyecto (frontend + backend) corriendo en un contenedor, con volumen para persistir la DB SQLite.

**Architecture:** Un contenedor con Nginx sirviendo frontend estático + proxy al backend Express. Volumen named para persistir base de datos.

**Tech Stack:** Docker, Nginx, Node.js

---

## Tareas

### Task 1: Crear Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Crear Dockerfile**

```dockerfile
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
```

---

### Task 2: Crear nginx.conf

**Files:**
- Create: `nginx.conf`

- [ ] **Step 1: Crear nginx.conf**

```nginx
server {
    listen 80;
    server_name localhost;

    # Serve static files from frontend build
    location / {
        root /app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # CORS headers for API
    location ~ ^/api/(.*)$ {
        proxy_pass http://localhost:3001/$1;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### Task 3: Crear .dockerignore

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Crear .dockerignore**

```
# Dependencies
node_modules/
backend/node_modules/

# Build outputs
dist/
backend/prisma/dev.db

# Development files
.git/
.gitignore
*.md
!README.md

# Test files
*.test.js
*.spec.js
__tests__/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

### Task 4: Actualizar configuración del backend para producción

**Files:**
- Modify: `backend/server.js`

- [ ] **Step 1: Agregar CORS y configuración de producción en server.js**

El servidor actual usa CORS permitir todo, pero como Nginx está en el mismo contenedor, el origen es el mismo. Verificar que no haya problemas de CORS.

En producción, el backend corre en localhost:3001 dentro del contenedor, accesible solo vía proxy de Nginx.

---

### Task 5: Crear docker-compose.yml (opcional pero recomendado)

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Crear docker-compose.yml**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:80"
    volumes:
      - db-data:/app/backend/prisma

volumes:
  db-data:
```

---

### Task 6: Build y test del contenedor

**Files:**
- N/A

- [ ] **Step 1: Build de la imagen**

```bash
docker build -t conversor-app .
```

- [ ] **Step 2: Run del contenedor**

```bash
docker run -d -p 3000:80 --name conversor conversor-app
```

- [ ] **Step 3: Verificar que funciona**

```bash
# Test frontend
curl http://localhost:3000

# Test API
curl http://localhost:3000/api/products/search?q=test
```

- [ ] **Step 4: Verificar persistencia de DB**

```bash
# Ver volumen
docker volume ls

# Inspect volumen
docker volume inspect conversor_db-data
```

---

## Verificación

- [ ] Imagen build correctamente
- [ ] Contenedor levanta sin errores
- [ ] Frontend accesible en puerto 3000
- [ ] API responde en /api/*
- [ ] DB persiste entre rebuilds
