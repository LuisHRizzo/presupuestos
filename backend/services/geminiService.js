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
  const { project, scope, outOfScope, solution, totals } = data;
  
  return `
## Resumen Ejecutivo

Presentamos nuestra propuesta comercial para el proyecto "${project.name || 'Sin nombre'}", diseñada para cumplir con los objetivos establecidos y entregar una solución técnica de alta calidad.

## Descripción de la Solución

${solution || 'Se propone una solución integral adaptada a las necesidades del proyecto.'}

## Beneficios Principales

- **Profesionalismo**: Equipo técnico especializado con experiencia comprovada
- **Soporte continuo**: Asistencia técnica durante y después de la implementación
- **Garantía**: Cobertura de garantía sobre todos los componentes instalados
- **Escalabilidad**: Sistema diseñado para adaptarse a futuras expansión

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
  // If no API key, return fallback content
  if (!genAI) {
    return generateFallbackContent(data);
  }
  
  const { project, scope, outOfScope, solution, items, totals } = data;
  
  const itemsList = items.map(item => 
    `- ${item.descripcion} (Cant: ${item.quantity}): $${((item.precioUnit + item.ivaAmount) * item.quantity).toFixed(2)}`
  ).join('\n');
  
  const prompt = `
Eres un asistente comercial especializado en generar propuestas técnicas profesionales.

Dados los siguientes datos de una propuesta comercial:

## Datos del Proyecto
- Nombre: ${project.name || 'Sin nombre'}
- Descripción: ${project.description || 'Sin descripción'}

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

Genera una propuesta comercial completa y profesional con las siguientes secciones:
1. **Resumen Ejecutivo** (2-3 oraciones attractivas)
2. **Descripción de la Solución** (basado en lo proporcionado)
3. **Beneficios Principales** (lista de 4-5 beneficios clave)
4. **Sugerencia de Diagrama** - Proporciona código Mermaid que ilustre la arquitectura de la solución propuesta (puede ser un diagrama de flujo, arquitectura de red, o diagrama de componentes)

Usa un tono profesional, orientado a ventas. El contenido debe ser detallado pero conciso.
`;

  try {
    // Use v1 API explicitly
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash'
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    return result.response.text();
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    // Return fallback content on error
    return generateFallbackContent(data);
  }
}
