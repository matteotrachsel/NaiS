/**
 * Höhenermittlung über die HTML5 Geolocation API.
 *
 * Im Wald sind GPS-Höhen oft ungenau oder fehlen ganz (coords.altitude
 * kann null sein). Diese Funktion liefert daher immer auch die geschätzte
 * Genauigkeit zurück, damit die UI eine manuelle Korrektur anbieten kann.
 */

export interface HoehenMessung {
  /** Höhe in m ü. M. (null, wenn das Gerät keine Höhe liefert) */
  hoeheM: number | null;
  /** vertikale Genauigkeit in Metern (null, wenn unbekannt) */
  genauigkeitM: number | null;
  lat: number;
  lon: number;
  zeitpunkt: number;
}

export class GeolocationFehler extends Error {
  constructor(
    message: string,
    readonly code: 'nicht_unterstuetzt' | 'verweigert' | 'nicht_verfuegbar' | 'timeout',
  ) {
    super(message);
    this.name = 'GeolocationFehler';
  }
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12_000,
  // Eine bis zu 1 Minute alte Position akzeptieren -> schneller, vermeidet
  // unnötiges Warten auf einen frischen Fix.
  maximumAge: 60_000,
};

/**
 * Liest die aktuelle Position inkl. Höhe aus. Promise-basiert, damit es
 * sich sauber in async-Workflows einbinden lässt.
 */
export function ermittleHoehe(
  options: PositionOptions = DEFAULT_OPTIONS,
): Promise<HoehenMessung> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(
        new GeolocationFehler(
          'Dieses Gerät unterstützt keine Standortbestimmung.',
          'nicht_unterstuetzt',
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          hoeheM: pos.coords.altitude, // kann null sein -> manueller Fallback
          genauigkeitM: pos.coords.altitudeAccuracy,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          zeitpunkt: pos.timestamp,
        });
      },
      (err) => {
        const map: Record<number, GeolocationFehler['code']> = {
          1: 'verweigert',
          2: 'nicht_verfuegbar',
          3: 'timeout',
        };
        reject(
          new GeolocationFehler(
            uebersetzeFehler(err.code),
            map[err.code] ?? 'nicht_verfuegbar',
          ),
        );
      },
      options,
    );
  });
}

function uebersetzeFehler(code: number): string {
  switch (code) {
    case 1:
      return 'Standortzugriff wurde verweigert. Bitte Berechtigung erteilen oder Höhe manuell eingeben.';
    case 2:
      return 'Position konnte nicht ermittelt werden (kein GPS-Empfang im Wald?). Bitte Höhe manuell eingeben.';
    case 3:
      return 'Zeitüberschreitung bei der Standortbestimmung. Bitte erneut versuchen oder Höhe manuell eingeben.';
    default:
      return 'Unbekannter Fehler bei der Standortbestimmung.';
  }
}

/**
 * Grobe Bounding-Box der Schweiz (identisch zur Prüfung in firestore.rules).
 * Fundpunkte ausserhalb werden nicht gespeichert.
 */
export const CH_BOUNDS = { latMin: 45.8, latMax: 47.9, lonMin: 5.9, lonMax: 10.6 };

export function istInSchweiz(lat: number, lon: number): boolean {
  return (
    lat >= CH_BOUNDS.latMin &&
    lat <= CH_BOUNDS.latMax &&
    lon >= CH_BOUNDS.lonMin &&
    lon <= CH_BOUNDS.lonMax
  );
}

/** Validiert eine manuell eingegebene Höhe (Schweiz: ~190–4634 m ü. M.). */
export function validiereHoehe(eingabe: number): { ok: boolean; meldung?: string } {
  if (Number.isNaN(eingabe)) {
    return { ok: false, meldung: 'Bitte eine Zahl eingeben.' };
  }
  if (eingabe < 100 || eingabe > 4700) {
    return {
      ok: false,
      meldung: 'Höhe ausserhalb des plausiblen Bereichs für die Schweiz (100–4700 m).',
    };
  }
  return { ok: true };
}
