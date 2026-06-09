import type { Standorteigenschaft } from './nais';

/** Ein auf der Karte geteilter Fundpunkt (eine gespeicherte Bestimmung). */
export interface Beobachtung {
  id?: string;
  lat: number;
  lon: number;
  hoeheM: number | null;
  genauigkeitM: number | null;
  /** erfasste Zeigerpflanzen-IDs */
  pflanzenIds: string[];
  /** lesbarer Pflanzentext fürs Popup */
  pflanzenText: string;
  /** vereinte Zeigerwerte (Basis der Aggregation) */
  eigenschaften: Standorteigenschaft[];
  standorttypId: string | null;
  standorttypName: string | null;
  naisCode: string | null;
  hoehenstufe: string | null;
  /** Erstellzeitpunkt (ms seit Epoch), serverseitig gesetzt */
  createdAt?: number;
}

/** Eckpunkt eines gezeichneten Waldgebiets. */
export interface ZonePunkt {
  lat: number;
  lon: number;
}

/** Ein manuell gezeichnetes Waldgebiet mit abgeleiteter Klassifikation. */
export interface Zone {
  id?: string;
  name: string;
  /** Polygon-Ring (Firestore erlaubt keine verschachtelten Arrays → Objektliste) */
  polygon: ZonePunkt[];
  standorttypId: string | null;
  standorttypName: string | null;
  naisCode: string | null;
  eigenschaften: Standorteigenschaft[];
  /** Anzahl der bei der Klassifikation enthaltenen Fundpunkte */
  anzahlPunkte: number;
  notiz?: string | null;
  createdAt?: number;
}
