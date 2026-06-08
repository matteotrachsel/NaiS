import { useCallback, useEffect, useState } from 'react';
import {
  ladeModell,
  istModellGecacht,
  ModellNichtVerfuegbarError,
} from '@/services/recognitionService';

/** 'fehlt' = (noch) kein Modell hinterlegt (erwartet); 'fehler' = echter Fehler. */
export type ModelStatus = 'idle' | 'laden' | 'bereit' | 'fehlt' | 'fehler';

/**
 * Kümmert sich um das Laden/Cachen des ML-Modells und stellt den Status
 * für die UI bereit. Das Modell wird beim Mount vorgeladen, damit die
 * erste Erkennung im Wald schnell ist.
 */
export function useModel(preload = true) {
  const [status, setStatus] = useState<ModelStatus>('idle');
  const [meldung, setMeldung] = useState<string>('');
  const [gecacht, setGecacht] = useState(false);

  const laden = useCallback(async () => {
    setStatus('laden');
    try {
      await ladeModell(setMeldung);
      setGecacht(await istModellGecacht());
      setStatus('bereit');
    } catch (e) {
      if (e instanceof ModellNichtVerfuegbarError) {
        setStatus('fehlt');
        setMeldung('');
      } else {
        setStatus('fehler');
        setMeldung(
          e instanceof Error ? e.message : 'Modell konnte nicht geladen werden.',
        );
      }
    }
  }, []);

  useEffect(() => {
    void istModellGecacht().then(setGecacht);
    if (preload) void laden();
  }, [preload, laden]);

  return { status, meldung, gecacht, laden };
}
