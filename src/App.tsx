import { useEffect, useMemo, useState } from 'react';
import { CameraInput } from '@/components/CameraInput';
import { ElevationInput } from '@/components/ElevationInput';
import { PflanzenAuswahl } from '@/components/PflanzenAuswahl';
import { ResultCard } from '@/components/ResultCard';
import { useModel } from '@/hooks/useModel';
import { werteAusMehrere } from '@/services/naisService';
import type { AuswertungErgebnis } from '@/types/nais';
import type { Vorhersage } from '@/services/recognitionService';

export default function App() {
  const { status, gecacht } = useModel(true);
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

  function handleErkannt(v: Vorhersage) {
    // erkannte Art an die Liste anhängen (statt zu ersetzen), dedupliziert.
    setPflanzenIds((prev) =>
      prev.includes(v.pflanzenId) ? prev : [...prev, v.pflanzenId],
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
            {gecacht ? ' · Modell bereit' : ''}
          </span>
        </div>
      </div>

      <header className="masthead">
        <p className="eyebrow">Waldstandort · standortgerechte Baumartenwahl</p>
        <h1>Baumartenwahl nach NaiS</h1>
        <p className="lead">
          Zeigerpflanzen und Höhe über Meer bestimmen den Waldstandortstyp und damit
          die geeigneten Baumarten. Erfassung im Feld – vollständig offline.
        </p>
      </header>

      <main>
        <CameraInput onErkannt={handleErkannt} modellStatus={status} />

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
    </div>
  );
}
