// seed.mjs — Seed idempotente de servicios IOTEC
// Se ejecuta una vez en el arranque del contenedor

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const servicios = [
  { codigo: 'SRV-SOP-5H',   descripcion: 'Pack Soporte Básico 5 horas',       tipo: 'HORAS_SOPORTE',       precio: 0, unidad: 'pack'          },
  { codigo: 'SRV-SOP-20H',  descripcion: 'Pack Soporte Avanzado 20 horas',     tipo: 'HORAS_SOPORTE',       precio: 0, unidad: 'pack'          },
  { codigo: 'SRV-ING-H',    descripcion: 'Hora de Ingeniería y Desarrollo',    tipo: 'INGENIERIA',          precio: 0, unidad: 'hora'          },
  { codigo: 'SRV-INST-JOR', descripcion: 'Jornada de Instalación (8hs)',       tipo: 'JORNADA_INSTALACION', precio: 0, unidad: 'jornada'       },
  { codigo: 'SRV-INST-MED', descripcion: 'Media Jornada de Instalación (4hs)',tipo: 'JORNADA_INSTALACION', precio: 0, unidad: 'media jornada'  },
  { codigo: 'SRV-PUESTA',   descripcion: 'Puesta en Marcha y Configuración',  tipo: 'INGENIERIA',          precio: 0, unidad: 'servicio'      },
  { codigo: 'SRV-CAP-H',    descripcion: 'Hora de Capacitación al Usuario',   tipo: 'INGENIERIA',          precio: 0, unidad: 'hora'          },
];

let creados = 0;
for (const s of servicios) {
  const exists = await prisma.serviceItem.findUnique({ where: { codigo: s.codigo } });
  if (!exists) {
    await prisma.serviceItem.create({ data: s });
    creados++;
  }
}

console.log(`✅ Servicios IOTEC listos. Nuevos: ${creados}`);
await prisma.$disconnect();
