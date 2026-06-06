import type { HoehenstufenBereich } from '@/types/nais';

/**
 * Höhenstufen-Mapping (m ü. M. -> Vegetationshöhenstufe).
 *
 * Die Grenzen sind Richtwerte für die Alpennordseite und können regional
 * abweichen (Exposition, Kontinentalität). Bereiche sind [minM, maxM)
 * (untere Grenze inklusiv, obere exklusiv). Der letzte Bereich ist nach
 * oben offen (maxM = null).
 *
 * Erweiterbar: einfach weitere/feinere Bereiche ergänzen – getHoehenstufe()
 * findet den passenden automatisch.
 */
export const HOEHENSTUFEN: HoehenstufenBereich[] = [
  { stufe: 'collin', minM: 0, maxM: 500, label: 'kollin (Tieflagen)' },
  { stufe: 'submontan', minM: 500, maxM: 700, label: 'submontan' },
  { stufe: 'untermontan', minM: 700, maxM: 900, label: 'untermontan' },
  { stufe: 'obermontan', minM: 900, maxM: 1250, label: 'obermontan' },
  { stufe: 'hochmontan', minM: 1250, maxM: 1550, label: 'hochmontan' },
  { stufe: 'subalpin', minM: 1550, maxM: 1850, label: 'subalpin' },
  { stufe: 'obersubalpin', minM: 1850, maxM: null, label: 'obersubalpin' },
];
