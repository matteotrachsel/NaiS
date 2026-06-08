import type {
  AuswertungErgebnis,
  AuswertungInput,
  BaumartEmpfehlung,
  HoehenstufenBereich,
  Standorteigenschaft,
  Standortstyp,
} from '@/types/nais';
import { HOEHENSTUFEN } from '@/data/hoehenstufen';
import { ZEIGERPFLANZEN_BY_ID } from '@/data/zeigerpflanzen';
import { STANDORTTYPEN } from '@/data/standorttypen';

/**
 * Ordnet eine Höhe (m ü. M.) der passenden Höhenstufe zu.
 * Wirft, wenn keine Stufe definiert ist (sollte durch offenen Endbereich
 * nie passieren), und clamped negative Höhen auf 0.
 */
export function getHoehenstufe(hoeheM: number): HoehenstufenBereich {
  const h = Math.max(0, hoeheM);
  const treffer = HOEHENSTUFEN.find(
    (b) => h >= b.minM && (b.maxM === null || h < b.maxM),
  );
  if (!treffer) {
    throw new Error(`Keine Höhenstufe für ${hoeheM} m ü. M. definiert.`);
  }
  return treffer;
}

/** Dedupliziert Baumarten (nach lat. Namen) und sortiert nach Eignung. */
function aggregiereBaumarten(standorte: Standortstyp[]): BaumartEmpfehlung[] {
  const rang: Record<BaumartEmpfehlung['eignung'], number> = {
    hauptbaumart: 0,
    nebenbaumart: 1,
    pionier: 2,
  };
  const byKey = new Map<string, BaumartEmpfehlung>();
  for (const s of standorte) {
    for (const b of s.baumarten) {
      const vorhanden = byKey.get(b.nameLat);
      // Beste (niedrigste) Eignungsstufe gewinnt.
      if (!vorhanden || rang[b.eignung] < rang[vorhanden.eignung]) {
        byKey.set(b.nameLat, b);
      }
    }
  }
  return [...byKey.values()].sort((a, b) => rang[a.eignung] - rang[b.eignung]);
}

/**
 * Kernfunktion: nimmt eine oder mehrere Zeigerpflanzen-IDs + Höhe, führt das
 * NaiS-Mapping durch und liefert Standortstyp(en) sowie eine aggregierte
 * Baumarten-Empfehlung.
 *
 * Mehrere Pflanzen werden kombiniert: ihre Zeigerwerte werden vereinigt, was
 * den Standort enger eingrenzt (entspricht der NaiS-Feldlogik – mehr
 * Zeigerarten erhöhen die Sicherheit der Ansprache).
 */
export function werteAusMehrere(
  pflanzenIds: string[],
  hoeheM: number,
): AuswertungErgebnis {
  const pflanzen = pflanzenIds
    .map((id) => ZEIGERPFLANZEN_BY_ID[id])
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (pflanzen.length === 0) {
    throw new Error('Keine (bekannte) Zeigerpflanze angegeben.');
  }

  const hoehenstufe = getHoehenstufe(hoeheM);
  const hinweise: string[] = [];

  // Vereinigung der Zeigerwerte aller Pflanzen.
  const eigenschaften = [
    ...new Set(pflanzen.flatMap((p) => p.eigenschaften)),
  ] as Standorteigenschaft[];
  const eigenschaftenSet = new Set(eigenschaften);

  // Kandidaten: Höhenstufe passt UND alle erforderlichen Eigenschaften
  // werden von der (vereinigten) Zeiger-Bodenökologie abgedeckt.
  // Sortierung nach Spezifität: Standorte, die mehr der geforderten
  // Eigenschaften abdecken, zuerst – azonale Typen ohne Bodensignal hinten.
  let standorte = STANDORTTYPEN.filter(
    (s) =>
      s.hoehenstufen.includes(hoehenstufe.stufe) &&
      s.erforderlicheEigenschaften.every((e) => eigenschaftenSet.has(e)),
  ).sort(
    (a, b) =>
      b.erforderlicheEigenschaften.length - a.erforderlicheEigenschaften.length,
  );

  let unsicher = false;

  if (standorte.length === 0) {
    unsicher = true;
    // Fallback: gleiche Eigenschaften, aber Höhenstufe passt nicht exakt.
    const nachEigenschaft = STANDORTTYPEN.filter((s) =>
      s.erforderlicheEigenschaften.every((e) => eigenschaftenSet.has(e)),
    );
    if (nachEigenschaft.length > 0) {
      standorte = nachEigenschaft;
      hinweise.push(
        `Keine exakte Übereinstimmung für die Höhenstufe „${hoehenstufe.label}". ` +
          `Angezeigt werden Standorte mit passender Bodenökologie – Höhe bitte prüfen.`,
      );
    } else {
      hinweise.push(
        `Für die angegebene(n) Zeigerpflanze(n) auf der Stufe „${hoehenstufe.label}" ` +
          `ist noch kein Standortstyp hinterlegt. Datenbasis erweitern oder Aufnahme prüfen.`,
      );
    }
  }

  // Hinweis bei widersprüchlichen Säure-/Basenzeigern.
  if (eigenschaftenSet.has('sauer') && eigenschaftenSet.has('basisch')) {
    hinweise.push(
      'Widersprüchliche Säure- und Basenzeiger erfasst – evtl. Standortmosaik ' +
        'oder Fehlbestimmung. Bodenmerkmale prüfen.',
    );
  }

  // Höhenstufen-Plausibilität je Pflanze.
  for (const p of pflanzen) {
    if (p.hoehenstufen && !p.hoehenstufen.includes(hoehenstufe.stufe)) {
      hinweise.push(
        `„${p.nameDe}" kommt auf der Stufe „${hoehenstufe.label}" normalerweise ` +
          `nicht vor – Bestimmung oder Höhe prüfen.`,
      );
    }
  }

  if (standorte.length > 1) {
    hinweise.push(
      'Mehrere Standortstypen kommen in Frage – endgültige Wahl im Feld anhand ' +
        'weiterer Zeigerarten und Bodenmerkmalen treffen.',
    );
  }

  return {
    pflanzen,
    eigenschaften,
    hoeheM,
    hoehenstufe,
    standorte,
    empfohleneBaumarten: aggregiereBaumarten(standorte),
    unsicher,
    hinweise,
  };
}

/**
 * Komfort-Wrapper für genau eine Zeigerpflanze (z. B. aus der Bilderkennung).
 */
export function werteAus({ pflanzenId, hoeheM }: AuswertungInput): AuswertungErgebnis {
  return werteAusMehrere([pflanzenId], hoeheM);
}
