// Vercel Serverless Function: /api/firestore?collection=observations|zonen
// GET  -> Dokumente lesen
// POST -> Dokument anlegen (JSON-Body = das Objekt)
import { fsCreate, fsList } from './_firestore.mjs';

const ERLAUBT = new Set(['observations', 'zonen']);

export default async function handler(req, res) {
  const collection = String((req.query && req.query.collection) || '');
  if (!ERLAUBT.has(collection)) {
    res.status(400).json({ error: 'Unbekannte Collection.' });
    return;
  }
  try {
    if (req.method === 'GET') {
      const { status, body } = await fsList(collection, 300);
      res.status(status).setHeader('content-type', 'application/json').send(body);
    } else if (req.method === 'POST') {
      const obj =
        typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { status, body } = await fsCreate(collection, obj);
      res.status(status).setHeader('content-type', 'application/json').send(body);
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
