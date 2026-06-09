import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './index.css';

// Service Worker registrieren (vite-plugin-pwa).
// 'autoUpdate' aus der Config sorgt dafür, dass Updates automatisch greifen.
registerSW({ immediate: true });

// Wenn ein neuer Service Worker die Kontrolle übernimmt, die Seite einmalig
// neu laden, damit sofort die neuen Assets aktiv sind (kein "alte Version aus
// dem Cache"-Problem mehr).
if ('serviceWorker' in navigator) {
  let nachgeladen = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (nachgeladen) return;
    nachgeladen = true;
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
