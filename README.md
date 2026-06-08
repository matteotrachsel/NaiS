# 🌲 NaiS Baumartenwahl – PWA

Progressive Web App, die Forstpersonal bei der Baumartenwahl nach **NaiS**
(Nachhaltigkeit und Erfolgskontrolle im Schutzwald) unterstützt. Suche und
Auswertung funktionieren **offline**; die Foto-Erkennung läuft online über
PlantNet.

## Workflow

1. **Foto & Erkennung** – Foto einer Zeigerpflanze; Erkennung über die
   **PlantNet-API** (online). Treffer, die NaiS-Zeigerpflanzen sind, lassen sich
   direkt übernehmen. Alternativ Textsuche (offline).
2. **Höhe** – Höhe über Meer per GPS *oder* manuell (Feld-Fallback).
3. **NaiS-Auswertung** – aus Pflanze(n) (Bodenökologie) + Höhe (Höhenstufe) →
   Waldstandortstyp + Baumartenempfehlung (offline).

## Tech-Stack

- **Vite + React + TypeScript**
- **vite-plugin-pwa** (Workbox) – App-Shell + Daten precached → Offline-Start
- **PlantNet-API** – Online-Bilderkennung (`my-api.plantnet.org`)
- **HTML5 Geolocation API** – Höhe via `coords.altitude`, manueller Fallback

## Projektstruktur

```
src/
├── config.ts                  # PlantNet-API-Key/Endpoint
├── types/nais.ts              # Domänen-Typen
├── data/
│   ├── hoehenstufen.ts        # Höhe (m ü. M.) -> Höhenstufe
│   ├── zeigerpflanzen.ts      # Zeigerpflanzen -> Bodenökologie
│   └── standorttypen.ts       # NaiS-Waldstandortstypen + Baumarten
├── services/
│   ├── naisService.ts         # Kern: Pflanze + Höhe -> Standort + Baumarten
│   ├── elevationService.ts    # GPS-Höhe + Validierung
│   └── recognitionService.ts  # PlantNet-Aufruf + Zuordnung zum NaiS-Katalog
├── hooks/                     # useInstallPrompt
├── components/                # CameraInput, PflanzenAuswahl, ElevationInput …
└── App.tsx
```

## Setup

```bash
npm install
npm run dev        # Dev-Server (Service Worker via devOptions aktiv)
npm run build      # Produktions-Build inkl. PWA-Precache
npm run preview    # Build lokal testen
```

> **PlantNet-API-Key:** in `src/config.ts` (Default) oder via Umgebungsvariable
> `VITE_PLANTNET_API_KEY`. Bei einer rein statischen PWA ist der Key im Client
> sichtbar – bei Bedarf rotieren/limitieren oder über eine serverlose
> Proxy-Funktion verbergen.

### Installation (PWA)

Die App ist installierbar (Home-Bildschirm, eigenes Fenster, Offline-Start):

- **Android/Chromium:** Ein Banner („App installieren") löst den nativen Dialog
  aus (`beforeinstallprompt`). Voraussetzung sind die generierten Icons
  (`python scripts/gen_icons.py` → `public/icons/`).
- **iOS/Safari:** keine native API – das Banner zeigt die Anleitung
  (Teilen → „Zum Home-Bildschirm").

Logik in `src/hooks/useInstallPrompt.ts`, UI in `src/components/InstallBanner.tsx`.

## Datenbasis

Die forstliche Datenbasis stammt direkt aus dem NaiS-Ordner
(`00_Mini_NaiS_vollstandig_2026.pdf`, Anhang 2A):

- **272 Zeigerpflanzen** (`src/data/zeigerpflanzen.ts`) – vollständige
  alphabetische NaiS-Zeigerpflanzenliste mit Höhenstufen und Zeigerwerten
  (sauer/basisch, Feuchte, Nährstoffe …).
- **143 Waldstandortstypen** (`src/data/standorttypen.ts`) – der vollständige
  NaiS-Katalog (Kap. 10), mit NaiS-Code, Höhenstufe (aus der Kapitelgruppe),
  Standortökologie und Baumarten (Bausteine in `src/data/baumarten.ts`).
- **Höhenstufen** (`src/data/hoehenstufen.ts`).

### Daten neu generieren

Zeigerpflanzen und Standortstypen sind aus dem PDF generiert (Quelldaten in
`scripts/*_quelle.*`):

```bash
python scripts/gen_zeigerpflanzen.py    # -> src/data/zeigerpflanzen.ts
python scripts/gen_standorttypen.py     # -> src/data/standorttypen.ts
```

### Erweitern / nachschärfen (ohne Logikänderung)

- **Standortstyp-Feinheiten:** einzelne Einträge in `src/data/standorttypen.ts`
  nachschärfen (z. B. Baumarten/Ökologie) oder die Regeln im Generator anpassen.
- **Zeigerpflanze:** `scripts/zeigerpflanzen_quelle.tsv` ergänzen + Skript
  neu ausführen. Die PlantNet-Erkennung ordnet automatisch über den
  lateinischen Namen zu (kein weiterer Schritt nötig).
- **Feinere Höhenstufen:** Bereiche in `src/data/hoehenstufen.ts` ergänzen.

## Hinweis

Entscheidungs**hilfe** – ersetzt keine standortkundliche Beurteilung im Feld.
