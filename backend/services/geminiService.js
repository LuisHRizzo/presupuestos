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

/**
 * Jerarquía de modelos con fallback inteligente.
 * Si un modelo no existe (404) o está saturado (503/429), salta al siguiente.
 */
async function getAIResponse(prompt, data) {
  // Nombres de modelos actualizados para máxima compatibilidad
  const modelTierList = [
    'gemini-1.5-pro-latest',   // El más estable y potente para lógica compleja
    'gemini-1.5-flash-latest', // El balance perfecto entre velocidad y costo
    'gemini-2.0-flash'         // Opción moderna de alta disponibilidad
  ];

  for (const modelName of modelTierList) {
    try {
      console.log(`🤖 Intentando generar propuesta con: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const text = result.response.text();
      console.log(`✅ Propuesta generada con éxito usando ${modelName}`);
      return text;

    } catch (error) {
      const errorMsg = error.message;
      
      // Definimos qué errores nos permiten saltar al siguiente modelo
      const shouldRetryWithNext = 
        errorMsg.includes('503') ||          // Service Unavailable
        errorMsg.includes('429') ||          // Rate Limit
        errorMsg.includes('404') ||          // Model Not Found (el error que tenías)
        errorMsg.includes('high demand');

      if (shouldRetryWithNext) {
        console.warn(`⚠️ El modelo ${modelName} no está disponible (${errorMsg.substring(0, 50)}...).`);
        continue; // Prueba el siguiente modelo de la lista
      }

      // Si es un error de API KEY o permisos, no servirá de nada probar otros modelos
      console.error(`❌ Error crítico no recuperable en ${modelName}:`, errorMsg);
      break; 
    }
  }

  console.error('🚨 Todos los modelos de la nube fallaron o no fueron encontrados. Usando generador de emergencia local.');
  return generateFallbackContent(data);
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
Eres el asistente comercial de IOTEC / 01Infinito, empresa especializada en soluciones de seguridad electrónica y domótica.

Genera una propuesta comercial profesional basada en estos datos:

## Datos del Proyecto
- Nombre: ${project.name || 'Sin nombre'}
- Descripción: ${project.description || 'Sin descripción'}

## Modalidad de Venta
${clausulasSoporte}

## Alcances
${scope || 'No especificado'}

## Fuera de Alcances
${outOfScope || 'No especificado'}

## Solución Técnica
${solution || 'No especificado'}

## Items
${itemsList}

## Totales
- Subtotal: ${totals.subtotal}
- IVA: ${totals.iva}
- TOTAL: ${totals.total}

Genera el contenido con estas secciones:
1. Resumen Ejecutivo
2. Descripción de la Solución
3. Beneficios Principales (lista de 4-5 items)
4. Cláusulas de Soporte

Usa español rioplatense, tono profesional y NO incluyas diagramas Mermaid.
`;

  return getAIResponse(prompt, data);
}