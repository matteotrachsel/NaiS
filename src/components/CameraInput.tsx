import { useRef, useState } from 'react';
import { dateiZuBild, erkennePflanze, type Vorhersage } from '@/services/recognitionService';
import { ZEIGERPFLANZEN_BY_ID } from '@/data/zeigerpflanzen';
import type { ModelStatus } from '@/hooks/useModel';

interface Props {
  /** wird mit der besten Vorhersage aufgerufen */
  onErkannt: (vorhersage: Vorhersage) => void;
  /** Lade-/Verfügbarkeitsstatus des Erkennungsmodells */
  modellStatus: ModelStatus;
}

/**
 * Kamera-/Foto-Eingabe via <input type="file" capture="environment">.
 * Das öffnet auf Mobilgeräten direkt die Rückkamera, funktioniert aber
 * auch offline und als Datei-Upload am Desktop.
 */
export function CameraInput({ onErkannt, modellStatus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [analysiert, setAnalysiert] = useState(false);
  const [topVorhersagen, setTopVorhersagen] = useState<Vorhersage[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);

  const modellBereit = modellStatus === 'bereit';
  const modellFehlt = modellStatus === 'fehlt';

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
      <h2>Foto-Erkennung</h2>

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

      {modellStatus === 'laden' || modellStatus === 'idle' ? (
        <p className="hinweis">Erkennungsmodell wird vorbereitet …</p>
      ) : modellFehlt ? (
        <p className="hinweis">
          ℹ️ Bilderkennung ist noch nicht verfügbar (kein Modell hinterlegt).
          Bestimme die Zeigerpflanze einfach unten per Textsuche – die NaiS-Auswertung
          funktioniert vollständig.
        </p>
      ) : modellStatus === 'fehler' ? (
        <p className="hinweis">
          ⚠️ Das Erkennungsmodell konnte nicht geladen werden. Bitte Zeigerpflanze
          unten per Textsuche eingeben.
        </p>
      ) : null}

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
