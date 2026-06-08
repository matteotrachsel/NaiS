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
  const { status, meldung, gecacht } = useModel(true);
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
      <header className="topbar">
        <div>
          <h1>🌲 NaiS Baumartenwahl</h1>
          <p className="sub">Offline-Entscheidungshilfe für den Schutzwald</p>
        </div>
        <span className={`status-pill ${online ? 'online' : 'offline'}`}>
          {online ? 'Online' : 'Offline'}
          {gecacht ? ' · Modell ✓' : ''}
        </span>
      </header>

      <main>
        <CameraInput onErkannt={handleErkannt} modellBereit={status === 'bereit'} />

        <PflanzenAuswahl selectedIds={pflanzenIds} onChange={setPflanzenIds} />

        <ElevationInput hoeheM={hoeheM} onChange={setHoeheM} />

        <ResultCard ergebnis={ergebnis} />

        {status !== 'bereit' && (
          <p className="modell-status">{meldung || 'Modell wird geladen …'}</p>
        )}
      </main>

      <footer className="footer">
        <small>NaiS · lokale Datenbasis · v0.1 – keine Serververbindung nötig</small>
      </footer>
    </div>
  );
}
