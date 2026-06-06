import { useRef, useState } from 'react';
import { dateiZuBild, erkennePflanze, type Vorhersage } from '@/services/recognitionService';
import { ZEIGERPFLANZEN_BY_ID } from '@/data/zeigerpflanzen';

interface Props {
  /** wird mit der besten Vorhersage aufgerufen */
  onErkannt: (vorhersage: Vorhersage) => void;
  /** true, wenn das Modell einsatzbereit ist */
  modellBereit: boolean;
}

/**
 * Kamera-/Foto-Eingabe via <input type="file" capture="environment">.
 * Das öffnet auf Mobilgeräten direkt die Rückkamera, funktioniert aber
 * auch offline und als Datei-Upload am Desktop.
 */
export function CameraInput({ onErkannt, modellBereit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [analysiert, setAnalysiert] = useState(false);
  const [topVorhersagen, setTopVorhersagen] = useState<Vorhersage[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleDatei(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFehler(null);
    setTopVorhersagen([]);
    setVorschau(URL.createObjectURL(file));
    setAnalysiert(true);

    try {
      const img = await dateiZuBild(file);
      const vorhersagen = await erkennePflanze(img, 3);
      setTopVorhersagen(vorhersagen);
      if (vorhersagen[0]) onErkannt(vorhersagen[0]);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Erkennung fehlgeschlagen.');
    } finally {
      setAnalysiert(false);
    }
  }

  return (
    <section className="card">
      <h2>1 · Zeigerpflanze fotografieren</h2>

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
        disabled={!modellBereit || analysiert}
      >
        {analysiert ? 'Analysiere …' : '📷 Foto aufnehmen / wählen'}
      </button>

      {!modellBereit && (
        <p className="hinweis">Modell wird noch vorbereitet …</p>
      )}

      {vorschau && (
        <img className="vorschau" src={vorschau} alt="Aufgenommene Pflanze" />
      )}

      {fehler && <p className="fehler">{fehler}</p>}

      {topVorhersagen.length > 0 && (
        <ul className="vorhersagen">
          {topVorhersagen.map((v) => {
            const p = ZEIGERPFLANZEN_BY_ID[v.pflanzenId];
            return (
              <li key={v.pflanzenId}>
                <span>{p ? `${p.nameDe} (${p.nameLat})` : v.pflanzenId}</span>
                <span className="konfidenz">{(v.konfidenz * 100).toFixed(0)} %</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
