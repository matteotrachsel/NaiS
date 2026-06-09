import { useState } from 'react';
import type { AuswertungErgebnis } from '@/types/nais';
import type { Beobachtung } from '@/types/karte';
import { firebaseKonfiguriert } from '@/services/firebase';
import { speichereBeobachtung } from '@/services/observationService';
import { ermittleHoehe, GeolocationFehler } from '@/services/elevationService';

interface Props {
  ergebnis: AuswertungErgebnis;
}

type Status = 'idle' | 'speichern' | 'fertig' | 'fehler';

/** Lehnt ab, wenn `p` nicht innerhalb von `ms` erfüllt wird. */
function mitTimeout<T>(p: Promise<T>, ms: number, meldung: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(meldung)), ms)),
  ]);
}

/**
 * Speichert die aktuelle Bestimmung als Fundpunkt auf der geteilten Karte.
 * Holt dafür beim Klick die GPS-Position (explizites Opt-in der Standortfreigabe).
 */
export function FundSpeichern({ ergebnis }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [meldung, setMeldung] = useState<string>('');

  if (!firebaseKonfiguriert) {
    return (
      <p className="hinweis">
        ℹ️ Die geteilte Karte ist noch nicht konfiguriert (Firebase). Sobald
        eingerichtet, lässt sich der Fund hier speichern.
      </p>
    );
  }

  async function speichern() {
    setStatus('speichern');
    setMeldung('Standort wird ermittelt … (bitte Standortzugriff erlauben)');
    try {
      const pos = await ermittleHoehe();

      setMeldung('Speichere auf der Karte …');
      const top = ergebnis.standorte[0] ?? null;
      const beobachtung: Beobachtung = {
        lat: pos.lat,
        lon: pos.lon,
        hoeheM: ergebnis.hoeheM,
        genauigkeitM: pos.genauigkeitM,
        pflanzenIds: ergebnis.pflanzen.map((p) => p.id),
        pflanzenText: ergebnis.pflanzen.map((p) => p.nameDe).join(', '),
        eigenschaften: ergebnis.eigenschaften,
        standorttypId: top?.id ?? null,
        standorttypName: top?.name ?? null,
        naisCode: top?.naisCode ?? null,
        hoehenstufe: ergebnis.hoehenstufe.label,
      };
      // Schreibvorgang mit Timeout absichern, damit die UI nie endlos hängt.
      await mitTimeout(
        speichereBeobachtung(beobachtung),
        20_000,
        'Zeitüberschreitung beim Speichern – Internetverbindung prüfen und erneut versuchen.',
      );
      setStatus('fertig');
      setMeldung('Fund auf der Karte gespeichert. Danke fürs Beitragen!');
    } catch (e) {
      setStatus('fehler');
      setMeldung(
        e instanceof GeolocationFehler
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Speichern fehlgeschlagen. Internet/Standort prüfen und erneut versuchen.',
      );
    }
  }

  return (
    <div className="fund-speichern">
      {status !== 'fertig' && (
        <button
          className="btn-secondary"
          onClick={speichern}
          disabled={status === 'speichern'}
        >
          {status === 'speichern' ? 'Speichere …' : '📍 Fund auf Karte speichern'}
        </button>
      )}
      {meldung && (
        <p className={status === 'fehler' ? 'fehler' : 'hinweis'}>{meldung}</p>
      )}
    </div>
  );
}
