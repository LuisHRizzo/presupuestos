# IOTEC / 01Infinito — Sistema de Cotización Ágil

Sistema interno para generación de presupuestos y propuestas comerciales profesionales para instaladores y el gremio.

---

## 🚀 Arranque rápido con Docker

### Primera vez (build completo)

```bash
# 1. Copiar el archivo de variables de entorno
cp .env.example .env

# 2. Editar .env y completar la API Key de Gemini (opcional)
# GEMINI_API_KEY=AIza...

# 3. Levantar todo
docker compose up --build
```

Listo. Acceder en **http://localhost:3000**

---

### Siguientes veces (si ya está buildeado)

```bash
docker compose up -d          # Levantar en background
docker compose down           # Apagar todo
docker compose restart        # Reiniciar
```

### Rebuild solo el backend (después de cambiar código)

```bash
docker compose up --build backend
```

### Rebuild solo el frontend

```bash
docker compose up --build frontend
```

---

## 🗄️ Base de Datos

- Usa **SQLite** — no requiere servidor de DB externo.
- Los datos persisten en un volumen Docker llamado `iotec_db-data`.
- En el primer arranque se aplica el schema automáticamente y se cargan los servicios IOTEC por defecto.

### Ver logs del backend (incluye detalles del arranque de DB)

```bash
docker compose logs -f backend
```

### Backup de la base de datos

```bash
docker compose exec backend sh -c "cp /app/data/prod.db /tmp/backup.db && cat /tmp/backup.db" > backup.db
```

---

## 🔑 Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `GEMINI_API_KEY` | API Key de Google Gemini (para generar propuestas con IA) | No (usa fallback sin ella) |

---

## 🛠️ Desarrollo local (sin Docker)

```bash
# Terminal 1 — Backend
cd backend
npm install
npx prisma db push
node seed.mjs         # Carga servicios IOTEC
npm run dev

# Terminal 2 — Frontend
npm install           # En la raíz del proyecto
npm run dev
```

Frontend: http://localhost:3000  
Backend:  http://localhost:3001

---

## 📁 Estructura del proyecto

```
conversor/
├── src/                    # Frontend (Vite + Vanilla JS)
│   ├── modules/
│   │   ├── quoteManager.js   # Lógica de cotización + doble markup
│   │   ├── wizardManager.js  # Wizard de propuesta comercial
│   │   └── uiManager.js      # Gestión de UI
│   └── styles/
│       ├── index.css         # Estilos base
│       └── iotec.css         # Design system IOTEC
├── backend/
│   ├── controllers/
│   │   ├── importController.js  # Importador multi-proveedor (BigDipper, Hikvision, Acubox)
│   │   ├── quoteController.js   # Búsqueda de productos
│   │   └── serviceController.js # CRUD de servicios y kits
│   ├── services/
│   │   ├── pdfService.js        # Generador de PDF profesional
│   │   └── geminiService.js     # Integración Google Gemini AI
│   ├── prisma/
│   │   └── schema.prisma        # Schema de BD (Product, ServiceItem, Kit)
│   ├── server.js
│   ├── seed.mjs                 # Seed de servicios IOTEC
│   └── entrypoint.sh            # Script de arranque del contenedor
├── Dockerfile.frontend          # Build de nginx + Vite
├── Dockerfile.backend           # Backend Node.js
├── docker-compose.yml           # Orquestación completa
├── nginx.conf                   # Proxy nginx → backend
└── .env.example                 # Plantilla de variables
```

---

## 📦 Proveedores soportados para importación de Excel

| Proveedor | Detección automática |
|---|---|
| BigDipper | Columna `Código` |
| Hikvision | Columna `Part Number` o `Part No` |
| Acubox | Columna `SKU` |
| Genérico | Cualquier tabla con 3+ columnas |
