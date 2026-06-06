/**
 * Zentrale Domänen-Typen für die NaiS-Baumartenwahl.
 *
 * Die Struktur ist bewusst datengetrieben aufgebaut: Höhenstufen,
 * Zeigerpflanzen und Standortstypen sind reine Daten (siehe src/data/*),
 * die Logik in src/services/naisService.ts wertet sie aus. So lässt sich
 * die Datenbank später um beliebig viele Zeigerpflanzen aus dem
 * NaiS-Ordner erweitern, ohne die Logik anzufassen.
 */

/** Vegetationshöhenstufen nach NaiS / Schweizer Standortskunde. */
export type Hoehenstufe =
  | 'collin'
  | 'submontan'
  | 'untermontan'
  | 'obermontan'
  | 'hochmontan'
  | 'subalpin'
  | 'obersubalpin';

/** Ökologische Eigenschaften, die eine Zeigerpflanze über den Standort verrät. */
export type Standorteigenschaft =
  | 'sauer' // bodensaure Verhältnisse (Silikat, Rohhumus)
  | 'basisch' // basenreich / kalkreich
  | 'neutral'
  | 'trocken'
  | 'frisch'
  | 'feucht'
  | 'nass'
  | 'naehrstoffreich'
  | 'naehrstoffarm';

/** Bereich von Höhenmetern, dem eine Höhenstufe zugeordnet ist. */
export interface HoehenstufenBereich {
  stufe: Hoehenstufe;
  /** untere Grenze inklusiv (m ü. M.) */
  minM: number;
  /** obere Grenze exklusiv (m ü. M.); null = nach oben offen */
  maxM: number | null;
  label: string;
}

/** Eine Zeigerpflanze und was sie über den Standort aussagt. */
export interface Zeigerpflanze {
  /** stabiler technischer Schlüssel, identisch mit dem ML-Klassennamen */
  id: string;
  nameDe: string;
  nameLat: string;
  /** ökologische Aussage(n) der Pflanze */
  eigenschaften: Standorteigenschaft[];
  /** kurze fachliche Erläuterung für die UI */
  hinweis?: string;
}

/** Eine Baumarten-Empfehlung mit Eignung. */
export interface BaumartEmpfehlung {
  nameDe: string;
  nameLat: string;
  /** Eignung am Standort */
  eignung: 'hauptbaumart' | 'nebenbaumart' | 'pionier';
}

/**
 * Ein NaiS-Waldstandortstyp. Die Zuordnung erfolgt über die Kombination
 * aus Zeigerpflanze (-> Eigenschaften) und Höhenstufe.
 */
export interface Standortstyp {
  id: string;
  name: string;
  /** NaiS-Standortstyp-Nummer, sofern bekannt (z. B. "57" / "60*") */
  naisCode?: string;
  /** Höhenstufen, in denen dieser Typ vorkommt */
  hoehenstufen: Hoehenstufe[];
  /** Eigenschaften, die der Standort erfüllen muss (alle müssen passen) */
  erforderlicheEigenschaften: Standorteigenschaft[];
  baumarten: BaumartEmpfehlung[];
  beschreibung?: string;
}

/** Eingabe für die NaiS-Auswertung. */
export interface AuswertungInput {
  /** Pflanzen-ID (z. B. aus der Bilderkennung) */
  pflanzenId: string;
  /** Höhe in m ü. M. */
  hoeheM: number;
}

/** Ergebnis der NaiS-Auswertung. */
export interface AuswertungErgebnis {
  pflanze: Zeigerpflanze;
  hoeheM: number;
  hoehenstufe: HoehenstufenBereich;
  /** bestpassende Standortstypen (kann mehrere geben) */
  standorte: Standortstyp[];
  /** aggregierte, deduplizierte Baumarten-Empfehlung */
  empfohleneBaumarten: BaumartEmpfehlung[];
  /** true, wenn keine exakte Standortzuordnung gefunden wurde */
  unsicher: boolean;
  hinweise: string[];
}
