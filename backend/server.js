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
import { register, login, me } from './controllers/authController.js';
import { requireAuth } from './controllers/authMiddleware.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ─── Health check (sin auth — para Docker/Coolify) ─────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ─── AUTENTICACIÓN (rutas públicas) ────────────────────
app.post('/api/auth/register', register);
app.post('/api/auth/login',    login);
app.get('/api/auth/me',        requireAuth, me);

// ─── PRODUCTOS / CATÁLOGO (protegidos) ──────────────────
app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  try {
    const result = await processImport(req.file);
    res.json(result);
  } catch (error) {
    console.error('Error procesando archivo:', error);
    res.status(500).json({ error: 'Error procesando archivo: ' + error.message });
  }
});

app.get('/api/products/search', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    const products = await searchProducts(q);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── SERVICIOS TABULADOS (protegidos) ────────────────────
app.get('/api/services',          requireAuth, listServices);
app.post('/api/services',         requireAuth, createService);
app.put('/api/services/:id',      requireAuth, updateService);
app.delete('/api/services/:id',   requireAuth, deleteService);
app.post('/api/services/seed',    requireAuth, seedServices);

// ─── KITS (protegidos) ───────────────────────────────────
app.get('/api/kits',              requireAuth, listKits);
app.post('/api/kits',             requireAuth, createKit);
app.delete('/api/kits/:id',       requireAuth, deleteKit);

// ─── GENERACIÓN PDF (protegidos) ─────────────────────────
app.post('/api/quote/generate-pdf', requireAuth, async (req, res) => {
  try {
    const { items, client } = req.body;
    // Incluir agente del token en el PDF
    const agente = req.user;
    const pdfBuffer = generateQuotePDF({ items, client, agente });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=presupuesto.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/proposal/generate', requireAuth, async (req, res) => {
  try {
    const { project, scope, outOfScope, solution, items, totals, modalidad } = req.body;
    // Incluir agente del token autenticado
    const agente = req.user;

    const aiContent = await generateProposalContent({
      project, scope, outOfScope, solution, items, totals, modalidad
    });

    const pdfBuffer = generateProposalPDF({
      project, scope, outOfScope, solution, items, totals, aiContent, modalidad, agente
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
