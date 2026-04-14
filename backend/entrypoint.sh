#!/bin/sh
set -e

echo "========================================"
echo "  IOTEC Backend — Arranque del contenedor"
echo "========================================"

# 1. Sincronizar schema de Prisma con la BD SQLite
echo ""
echo "📦 Aplicando schema de base de datos..."
npx prisma db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss

# 2. Seed de servicios tabulados IOTEC (idempotente)
echo ""
echo "🌱 Verificando servicios IOTEC en la base de datos..."
node seed.mjs

# 3. Arrancar el servidor Node.js
echo ""
echo "🚀 Servidor IOTEC iniciando en puerto 3001..."
exec node server.js
