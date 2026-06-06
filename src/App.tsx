import { useEffect, useMemo, useState } from 'react';
import { CameraInput } from '@/components/CameraInput';
import { ElevationInput } from '@/components/ElevationInput';
import { ResultCard } from '@/components/ResultCard';
import { useModel } from '@/hooks/useModel';
import { werteAus } from '@/services/naisService';
import { ZEIGERPFLANZEN } from '@/data/zeigerpflanzen';
import type { AuswertungErgebnis } from '@/types/nais';
import type { Vorhersage } from '@/services/recognitionService';

export default function App() {
  const { status, meldung, gecacht } = useModel(true);
  const [pflanzenId, setPflanzenId] = useState<string | null>(null);
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
    if (!pflanzenId || hoeheM == null) return null;
    try {
      return werteAus({ pflanzenId, hoeheM });
    } catch {
      return null;
    }
  }, [pflanzenId, hoeheM]);

  function handleErkannt(v: Vorhersage) {
    setPflanzenId(v.pflanzenId);
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

        {/* Manuelle Pflanzenwahl als Fallback zur Bilderkennung */}
        <section className="card">
          <h2>… oder Zeigerpflanze manuell wählen</h2>
          <select
            value={pflanzenId ?? ''}
            onChange={(e) => setPflanzenId(e.target.value || null)}
          >
            <option value="">– Pflanze wählen –</option>
            {ZEIGERPFLANZEN.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameDe} ({p.nameLat})
              </option>
            ))}
          </select>
        </section>

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
