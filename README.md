# 🌲 NaiS Baumartenwahl – Offline-PWA

Progressive Web App, die Forstpersonal **vollständig offline im Wald** bei der
Baumartenwahl nach **NaiS** (Nachhaltigkeit und Erfolgskontrolle im Schutzwald)
unterstützt.

## Workflow

1. **Foto & Erkennung** – Foto einer Zeigerpflanze; Erkennung läuft lokal via
   TensorFlow.js (kein Serveraufruf).
2. **Höhe** – Höhe über Meer per GPS *oder* manuell (Feld-Fallback).
3. **NaiS-Auswertung** – aus Pflanze (Bodenökologie) + Höhe (Höhenstufe) →
   Waldstandortstyp + Baumartenempfehlung.

## Tech-Stack

- **Vite + React + TypeScript**
- **vite-plugin-pwa** (Workbox) – App-Shell + Modell werden precached → Offline-Start
- **@tensorflow/tfjs** – Inferenz im Browser, Modell-Cache in IndexedDB
- **HTML5 Geolocation API** – Höhe via `coords.altitude`, manueller Fallback

## Projektstruktur

```
src/
├── types/nais.ts              # Domänen-Typen
├── data/
│   ├── hoehenstufen.ts        # Höhe (m ü. M.) -> Höhenstufe
│   ├── zeigerpflanzen.ts      # Zeigerpflanzen -> Bodenökologie
│   ├── standorttypen.ts       # NaiS-Waldstandortstypen + Baumarten
│   └── modelClasses.ts        # Modell-Output-Index -> Pflanzen-ID
├── services/
│   ├── naisService.ts         # Kern: Pflanze + Höhe -> Standort + Baumarten
│   ├── elevationService.ts    # GPS-Höhe + Validierung
│   └── recognitionService.ts  # tfjs: Modell laden (IndexedDB-first) + Inferenz
├── hooks/useModel.ts          # Modell-Lifecycle für die UI
├── components/                # CameraInput, ElevationInput, ResultCard
└── App.tsx
```

## Setup

```bash
npm install
npm run dev        # Dev-Server (Service Worker via devOptions aktiv)
npm run build      # Produktions-Build inkl. PWA-Precache
npm run preview    # Build lokal testen
```

> **Modell:** Lege das TF.js-Modell unter `public/models/zeigerpflanzen/` ab –
> siehe dortige `README.md`. Ohne Modell funktionieren NaiS-Logik und manuelle
> Pflanzenwahl trotzdem.

## Datenbasis erweitern

Die NaiS-Datenbank ist rein datengetrieben und wächst ohne Logikänderung:

- **Neue Zeigerpflanze:** Eintrag in `src/data/zeigerpflanzen.ts` (+ ggf.
  `modelClasses.ts`, wenn das Modell die Art kennt).
- **Neuer Standortstyp:** Eintrag in `src/data/standorttypen.ts` mit
  `hoehenstufen` + `erforderlicheEigenschaften` + `baumarten`.
- **Feinere Höhenstufen:** Bereiche in `src/data/hoehenstufen.ts` ergänzen.

Quelle für die Erweiterung: der NaiS-Ordner (`00_Mini_NaiS_vollstandig_2026.pdf`).

## Hinweis

Entscheidungs**hilfe** – ersetzt keine standortkundliche Beurteilung im Feld.
