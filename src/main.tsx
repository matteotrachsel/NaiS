import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './index.css';

// Service Worker registrieren (vite-plugin-pwa).
// 'autoUpdate' aus der Config sorgt dafür, dass Updates automatisch greifen.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
