import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function searchProducts(query) {
  if (!query || query.length < 2) return [];

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { descripcion: { contains: query } },
        { codigo: { contains: query } },
        { marca: { contains: query } }
      ]
    },
    take: 10,
    select: {
      id: true,
      codigo: true,
      descripcion: true,
      marca: true,
      precioPartner: true,
      iva: true
    }
  });

  return products;
}