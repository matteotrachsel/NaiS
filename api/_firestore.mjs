// Serverseitige Firestore-REST-Anbindung für den Proxy (api/firestore.js)
// und die Vite-Dev-Middleware. Spricht firestore.googleapis.com vom Server
// aus an – dadurch umgeht der Browser keine Google-Domain (kein Blockieren
// des API-Keys durch Erweiterungen/Proxys) und der Key bleibt serverseitig.
//
// Projekt/Key aus den (auch serverseitig verfügbaren) Env-Variablen.

// Entfernt ein evtl. vorangestelltes BOM/Zero-Width-Zeichen sowie
// umgebende Whitespaces – Env-Variablen können (z. B. via CLI/Pipe) ein
// BOM enthalten, das sonst die Projekt-ID/den Key ungültig macht
// (CONSUMER_INVALID / "permission denied on resource project").
function clean(v) {
  if (typeof v !== 'string') return v;
  let s = v.trim();
  // Führendes BOM (U+FEFF) bzw. Zero-Width-Space (U+200B) entfernen.
  while (s.length && (s.charCodeAt(0) === 0xfeff || s.charCodeAt(0) === 0x200b)) {
    s = s.slice(1);
  }
  return s.trim();
}

// Env lazy lesen (erst beim Aufruf), damit das Spiegeln in der Vite-Dev-
// Middleware vor dem ersten Zugriff greift.
function envWerte() {
  return {
    PROJECT: clean(process.env.VITE_FIREBASE_PROJECT_ID),
    KEY: clean(process.env.VITE_FIREBASE_API_KEY),
  };
}

function basis(project) {
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
}

function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === 'object') return { mapValue: { fields: encodeFields(v) } };
  return { stringValue: String(v) };
}
function encodeFields(obj) {
  const out = {};
  for (const [k, val] of Object.entries(obj)) {
    if (val !== undefined) out[k] = encodeValue(val);
  }
  return out;
}
function decodeValue(v) {
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
function decodeFields(fields) {
  const out = {};
  for (const [k, val] of Object.entries(fields)) out[k] = decodeValue(val);
  return out;
}

/** Legt ein Dokument an. Gibt { status, body } zurück (body als String). */
export async function fsCreate(collection, obj) {
  const { PROJECT, KEY } = envWerte();
  if (!PROJECT || !KEY) {
    return { status: 500, body: JSON.stringify({ error: 'Firebase-Env fehlt (PROJECT/KEY).' }) };
  }
  const res = await fetch(`${basis(PROJECT)}/${collection}?key=${encodeURIComponent(KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields(obj || {}) }),
  });
  return { status: res.status, body: await res.text() };
}

/** Liest bis zu `max` Dokumente; gibt dekodierte Objekte zurück. */
export async function fsList(collection, max = 300) {
  const { PROJECT, KEY } = envWerte();
  if (!PROJECT || !KEY) {
    return { status: 500, body: JSON.stringify({ error: 'Firebase-Env fehlt (PROJECT/KEY).' }) };
  }
  const res = await fetch(
    `${basis(PROJECT)}/${collection}?key=${encodeURIComponent(KEY)}&pageSize=${max}`,
  );
  if (!res.ok) return { status: res.status, body: await res.text() };
  const data = await res.json();
  const documents = (data.documents ?? []).map((d) => ({
    id: String(d.name).split('/').pop(),
    ...decodeFields(d.fields ?? {}),
  }));
  return { status: 200, body: JSON.stringify({ documents }) };
}
