import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-3.5-flash-lite';   

app.use(express.json());

// 1. Teks
app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

// Fungsi bantu untuk endpoint file
async function handleFile(req, res, defaultPrompt) {
  if (!req.file) {
    return res.status(400).json({ message: 'File belum diunggah.' });
  }
  const { prompt } = req.body;
  const base64 = req.file.buffer.toString('base64');
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt ?? defaultPrompt },
        { inlineData: { data: base64, mimeType: req.file.mimetype } },
      ],
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

// 2. Gambar
app.post('/generate-from-image', upload.single('image'), (req, res) =>
  handleFile(req, res, 'Tolong deskripsikan gambar berikut.')
);

// 3. Dokumen
app.post('/generate-from-document', upload.single('document'), (req, res) =>
  handleFile(req, res, 'Tolong buat ringkasan dari dokumen berikut.')
);

// 4. Audio
app.post('/generate-from-audio', upload.single('audio'), (req, res) =>
  handleFile(req, res, 'Tolong buatkan transkrip dari rekaman berikut.')
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));