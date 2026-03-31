import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBYWIKfjBNauhjUZ6QXKTw-fhyLv49b-cA';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateProposalContent(data) {
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Error al generar contenido con IA: ' + error.message);
  }
}
