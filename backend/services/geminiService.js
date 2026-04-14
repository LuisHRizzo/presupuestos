import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;

if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
  } catch (e) {
    console.error('Error initializing Gemini:', e.message);
  }
}

function generateFallbackContent(data) {
  const { project, scope, outOfScope, solution, totals, modalidad } = data;
  const esIOTEC = modalidad === 'IOTEC';

  return `
## Resumen Ejecutivo

Presentamos nuestra propuesta comercial para el proyecto "${project.name || 'Sin nombre'}", diseñada para cumplir con los objetivos establecidos y entregar una solución técnica de alta calidad por parte del equipo IOTEC / 01Infinito.

## Descripción de la Solución

${solution || 'Se propone una solución integral adaptada a las necesidades del proyecto.'}

## Beneficios Principales

- **Profesionalismo**: Equipo técnico especializado con experiencia comprobada en el rubro.
- **Equipamiento certificado**: Todos los productos cuentan con garantía de fábrica.
- **Escalabilidad**: Sistema diseñado para adaptarse a futuras ampliaciones.
${esIOTEC
  ? '- **Soporte Integral IOTEC**: Asistencia técnica completa, configuración, puesta en marcha y soporte post-instalación incluidos.\n- **Metodología IOTEC**: Proceso documentado, entrega con acta de conformidad y seguimiento.'
  : '- **Entrega rápida**: Modalidad de venta directa, sin instalación incluida.'}

## Alcances del Proyecto

${scope || 'No especificados'}

## Fuera de Alcances

${outOfScope || 'No especificado'}

---
*Propuesta elaborada el ${new Date().toLocaleDateString('es-AR')}*
*Total propuesta: ${totals.total}*
`;
}

export async function generateProposalContent(data) {
  if (!genAI) {
    console.warn('Gemini API key no configurada. Usando contenido de fallback.');
    return generateFallbackContent(data);
  }

  const { project, scope, outOfScope, solution, items, totals, modalidad } = data;
  const esIOTEC = modalidad === 'IOTEC';

  const itemsList = items.map(item =>
    `- ${item.descripcion} (Cant: ${item.quantity}): ${item.precioFinal ?? ((item.precioUnit + item.ivaAmount) * item.quantity).toFixed(2)}`
  ).join('\n');

  const clausulasSoporte = esIOTEC
    ? `Modalidad: METODOLOGÍA IOTEC. El presupuesto incluye soporte técnico integral, configuración, puesta en marcha, capacitación básica al usuario y soporte post-instalación. Se emite acta de conformidad al cierre del proyecto.`
    : `Modalidad: VENTA RÁPIDA. El presupuesto incluye exclusivamente el suministro de equipos. No incluye instalación, configuración ni soporte post-venta. El soporte queda a cargo del instalador contratante.`;

  const prompt = `
Eres el asistente comercial de IOTEC / 01Infinito, empresa especializada en soluciones de seguridad electrónica, domótica e infraestructura tecnológica para instaladores y el gremio.

Dados los siguientes datos de una propuesta comercial:

## Datos del Proyecto
- Nombre: ${project.name || 'Sin nombre'}
- Descripción: ${project.description || 'Sin descripción'}

## Modalidad de Venta
${clausulasSoporte}

## Alcances del Proyecto
${scope || 'No especificado'}

## Fuera de Alcances
${outOfScope || 'No especificado'}

## Solución Técnica Propuesta
${solution || 'No especificado'}

## Items del Presupuesto
${itemsList}

## Totales
- Subtotal: ${totals.subtotal}
- IVA: ${totals.iva}
- TOTAL: ${totals.total}

Genera una propuesta comercial profesional con estas secciones exactas:
1. **Resumen Ejecutivo** (2-3 oraciones atractivas, orientadas a ventas)
2. **Descripción de la Solución** (basado en los datos proporcionados, técnico pero accesible)
3. **Beneficios Principales** (lista de 4-5 beneficios concretos del proyecto)
4. **Cláusulas de Soporte** (adapta el texto según la modalidad: IOTEC o Venta Rápida)

Usa un tono profesional y orientado a generar confianza. El contenido debe ser conciso y en español rioplatense.
NO incluyas bloques de código Mermaid ni diagramas técnicos. Solo texto.
`;

  async function getAIResponse(prompt, data) {
  // Definimos la jerarquía de modelos para 2026
  const modelTierList = [
    'gemini-3.1-pro',       // Opción A: Máxima inteligencia (Real Risk, lógica compleja)
    'gemini-3.1-flash-lite' // Opción B: Más ligero y con mayor disponibilidad
  ];

  for (const modelName of modelTierList) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      // Opcional: Podrías añadir un timeout aquí si la API tarda demasiado
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      return result.response.text();

    } catch (error) {
      const isServiceUnavailable = error.message.includes('503') || error.message.includes('high demand');
      
      if (isServiceUnavailable) {
        console.warn(`⚠️ Modelo ${modelName} saturado. Intentando con el siguiente en la lista...`);
        continue; // Salta a la siguiente iteración del bucle (Opción B)
      }

      // Si el error no es de saturación (ej. error de red o de API Key), lo logueamos y cortamos
      console.error(`❌ Error crítico en ${modelName}:`, error.message);
      break; 
    }
  }

  // Si llegamos aquí es porque todos los modelos fallaron o hubo un error no recuperable
  console.error('🚨 Todos los modelos de Gemini fallaron. Ejecutando generador de emergencia.');
  return generateFallbackContent(data);
}
}
