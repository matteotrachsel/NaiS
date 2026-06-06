import type { Zeigerpflanze } from '@/types/nais';

/**
 * Katalog der Zeigerpflanzen.
 *
 * WICHTIG: `id` muss exakt dem Klassennamen entsprechen, den das
 * ML-Modell ausgibt (siehe src/data/modelClasses.ts). So lässt sich die
 * Bilderkennung verlustfrei mit der Forst-Logik verbinden.
 *
 * Erweiterung: weitere Zeigerpflanzen aus dem NaiS-Ordner hier ergänzen
 * und – falls eigenes Modell – die Klassenliste synchron halten.
 */
export const ZEIGERPFLANZEN: Zeigerpflanze[] = [
  {
    id: 'vaccinium_myrtillus',
    nameDe: 'Heidelbeere',
    nameLat: 'Vaccinium myrtillus',
    eigenschaften: ['sauer', 'naehrstoffarm'],
    hinweis: 'Säurezeiger; deutet auf bodensaure, oft rohhumusreiche Standorte.',
  },
  {
    id: 'allium_ursinum',
    nameDe: 'Bärlauch',
    nameLat: 'Allium ursinum',
    eigenschaften: ['basisch', 'feucht', 'naehrstoffreich'],
    hinweis: 'Basen- und Feuchtezeiger; nährstoffreiche, frisch-feuchte Böden.',
  },
  {
    id: 'rhododendron_ferrugineum',
    nameDe: 'Rostblättrige Alpenrose',
    nameLat: 'Rhododendron ferrugineum',
    eigenschaften: ['sauer', 'naehrstoffarm'],
    hinweis: 'Säurezeiger der Hochlagen; saure, schneereiche Nadelwaldstandorte.',
  },
];

/** Schnellzugriff nach id. */
export const ZEIGERPFLANZEN_BY_ID: Readonly<Record<string, Zeigerpflanze>> =
  Object.fromEntries(ZEIGERPFLANZEN.map((p) => [p.id, p]));
