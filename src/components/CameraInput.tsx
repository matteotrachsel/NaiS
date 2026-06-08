import { useRef, useState } from 'react';
import {
  erkennePflanze,
  PlantNetFehler,
  type Organ,
  type PlantNetTreffer,
} from '@/services/recognitionService';
import { ZEIGERPFLANZEN_BY_ID } from '@/data/zeigerpflanzen';

interface Props {
  /** wird mit einer übernommenen Zeigerpflanzen-ID aufgerufen */
  onErkannt: (pflanzenId: string) => void;
  /** Netzstatus – PlantNet benötigt Internet */
  online: boolean;
  /** bereits gewählte IDs (für „übernommen"-Markierung) */
  bereitsGewaehlt: string[];
}

const ORGANE: { wert: Organ; label: string }[] = [
  { wert: 'auto', label: 'Automatisch' },
  { wert: 'leaf', label: 'Blatt' },
  { wert: 'flower', label: 'Blüte' },
  { wert: 'fruit', label: 'Frucht' },
  { wert: 'bark', label: 'Rinde' },
];

/**
 * Foto-Eingabe via <input type="file" capture="environment"> und Erkennung
 * über die PlantNet-API. Treffer, die NaiS-Zeigerpflanzen sind, lassen sich
 * direkt in die Auswertung übernehmen.
 */
export function CameraInput({ onErkannt, online, bereitsGewaehlt }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [organ, setOrgan] = useState<Organ>('auto');
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [analysiert, setAnalysiert] = useState(false);
  const [treffer, setTreffer] = useState<PlantNetTreffer[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleDatei(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // erneute Auswahl derselben Datei erlauben
    if (!file) return;

    setFehler(null);
    setTreffer(null);
    setVorschau((alt) => {
      if (alt) URL.revokeObjectURL(alt);
      return URL.createObjectURL(file);
    });
    setAnalysiert(true);

    try {
      const res = await erkennePflanze(file, organ);
      setTreffer(res);
      if (res.length === 0) {
        setFehler('Keine Art erkannt. Anderes Foto versuchen oder unten manuell suchen.');
      }
    } catch (err) {
      setFehler(
        err instanceof PlantNetFehler
          ? err.message
          : 'Erkennung fehlgeschlagen. Bitte erneut versuchen.',
      );
    } finally {
      setAnalysiert(false);
    }
  }

  return (
    <section className="card">
      <h2>Foto-Erkennung</h2>

      <label className="organ-zeile">
        <span>Pflanzenteil</span>
        <select value={organ} onChange={(e) => setOrgan(e.target.value as Organ)}>
          {ORGANE.map((o) => (
            <option key={o.wert} value={o.wert}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleDatei}
      />

      <button
        className="btn-primary"
        onClick={() => inputRef.current?.click()}
        disabled={!online || analysiert}
      >
        {analysiert ? 'Analysiere …' : '📷 Foto aufnehmen / wählen'}
      </button>

      {!online && (
        <p className="hinweis">
          ℹ️ Die Foto-Erkennung läuft über PlantNet und benötigt Internet. Ohne
          Verbindung die Zeigerpflanze unten per Textsuche bestimmen.
        </p>
      )}
      {online && (
        <p className="hinweis bestimmung-quelle">Erkennung via PlantNet · plantnet.org</p>
      )}

      {vorschau && (
        <img className="vorschau" src={vorschau} alt="Aufgenommene Pflanze" />
      )}

      {fehler && <p className="fehler">{fehler}</p>}

      {treffer && treffer.length > 0 && (
        <>
          <h3>Erkannte Arten</h3>
          <ul className="treffer">
            {treffer.map((t, i) => {
              const p = t.pflanzenId ? ZEIGERPFLANZEN_BY_ID[t.pflanzenId] : undefined;
              const schonGewaehlt = t.pflanzenId
                ? bereitsGewaehlt.includes(t.pflanzenId)
                : false;
              return (
                <li key={`${t.wissenschaftlich}-${i}`} className="treffer-item">
                  <div className="treffer-text">
                    <span className="treffer-name">
                      {t.deutsch ? `${t.deutsch} ` : ''}
                      <em>{t.wissenschaftlich}</em>
                    </span>
                    {p ? (
                      <span className="treffer-tag is-zeiger">NaiS-Zeigerpflanze</span>
                    ) : (
                      <span className="treffer-tag">keine Zeigerpflanze</span>
                    )}
                  </div>
                  <span className="treffer-score">{Math.round(t.score * 100)} %</span>
                  {p &&
                    (schonGewaehlt ? (
                      <span className="treffer-done" aria-label="übernommen">
                        ✓
                      </span>
                    ) : (
                      <button
                        className="treffer-add"
                        onClick={() => onErkannt(t.pflanzenId!)}
                      >
                        Übernehmen
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
