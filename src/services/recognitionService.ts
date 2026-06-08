import { IDENTIFY_ENDPOINT } from '@/config';
import { ZEIGERPFLANZEN } from '@/data/zeigerpflanzen';

/**
 * Online-Bilderkennung über PlantNet (https://plantnet.org), aufgerufen über
 * den eigenen Proxy `/api/identify` (PlantNet blockiert direkte Browser-
 * Aufrufe per CORS/403; der Proxy ruft serverseitig auf).
 *
 * Ein Foto wird vor dem Senden clientseitig verkleinert (spart Bandbreite und
 * bleibt unter dem Body-Limit). Treffer, die einer NaiS-Zeigerpflanze
 * entsprechen, werden markiert und können übernommen werden.
 *
 * Benötigt eine Internetverbindung – die übrige App (Suche, NaiS-Logik)
 * bleibt offline nutzbar.
 */

export interface PlantNetTreffer {
  /** wissenschaftlicher Name (ohne Autor), z. B. "Vaccinium myrtillus" */
  wissenschaftlich: string;
  /** gebräuchlicher Name, falls von PlantNet geliefert */
  deutsch?: string;
  /** Score 0..1 */
  score: number;
  /** ID der zugeordneten NaiS-Zeigerpflanze (falls im Katalog vorhanden) */
  pflanzenId?: string;
}

export class PlantNetFehler extends Error {
  constructor(
    message: string,
    readonly code: 'offline' | 'auth' | 'quota' | 'keine_treffer' | 'unbekannt',
  ) {
    super(message);
    this.name = 'PlantNetFehler';
  }
}

/** Verfügbare Pflanzenorgane für die PlantNet-Erkennung. */
export type Organ = 'auto' | 'leaf' | 'flower' | 'fruit' | 'bark';

/**
 * Index der Zeigerpflanzen nach „Gattung Art" (erste zwei Tokens, normiert),
 * um PlantNet-Namen verlustarm auf den NaiS-Katalog abzubilden.
 */
const ZEIGER_INDEX: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const p of ZEIGERPFLANZEN) {
    const key = gattungArt(p.nameLat);
    if (key && !map.has(key)) map.set(key, p.id);
  }
  return map;
})();

/** Reduziert einen lateinischen Namen auf „gattung art" (lowercase). */
function gattungArt(latin: string): string {
  const tokens = latin
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !/^(sl\.?|ssp\.?|subsp\.?|sp\.?|var\.?|x|×|und)$/.test(t));
  return tokens.slice(0, 2).join(' ');
}

/** Sucht die NaiS-Zeigerpflanzen-ID zu einem wissenschaftlichen Namen. */
function findePflanzenId(wissenschaftlich: string): string | undefined {
  return ZEIGER_INDEX.get(gattungArt(wissenschaftlich));
}

interface PlantNetResponse {
  results?: Array<{
    score: number;
    species?: {
      scientificNameWithoutAuthor?: string;
      scientificName?: string;
      commonNames?: string[];
    };
  }>;
}

/** Lädt eine Bilddatei in ein HTMLImageElement. */
function ladeBild(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Bild konnte nicht geladen werden.'));
    };
    img.src = url;
  });
}

/**
 * Verkleinert ein Foto auf max. `maxDim` px (längere Kante) und gibt es als
 * JPEG-Base64 (ohne Data-URL-Präfix) zurück – klein genug fürs Body-Limit der
 * Serverless-Function und ausreichend für PlantNet.
 */
async function fileZuJpegBase64(
  file: File,
  maxDim = 1280,
  quality = 0.85,
): Promise<string> {
  const img = await ladeBild(file);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas-Kontext nicht verfügbar.');
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

/**
 * Sendet ein Foto über den Proxy an PlantNet und liefert die Top-Treffer
 * (nach Score), angereichert um die NaiS-Zuordnung.
 */
export async function erkennePflanze(
  file: File,
  organ: Organ = 'auto',
  topK = 6,
): Promise<PlantNetTreffer[]> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new PlantNetFehler(
      'Keine Internetverbindung – die Foto-Erkennung (PlantNet) benötigt Netz.',
      'offline',
    );
  }

  const imageBase64 = await fileZuJpegBase64(file);

  let res: Response;
  try {
    res = await fetch(IDENTIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ imageBase64, organ }),
    });
  } catch {
    throw new PlantNetFehler(
      'Verbindung fehlgeschlagen. Internet prüfen und erneut versuchen.',
      'offline',
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new PlantNetFehler('PlantNet-Zugang ungültig (API-Key prüfen).', 'auth');
  }
  if (res.status === 429) {
    throw new PlantNetFehler(
      'PlantNet-Kontingent erschöpft. Bitte später erneut versuchen.',
      'quota',
    );
  }
  if (res.status === 404) {
    return []; // keine Art erkannt
  }
  if (!res.ok) {
    throw new PlantNetFehler(
      `Erkennung fehlgeschlagen (HTTP ${res.status}). Bitte erneut versuchen.`,
      'unbekannt',
    );
  }

  const data = (await res.json()) as PlantNetResponse;
  const results = data.results ?? [];

  return results.slice(0, topK).map((r) => {
    const wissenschaftlich =
      r.species?.scientificNameWithoutAuthor ??
      r.species?.scientificName ??
      'Unbekannt';
    return {
      wissenschaftlich,
      deutsch: r.species?.commonNames?.[0],
      score: r.score ?? 0,
      pflanzenId: findePflanzenId(wissenschaftlich),
    };
  });
}
