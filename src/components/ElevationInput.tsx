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
 *
 * Das Eingabefeld wird über einen eigenen Text-State gesteuert (nicht über
 * den validierten Elternwert). Sonst würden Zwischeneingaben wie „8"/„80"
 * (< Mindesthöhe) sofort als ungültig verworfen und das Feld geleert –
 * dreistellige Höhen liessen sich gar nicht tippen.
 */
export function ElevationInput({ onChange }: Props) {
  const [text, setText] = useState('');
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
        setText(String(gerundet));
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
    setText(wert); // Feld zeigt immer das Getippte – auch Zwischenstände.
    if (wert.trim() === '') {
      onChange(null);
      setFehler(null);
      return;
    }
    const zahl = Number(wert);
    if (Number.isNaN(zahl)) {
      setFehler('Bitte eine Zahl eingeben.');
      onChange(null);
      return;
    }
    const v = validiereHoehe(zahl);
    setFehler(v.ok ? null : v.meldung ?? null);
    // Nur gültige Werte propagieren; das Feld bleibt unverändert.
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
            value={text}
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
