import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// SERVICE ITEMS
// ─────────────────────────────────────────────
export async function listServices(req, res) {
  try {
    const services = await prisma.serviceItem.findMany({
      where: { activo: true },
      orderBy: { tipo: 'asc' }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createService(req, res) {
  try {
    const { codigo, descripcion, tipo, precio, unidad } = req.body;

    if (!codigo || !descripcion || !tipo || precio === undefined || !unidad) {
      return res.status(400).json({ error: 'Faltan campos requeridos: codigo, descripcion, tipo, precio, unidad' });
    }

    const service = await prisma.serviceItem.create({
      data: { codigo, descripcion, tipo, precio: parseFloat(precio), unidad }
    });
    res.status(201).json(service);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: `Ya existe un servicio con código "${req.body.codigo}"` });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.precio) data.precio = parseFloat(data.precio);
    const service = await prisma.serviceItem.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteService(req, res) {
  try {
    const { id } = req.params;
    await prisma.serviceItem.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ─────────────────────────────────────────────
// KITS
// ─────────────────────────────────────────────
export async function listKits(req, res) {
  try {
    const kits = await prisma.kit.findMany({
      where: { activo: true },
      include: {
        items: {
          include: {
            product: { select: { id: true, codigo: true, descripcion: true, precioPartner: true, iva: true } },
            service: { select: { id: true, codigo: true, descripcion: true, precio: true, unidad: true } }
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(kits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createKit(req, res) {
  try {
    const { nombre, descripcion, items } = req.body;

    if (!nombre) return res.status(400).json({ error: 'El nombre del kit es requerido' });

    const kit = await prisma.kit.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        items: {
          create: (items || []).map(item => ({
            cantidad: item.cantidad || 1,
            productId: item.productId || null,
            serviceId: item.serviceId || null
          }))
        }
      },
      include: { items: { include: { product: true, service: true } } }
    });
    res.status(201).json(kit);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: `Ya existe un kit con nombre "${req.body.nombre}"` });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function deleteKit(req, res) {
  try {
    const { id } = req.params;
    await prisma.kit.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ─────────────────────────────────────────────
// SEED de servicios tabulados IOTEC
// ─────────────────────────────────────────────
export async function seedServices(req, res) {
  const serviciosDefault = [
    { codigo: 'SRV-SOP-5H',  descripcion: 'Pack Soporte Básico 5 horas',             tipo: 'HORAS_SOPORTE',       precio: 0, unidad: 'pack' },
    { codigo: 'SRV-SOP-20H', descripcion: 'Pack Soporte Avanzado 20 horas',           tipo: 'HORAS_SOPORTE',       precio: 0, unidad: 'pack' },
    { codigo: 'SRV-ING-H',   descripcion: 'Hora de Ingeniería y Desarrollo',          tipo: 'INGENIERIA',          precio: 0, unidad: 'hora' },
    { codigo: 'SRV-INST-JOR',descripcion: 'Jornada de Instalación (8hs)',             tipo: 'JORNADA_INSTALACION', precio: 0, unidad: 'jornada' },
    { codigo: 'SRV-INST-MED',descripcion: 'Media Jornada de Instalación (4hs)',       tipo: 'JORNADA_INSTALACION', precio: 0, unidad: 'media jornada' },
    { codigo: 'SRV-PUESTA',  descripcion: 'Puesta en Marcha y Configuración',         tipo: 'INGENIERIA',          precio: 0, unidad: 'servicio' },
    { codigo: 'SRV-CAP-H',   descripcion: 'Hora de Capacitación al Usuario',          tipo: 'INGENIERIA',          precio: 0, unidad: 'hora' },
  ];

  const results = { creados: 0, existentes: 0 };

  for (const s of serviciosDefault) {
    const existing = await prisma.serviceItem.findUnique({ where: { codigo: s.codigo } });
    if (!existing) {
      await prisma.serviceItem.create({ data: s });
      results.creados++;
    } else {
      results.existentes++;
    }
  }

  res.json({ success: true, ...results });
}
