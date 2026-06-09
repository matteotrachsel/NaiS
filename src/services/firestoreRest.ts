import { FIREBASE } from './firebase';

/**
 * Minimaler Firestore-REST-Client (ohne Firebase-SDK).
 *
 * Schreiben/Lesen je ein einzelner HTTPS-Request gegen
 * `firestore.googleapis.com`. Authentifizierung über den öffentlichen
 * API-Key (Request gilt als unauthentifiziert → greifen die Security-Rules
 * mit `request.auth == null`). Klare HTTP-Statuscodes statt undurchsichtiger
 * Transport-Hänger.
 */

function basis(): string {
  return `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents`;
}

// ── Wert-Kodierung (JS ↔ Firestore typed values) ────────────────────────
type FsValue = Record<string, unknown>;

function encodeValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === 'object') {
    return { mapValue: { fields: encodeFields(v as Record<string, unknown>) } };
  }
  return { stringValue: String(v) };
}

function encodeFields(obj: Record<string, unknown>): Record<string, FsValue> {
  const out: Record<string, FsValue> = {};
  for (const [k, val] of Object.entries(obj)) {
    if (val !== undefined) out[k] = encodeValue(val);
  }
  return out;
}

function decodeValue(v: any): unknown {
  if (v == null) return null;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields ?? {});
  return null;
}

function decodeFields(fields: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(fields)) out[k] = decodeValue(val);
  return out;
}

// ── Operationen ─────────────────────────────────────────────────────────

/** Legt ein Dokument in einer Collection an (Auto-ID). */
export async function restCreate(
  collection: string,
  obj: Record<string, unknown>,
): Promise<void> {
  const url = `${basis()}/${collection}?key=${encodeURIComponent(FIREBASE.apiKey ?? '')}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: encodeFields(obj) }),
    });
  } catch {
    throw new Error('Keine Verbindung zur Datenbank. Internet prüfen und erneut versuchen.');
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      'Speichern abgelehnt (Firestore-Regeln/API-Key). Eingabe oder Regeln prüfen.',
    );
  }
  if (!res.ok) {
    throw new Error(`Speichern fehlgeschlagen (HTTP ${res.status}). Bitte erneut versuchen.`);
  }
}

/** Liest bis zu `max` Dokumente einer Collection. */
export async function restList(
  collection: string,
  max = 300,
): Promise<Array<{ id: string } & Record<string, unknown>>> {
  const url = `${basis()}/${collection}?key=${encodeURIComponent(
    FIREBASE.apiKey ?? '',
  )}&pageSize=${max}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('Keine Verbindung zur Datenbank.');
  }
  if (!res.ok) {
    throw new Error(`Laden fehlgeschlagen (HTTP ${res.status}).`);
  }
  const data = (await res.json()) as { documents?: Array<{ name: string; fields?: Record<string, any> }> };
  return (data.documents ?? []).map((d) => ({
    id: String(d.name).split('/').pop() ?? '',
    ...decodeFields(d.fields ?? {}),
  }));
}
