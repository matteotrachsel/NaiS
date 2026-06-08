import { useEffect, useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

/** iOS-„Teilen"-Glyph (Share-Sheet-Symbol) als Inline-SVG. */
function ShareIcon() {
  return (
    <svg
      className="ios-share-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M12 3v11M8.5 6.5 12 3l3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 10H5.5A1.5 1.5 0 0 0 4 11.5v7A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 18.5 10H17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Installations-Hinweis für die PWA.
 * - Android/Chromium: Button löst den nativen Installationsdialog aus.
 * - iOS: Anleitung (Teilen → „Zum Home-Bildschirm"), da keine native API.
 */
export function InstallBanner() {
  const { kannInstallieren, istIOS, sichtbar, installieren, schliessen } =
    useInstallPrompt();
  const [iosOffen, setIosOffen] = useState(false);

  // Solange das Banner sichtbar ist, unten Platz schaffen (Footer frei halten).
  useEffect(() => {
    document.body.classList.toggle('has-install-banner', sichtbar);
    return () => document.body.classList.remove('has-install-banner');
  }, [sichtbar]);

  if (!sichtbar) return null;

  return (
    <div className="install" role="region" aria-label="App installieren">
      <div className="install-bar">
        <span className="install-mark" aria-hidden="true" />
        <div className="install-text">
          <strong>App installieren</strong>
          <span>Offline im Wald nutzen – ohne Browser-Leiste, schneller Start.</span>
        </div>

        {kannInstallieren ? (
          <button className="install-cta" onClick={installieren}>
            Installieren
          </button>
        ) : istIOS ? (
          <button className="install-cta" onClick={() => setIosOffen((o) => !o)}>
            So geht’s
          </button>
        ) : null}

        <button
          className="install-close"
          aria-label="Hinweis schliessen"
          onClick={schliessen}
        >
          ✕
        </button>
      </div>

      {istIOS && iosOffen && (
        <ol className="install-ios">
          <li>
            Tippe in Safari unten auf <ShareIcon /> <em>Teilen</em>.
          </li>
          <li>
            Wähle <em>„Zum Home-Bildschirm"</em>.
          </li>
          <li>
            Bestätige mit <em>„Hinzufügen"</em> – fertig.
          </li>
        </ol>
      )}
    </div>
  );
}
