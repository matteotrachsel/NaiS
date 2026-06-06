import { useState } from 'react';
import {
  ermittleHoehe,
  validiereHoehe,
  GeolocationFehler,
} from '@/services/elevationService';

interface Props {
  hoeheM: number | null;
  onChange: (hoeheM: number | null) => void;
}

/**
 * Höhen-Eingabe: GPS-Knopf + immer sichtbares manuelles Eingabefeld als
 * Fallback (GPS-Höhe ist im Wald oft ungenau oder fehlt ganz).
 */
export function ElevationInput({ hoeheM, onChange }: Props) {
  const [lade, setLade] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function gpsLesen() {
    setLade(true);
    setFehler(null);
    setInfo(null);
    try {
      const m = await ermittleHoehe();
      if (m.hoeheM === null) {
        setFehler(
          'GPS liefert keine Höhe. Bitte manuell eingeben (z. B. aus Karte/Höhenmesser).',
        );
      } else {
        const gerundet = Math.round(m.hoeheM);
        onChange(gerundet);
        const genau =
          m.genauigkeitM != null ? ` (±${Math.round(m.genauigkeitM)} m)` : '';
        setInfo(`GPS-Höhe übernommen: ${gerundet} m ü. M.${genau}. Bitte prüfen.`);
      }
    } catch (e) {
      setFehler(
        e instanceof GeolocationFehler
          ? e.message
          : 'Standort konnte nicht ermittelt werden. Bitte Höhe manuell eingeben.',
      );
    } finally {
      setLade(false);
    }
  }

  function manuell(e: React.ChangeEvent<HTMLInputElement>) {
    setInfo(null);
    const wert = e.target.value;
    if (wert === '') {
      onChange(null);
      setFehler(null);
      return;
    }
    const zahl = Number(wert);
    const v = validiereHoehe(zahl);
    setFehler(v.ok ? null : v.meldung ?? null);
    onChange(v.ok ? zahl : null);
  }

  return (
    <section className="card">
      <h2>2 · Höhe über Meer</h2>

      <div className="hoehe-zeile">
        <button className="btn-secondary" onClick={gpsLesen} disabled={lade}>
          {lade ? 'GPS …' : '📍 GPS-Höhe'}
        </button>

        <label className="hoehe-feld">
          <input
            type="number"
            inputMode="numeric"
            placeholder="manuell, m ü. M."
            value={hoeheM ?? ''}
            onChange={manuell}
            min={100}
            max={4700}
          />
          <span>m ü. M.</span>
        </label>
      </div>

      {info && <p className="hinweis">{info}</p>}
      {fehler && <p className="fehler">{fehler}</p>}
    </section>
  );
}
