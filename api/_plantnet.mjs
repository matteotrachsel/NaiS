// Geteilte Proxy-Logik für die PlantNet-Erkennung.
// Wird sowohl von der Vercel-Function (api/identify.js) als auch von der
// Vite-Dev-Middleware (vite.config.ts) genutzt.
//
// Der API-Key liegt ausschliesslich serverseitig (Umgebungsvariable
// PLANTNET_API_KEY) – er gelangt nie ins Client-Bundle oder ins Repo.

const PLANTNET_ENDPOINT = 'https://my-api.plantnet.org/v2/identify/all';

/**
 * Sendet ein (Base64-)Bild serverseitig an PlantNet und gibt Status + Rohtext
 * zurück. Direkte Browser-Aufrufe scheitern an PlantNets 403 für Cross-Origin;
 * dieser Proxy sendet ohne Origin-Header.
 *
 * @param {{ imageBase64?: string, organ?: string }} input
 * @returns {Promise<{ status: number, body: string }>}
 */
export async function identify({ imageBase64, organ } = {}) {
  const key = process.env.PLANTNET_API_KEY;
  if (!key) {
    return {
      status: 500,
      body: JSON.stringify({ error: 'PLANTNET_API_KEY ist nicht gesetzt.' }),
    };
  }
  if (!imageBase64) {
    return { status: 400, body: JSON.stringify({ error: 'Kein Bild übergeben.' }) };
  }

  const buffer = Buffer.from(imageBase64, 'base64');
  const form = new FormData();
  form.append('organs', organ || 'auto');
  form.append('images', new Blob([buffer], { type: 'image/jpeg' }), 'photo.jpg');

  const url =
    `${PLANTNET_ENDPOINT}?api-key=${encodeURIComponent(key)}` +
    `&lang=de&nb-results=6&include-related-images=false`;

  const res = await fetch(url, { method: 'POST', body: form });
  const body = await res.text();
  return { status: res.status, body };
}
