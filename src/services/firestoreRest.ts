/**
 * Dünner Client für den eigenen Firestore-Proxy `/api/firestore`.
 *
 * Der Browser spricht NUR die eigene Domain an – Google wird ausschliesslich
 * serverseitig (Vercel-Function / Vite-Dev-Middleware) kontaktiert. Das umgeht
 * das Blockieren des API-Keys gegenüber `googleapis.com` durch
 * Browser-Erweiterungen/Proxys und hält den Key serverseitig.
 *
 * Kodierung/Dekodierung der Firestore-Werte passiert im Proxy
 * (api/_firestore.mjs); hier werden nur einfache JSON-Objekte ausgetauscht.
 */

const ENDPOINT = '/api/firestore';

async function fehlerDetail(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: { message?: string } | string };
    const msg =
      typeof j.error === 'string' ? j.error : j.error?.message ? j.error.message : '';
    return msg ? ` – ${msg}` : '';
  } catch {
    return '';
  }
}

export async function restCreate(
  collection: string,
  obj: Record<string, unknown>,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?collection=${encodeURIComponent(collection)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obj),
    });
  } catch {
    throw new Error('Keine Verbindung zum Server. Internet prüfen und erneut versuchen.');
  }
  if (!res.ok) {
    const detail = await fehlerDetail(res);
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Speichern abgelehnt (HTTP ${res.status})${detail}.`);
    }
    throw new Error(`Speichern fehlgeschlagen (HTTP ${res.status})${detail}.`);
  }
}

export async function restList(
  collection: string,
  // max wird serverseitig begrenzt; Signatur bleibt kompatibel.
  _max = 300,
): Promise<Array<{ id: string } & Record<string, unknown>>> {
  void _max;
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?collection=${encodeURIComponent(collection)}`);
  } catch {
    throw new Error('Keine Verbindung zum Server.');
  }
  if (!res.ok) {
    throw new Error(`Laden fehlgeschlagen (HTTP ${res.status})${await fehlerDetail(res)}.`);
  }
  const data = (await res.json()) as {
    documents?: Array<{ id: string } & Record<string, unknown>>;
  };
  return data.documents ?? [];
}
