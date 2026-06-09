import type { Standorteigenschaft } from '@/types/nais';
import type { Beobachtung, ZonePunkt } from '@/types/karte';

/**
 * Reine Aggregations-/Geometrie-Helfer für die Karte: keine UI, keine I/O –
 * gut testbar.
 */

/** Farbkodierung der Bodenökologie (konsistent in Marker/Raster/Legende). */
export const OEKO_FARBE: Record<string, string> = {
  sauer: '#a6512c', // Rotbraun
  basisch: '#2f6db5', // Blau
  feucht: '#1f9e93', // Türkis
  nass: '#1f9e93',
  trocken: '#c79a3b', // Ocker
  neutral: '#3f8f4f', // Grün
  frisch: '#3f8f4f',
  wechselfeucht: '#7a8aa0',
  luftfeucht: '#1f9e93',
  naehrstoffreich: '#6b7f3a',
  waermeliebend: '#b5572f',
};
export const GEMISCHT_FARBE = '#8a8a8a';

/** Reihenfolge, in der bei Gleichstand eine repräsentative Eigenschaft gewinnt. */
const PRIO: Standorteigenschaft[] = [
  'nass',
  'feucht',
  'sauer',
  'basisch',
  'trocken',
  'wechselfeucht',
  'neutral',
  'frisch',
  'naehrstoffreich',
  'luftfeucht',
  'waermeliebend',
];

/** Häufigste Zeigerwert-Eigenschaft über mehrere Beobachtungen. */
export function dominanteEigenschaft(
  obs: Beobachtung[],
): Standorteigenschaft | null {
  const zaehler = new Map<string, number>();
  for (const o of obs) {
    for (const e of o.eigenschaften) {
      zaehler.set(e, (zaehler.get(e) ?? 0) + 1);
    }
  }
  let beste: Standorteigenschaft | null = null;
  let max = 0;
  for (const e of PRIO) {
    const n = zaehler.get(e) ?? 0;
    if (n > max) {
      max = n;
      beste = e;
    }
  }
  return beste;
}

/** Farbe für eine Eigenschaft (Fallback grau). */
export function farbeFuer(e: Standorteigenschaft | null): string {
  return (e && OEKO_FARBE[e]) || GEMISCHT_FARBE;
}

/** Repräsentative Eigenschaft aus einer bereits aggregierten Liste (nach PRIO). */
export function dominanteAusEigenschaften(
  eig: Standorteigenschaft[],
): Standorteigenschaft | null {
  for (const e of PRIO) if (eig.includes(e)) return e;
  return eig[0] ?? null;
}

/** Repräsentative Farbe einer Beobachtung (nach ihrer dominanten Eigenschaft). */
export function beobachtungsFarbe(o: Beobachtung): string {
  return farbeFuer(dominanteEigenschaft([o]));
}

export interface StandortAggregat {
  id: string;
  name: string;
  naisCode: string | null;
  anzahl: number;
}

/** Häufigster Standortstyp über mehrere Beobachtungen. */
export function dominanterStandort(obs: Beobachtung[]): StandortAggregat | null {
  const zaehler = new Map<string, StandortAggregat>();
  for (const o of obs) {
    if (!o.standorttypId) continue;
    const vorhanden = zaehler.get(o.standorttypId);
    if (vorhanden) vorhanden.anzahl += 1;
    else
      zaehler.set(o.standorttypId, {
        id: o.standorttypId,
        name: o.standorttypName ?? o.standorttypId,
        naisCode: o.naisCode,
        anzahl: 1,
      });
  }
  let beste: StandortAggregat | null = null;
  for (const a of zaehler.values()) {
    if (!beste || a.anzahl > beste.anzahl) beste = a;
  }
  return beste;
}

export interface RasterZelle {
  /** Süd-West- und Nord-Ost-Ecke (Leaflet-Bounds) */
  sued: number;
  west: number;
  nord: number;
  ost: number;
  anzahl: number;
  eigenschaft: Standorteigenschaft | null;
  farbe: string;
  standort: StandortAggregat | null;
  beobachtungen: Beobachtung[];
}

/**
 * Bucketet Beobachtungen in ein Gitter fester Gradgrösse und aggregiert je
 * Zelle die dominante Eigenschaft + den dominanten Standortstyp.
 */
export function rasterAggregation(
  obs: Beobachtung[],
  zelleGrad = 0.01,
): RasterZelle[] {
  const buckets = new Map<string, Beobachtung[]>();
  for (const o of obs) {
    const gi = Math.floor(o.lat / zelleGrad);
    const gj = Math.floor(o.lon / zelleGrad);
    const key = `${gi}:${gj}`;
    const arr = buckets.get(key);
    if (arr) arr.push(o);
    else buckets.set(key, [o]);
  }
  const zellen: RasterZelle[] = [];
  for (const [key, gruppe] of buckets) {
    const [gi, gj] = key.split(':').map(Number);
    const eig = dominanteEigenschaft(gruppe);
    zellen.push({
      sued: gi * zelleGrad,
      west: gj * zelleGrad,
      nord: (gi + 1) * zelleGrad,
      ost: (gj + 1) * zelleGrad,
      anzahl: gruppe.length,
      eigenschaft: eig,
      farbe: farbeFuer(eig),
      standort: dominanterStandort(gruppe),
      beobachtungen: gruppe,
    });
  }
  return zellen;
}

/** Punkt-in-Polygon (Ray-Casting) auf Lat/Lon-Ringen. */
export function punktInPolygon(
  pt: { lat: number; lon: number },
  ring: ZonePunkt[],
): boolean {
  let drin = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lon;
    const yi = ring[i].lat;
    const xj = ring[j].lon;
    const yj = ring[j].lat;
    const schnitt =
      yi > pt.lat !== yj > pt.lat &&
      pt.lon < ((xj - xi) * (pt.lat - yi)) / (yj - yi) + xi;
    if (schnitt) drin = !drin;
  }
  return drin;
}
