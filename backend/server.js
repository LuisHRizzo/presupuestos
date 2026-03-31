import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { processImport } from './controllers/importController.js';
import { searchProducts } from './controllers/quoteController.js';
import { generateQuotePDF } from './services/pdfService.js';
import { generateProposalPDF } from './services/proposalPdfService.js';
import { generateProposalContent } from './services/geminiService.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Set up Multer for memory storage, to process it directly
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

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

app.post('/api/quote/generate-pdf', async (req, res) => {
  try {
    const { items, client } = req.body;
    const pdfBlob = generateQuotePDF({ items, client });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=presupuesto.pdf');
    res.send(pdfBlob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/proposal/generate', async (req, res) => {
  try {
    const { project, scope, outOfScope, solution, items, totals } = req.body;
    
    const aiContent = await generateProposalContent({
      project, scope, outOfScope, solution, items, totals
    });
    
    const pdfBlob = generateProposalPDF({
      project, scope, outOfScope, solution, items, totals, aiContent
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=propuesta.pdf');
    res.send(pdfBlob);
  } catch (error) {
    console.error('Error generating proposal:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
