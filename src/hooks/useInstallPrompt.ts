import { useCallback, useEffect, useState } from 'react';

/**
 * Das `beforeinstallprompt`-Event (Chromium/Android) ist nicht in den
 * Standard-Typen enthalten.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'nais-install-dismissed';

/** Erkennt iOS (inkl. iPadOS, das sich teils als „Macintosh" ausgibt). */
function erkenneIOS(): boolean {
  const ua = navigator.userAgent;
  const iOSGeraet = /iphone|ipad|ipod/i.test(ua);
  const iPadOS =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOSGeraet || iPadOS;
}

/** true, wenn die App bereits installiert/standalone läuft. */
function istStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export interface InstallState {
  /** native Installation (Android/Chromium) möglich */
  kannInstallieren: boolean;
  istIOS: boolean;
  istStandalone: boolean;
  /** Banner soll angezeigt werden (nicht installiert, nicht weggeklickt) */
  sichtbar: boolean;
  /** native Installation auslösen (Android/Chromium) */
  installieren: () => Promise<void>;
  /** Banner ausblenden und Entscheidung merken */
  schliessen: () => void;
}

/**
 * Kapselt die PWA-Installations-Logik plattformübergreifend:
 * - Android/Chromium: fängt `beforeinstallprompt` ab und löst den nativen
 *   Dialog aus.
 * - iOS: keine native API – die UI zeigt stattdessen eine Anleitung.
 */
export function useInstallPrompt(): InstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(istStandalone());
  const [iOS] = useState(erkenneIOS());
  const [weggeklickt, setWeggeklickt] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // Mini-Infobar unterdrücken
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installieren = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'accepted') setStandalone(true);
  }, [deferred]);

  const schliessen = useCallback(() => {
    setWeggeklickt(true);
    localStorage.setItem(DISMISS_KEY, '1');
  }, []);

  const kannInstallieren = deferred !== null;
  const sichtbar =
    !standalone && !weggeklickt && (kannInstallieren || iOS);

  return {
    kannInstallieren,
    istIOS: iOS,
    istStandalone: standalone,
    sichtbar,
    installieren,
    schliessen,
  };
}
