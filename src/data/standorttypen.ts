import type { Standortstyp } from '@/types/nais';

/**
 * NaiS-Waldstandortstypen.
 *
 * Die Zuordnung im naisService erfolgt über:
 *   1. Höhenstufe muss in `hoehenstufen` enthalten sein, UND
 *   2. alle `erforderlicheEigenschaften` müssen von der Zeigerpflanze
 *      abgedeckt sein.
 *
 * Die `naisCode`-Werte sind, wo angegeben, an die NaiS-Typologie angelehnt.
 * Erweiterbar: weitere Standortstypen aus dem NaiS-Ordner ergänzen.
 */
export const STANDORTTYPEN: Standortstyp[] = [
  {
    id: 'heidelbeer_tannen_fichtenwald',
    name: 'Heidelbeer-Tannen-Fichtenwald',
    naisCode: '57V',
    hoehenstufen: ['hochmontan', 'subalpin'],
    erforderlicheEigenschaften: ['sauer'],
    baumarten: [
      { nameDe: 'Fichte', nameLat: 'Picea abies', eignung: 'hauptbaumart' },
      { nameDe: 'Weisstanne', nameLat: 'Abies alba', eignung: 'hauptbaumart' },
      { nameDe: 'Vogelbeere', nameLat: 'Sorbus aucuparia', eignung: 'pionier' },
    ],
    beschreibung:
      'Bodensaurer, hochmontaner Nadelwald mit Heidelbeere in der Krautschicht.',
  },
  {
    id: 'ahorn_eschenwald',
    name: 'Ahorn-Eschenwald (Schluchtwald-nah)',
    naisCode: '26',
    hoehenstufen: ['submontan', 'untermontan', 'obermontan'],
    erforderlicheEigenschaften: ['basisch', 'feucht'],
    baumarten: [
      { nameDe: 'Esche', nameLat: 'Fraxinus excelsior', eignung: 'hauptbaumart' },
      { nameDe: 'Bergahorn', nameLat: 'Acer pseudoplatanus', eignung: 'hauptbaumart' },
      { nameDe: 'Bergulme', nameLat: 'Ulmus glabra', eignung: 'nebenbaumart' },
    ],
    beschreibung:
      'Nährstoffreicher, feucht-frischer Edellaubholz-Standort auf basenreichem Boden.',
  },
  {
    id: 'buchenwald_basisch',
    name: 'Waldmeister-/Buchenwald',
    naisCode: '8',
    hoehenstufen: ['submontan', 'untermontan', 'obermontan'],
    erforderlicheEigenschaften: ['basisch'],
    baumarten: [
      { nameDe: 'Buche', nameLat: 'Fagus sylvatica', eignung: 'hauptbaumart' },
      { nameDe: 'Bergahorn', nameLat: 'Acer pseudoplatanus', eignung: 'nebenbaumart' },
      { nameDe: 'Esche', nameLat: 'Fraxinus excelsior', eignung: 'nebenbaumart' },
    ],
    beschreibung:
      'Basenreicher, frischer Buchenstandort der collinen bis obermontanen Stufe.',
  },
  {
    id: 'alpenrosen_bergfoehrenwald',
    name: 'Alpenrosen-Bergföhrenwald',
    naisCode: '60*',
    hoehenstufen: ['subalpin', 'obersubalpin'],
    erforderlicheEigenschaften: ['sauer'],
    baumarten: [
      { nameDe: 'Bergföhre', nameLat: 'Pinus mugo / uncinata', eignung: 'hauptbaumart' },
      { nameDe: 'Arve', nameLat: 'Pinus cembra', eignung: 'hauptbaumart' },
      { nameDe: 'Fichte', nameLat: 'Picea abies', eignung: 'nebenbaumart' },
      { nameDe: 'Lärche', nameLat: 'Larix decidua', eignung: 'nebenbaumart' },
    ],
    beschreibung:
      'Saurer, schneereicher Hochlagen-Nadelwald mit Rostblättriger Alpenrose.',
  },
];
