import express from 'express';
import cors from 'cors';
import multer from 'multer';
import 'dotenv/config';
import { processImport } from './controllers/importController.js';
import { searchProducts } from './controllers/quoteController.js';
import { generateQuotePDF, generateProposalPDF } from './services/pdfService.js';
import { generateProposalContent } from './services/geminiService.js';
import {
  listServices, createService, updateService, deleteService, seedServices,
  listKits, createKit, deleteKit
} from './controllers/serviceController.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ─── PRODUCTOS / CATÁLOGO ───────────────────────
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  try {
    const result = await processImport(req.file);
    res.json(result);
  } catch (error) {
    console.error('Error procesando archivo:', error);
    res.status(500).json({ error: 'Error procesando archivo: ' + error.message });
  }
});

app.get('/api/products/search', async (req, res) => {
  try {
    const { q } = req.query;
    const products = await searchProducts(q);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── SERVICIOS TABULADOS ────────────────────────
app.get('/api/services',          listServices);
app.post('/api/services',         createService);
app.put('/api/services/:id',      updateService);
app.delete('/api/services/:id',   deleteService);
app.post('/api/services/seed',    seedServices);

// ─── KITS ───────────────────────────────────────
app.get('/api/kits',              listKits);
app.post('/api/kits',             createKit);
app.delete('/api/kits/:id',       deleteKit);

// ─── GENERACIÓN PDF ─────────────────────────────
app.post('/api/quote/generate-pdf', async (req, res) => {
  try {
    const { items, client } = req.body;
    const pdfBuffer = generateQuotePDF({ items, client });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=presupuesto.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/proposal/generate', async (req, res) => {
  try {
    const { project, scope, outOfScope, solution, items, totals, modalidad } = req.body;

    const aiContent = await generateProposalContent({
      project, scope, outOfScope, solution, items, totals, modalidad
    });

    const pdfBuffer = generateProposalPDF({
      project, scope, outOfScope, solution, items, totals, aiContent, modalidad
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=propuesta.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating proposal:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend IOTEC corriendo en http://localhost:${port}`);
});
