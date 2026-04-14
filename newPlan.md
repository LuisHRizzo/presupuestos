# PRD: Sistema de Cotización Ágil - IOTEC / 01Infinito

## 1. Introducción y Visión
El objetivo de este proyecto es evolucionar una herramienta interna de cotización hacia un sistema profesional orientado a instaladores y gremio. El sistema debe permitir generar presupuestos rápidos (no "mega proyectos") con una lógica de precios basada en costos de distribuidor, aplicación de márgenes (markup) y diferenciación de servicios.

## 2. Contexto del Proyecto Actual (Base de Código)
El agente de IA debe analizar el repositorio existente que cuenta con:
* **Base de Datos:** SQLite.
* **Funcionalidades:** Ingesta de datos desde Excel, selector de productos y selector de markup.
* **Estado actual:** El módulo de "Propuesta Comercial" (salida final para el cliente) es deficiente o no funciona, y requiere una reingeniería completa.

## 3. Requerimientos Funcionales

### A. Ingesta y Gestión de Datos
- **Mapeo de Proveedores:** Mejorar la lógica de ingesta de Excel para soportar diversos formatos de distribuidores (Hikvision, Acubox, etc.).
- **Catálogo de Servicios:** Incorporar ítems no físicos en la base de datos:
    - Horas de Soporte (Tabuladas: 5h básica, 20h avanzada).
    - Horas de Ingeniería y Desarrollo.
    - Jornadas/Media Jornada de Instalación.
- **Kits Estandarizados:** Capacidad de agrupar productos (ej. Kit Domótica: Alarma + Cámara + Cerradura) para carga rápida.

### B. Lógica de Cotización
- **Doble Markup:** 1. **Markup IOTEC:** Margen de la empresa sobre el precio gremio.
    2. **Markup Instalador:** Campo editable para que el usuario final (instalador) agregue su ganancia.
- **Conceptos Adicionales:** Permitir agregar manualmente ítems de "Ferretería fina" o "Cableado" que no estén en el catálogo principal.
- **Sincronización:** Advertencia sobre variabilidad de precios según stock y disponibilidad de distribuidores.

### C. Generación de Propuesta Comercial (Prioridad Alta)
- **Reparación del Módulo:** Reemplazar o arreglar el generador actual.
- **Formato:** Generación de PDF profesional o vista web compartible.
- **Contenido Obligatorio:**
    - Resumen de la necesidad del cliente.
    - Solución técnica propuesta.
    - Desglose de equipamiento y servicios.
    - **Cláusulas de Soporte:** Diferenciar entre "Venta Rápida" (soporte limitado) y "Metodología IOTEC" (soporte integral).

## 4. Requerimientos Técnicos y Arquitectura
- **Auditoría de Código:** Antes de programar, la IA debe leer todos los archivos para entender la relación entre el cargador de Excel y la base SQLite.
- **Escalabilidad:** Preparar el sistema para una comparativa de plataformas (Hikvision local vs. Acubox Cloud/API).
- **Interfaz:** El flujo debe ser tipo "wizard" o "clic-clic" para garantizar agilidad en obra.

## 5. Roadmap de Implementación para la IA

### Fase 1: Diagnóstico y Refactorización
- Analizar el esquema de `sqlite` actual.
- Corregir errores de mapeo en la ingesta de Excel.

### Fase 2: Módulo de Servicios
- Implementar la lógica de carga de horas de ingeniería y jornadas de instalación.
- Crear la funcionalidad de "Kits".

### Fase 3: Motor de Propuestas
- Desarrollar la exportación a PDF de la propuesta comercial con diseño profesional.
- Implementar la lógica de ocultamiento de costos base (el cliente solo ve el precio final con markups).

## 6. Notas de Negocio para el Agente
- **Prioridad:** El sistema debe ahorrar tiempo ("pasito a pasito", enfocado en generar ingresos).
- **Filosofía:** Incentivar la "Metodología IOTEC". Si se vende un producto suelto, el presupuesto debe reflejar automáticamente que el soporte es limitado.