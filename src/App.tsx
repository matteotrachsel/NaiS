import { useEffect, useMemo, useState } from 'react';
import { CameraInput } from '@/components/CameraInput';
import { ElevationInput } from '@/components/ElevationInput';
import { InstallBanner } from '@/components/InstallBanner';
import { Karte } from '@/components/Karte';
import { PflanzenAuswahl } from '@/components/PflanzenAuswahl';
import { ResultCard } from '@/components/ResultCard';
import { werteAusMehrere } from '@/services/naisService';
import type { AuswertungErgebnis } from '@/types/nais';

type Ansicht = 'bestimmen' | 'karte';

export default function App() {
  const [ansicht, setAnsicht] = useState<Ansicht>('bestimmen');
  const [pflanzenIds, setPflanzenIds] = useState<string[]>([]);
  const [hoeheM, setHoeheM] = useState<number | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const ergebnis: AuswertungErgebnis | null = useMemo(() => {
    if (pflanzenIds.length === 0 || hoeheM == null) return null;
    try {
      return werteAusMehrere(pflanzenIds, hoeheM);
    } catch {
      return null;
    }
  }, [pflanzenIds, hoeheM]);

  function handleErkannt(pflanzenId: string) {
    // erkannte Art an die Liste anhängen (statt zu ersetzen), dedupliziert.
    setPflanzenIds((prev) =>
      prev.includes(pflanzenId) ? prev : [...prev, pflanzenId],
    );
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">NaiS</span>
            <span className="brand-context">Baumartenwahl im Schutzwald</span>
          </span>
          <span className={`netstatus ${online ? 'is-online' : 'is-offline'}`}>
            <span className="netstatus-dot" aria-hidden="true" />
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <nav className="tabs" aria-label="Ansicht wählen">
        <button
          className={ansicht === 'bestimmen' ? 'tab aktiv' : 'tab'}
          onClick={() => setAnsicht('bestimmen')}
        >
          Bestimmen
        </button>
        <button
          className={ansicht === 'karte' ? 'tab aktiv' : 'tab'}
          onClick={() => setAnsicht('karte')}
        >
          Karte
        </button>
      </nav>

      {ansicht === 'bestimmen' ? (
        <>
          <header className="masthead">
            <p className="eyebrow">Waldstandort · standortgerechte Baumartenwahl</p>
            <h1>Baumartenwahl nach NaiS</h1>
            <p className="lead">
              Zeigerpflanzen und Höhe über Meer bestimmen den Waldstandortstyp und
              damit die geeigneten Baumarten. Suche und Auswertung funktionieren
              offline; die Foto-Erkennung läuft online über PlantNet.
            </p>
          </header>

          <main>
            <CameraInput
              onErkannt={handleErkannt}
              online={online}
              bereitsGewaehlt={pflanzenIds}
            />

            <PflanzenAuswahl selectedIds={pflanzenIds} onChange={setPflanzenIds} />

            <ElevationInput hoeheM={hoeheM} onChange={setHoeheM} />

            <ResultCard ergebnis={ergebnis} />
          </main>

          <footer className="footer">
            <p className="footer-line">
              NaiS Baumartenwahl · lokale Datenbasis · ohne Serververbindung nutzbar
            </p>
            <p className="footer-meta">
              Entscheidungshilfe – ersetzt keine standortkundliche Beurteilung im Feld.
            </p>
          </footer>
        </>
      ) : (
        <Karte online={online} />
      )}

      <InstallBanner />
    </div>
  );
}
