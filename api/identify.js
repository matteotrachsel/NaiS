// Vercel Serverless Function: POST /api/identify
// Nimmt { imageBase64, organ } (JSON) entgegen und proxyt zu PlantNet.
import { identify } from './_plantnet.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    // req.body wird von Vercel bei application/json bereits geparst.
    const { imageBase64, organ } =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { status, body } = await identify({ imageBase64, organ });
    res.status(status).setHeader('content-type', 'application/json').send(body);
  } catch (e) {
    res
      .status(502)
      .json({ error: 'Proxy-Fehler', detail: e instanceof Error ? e.message : String(e) });
  }
}
