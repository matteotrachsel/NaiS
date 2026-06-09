import { OEKO_FARBE } from '@/services/aggregation';

const EINTRAEGE: { label: string; key: keyof typeof OEKO_FARBE }[] = [
  { label: 'sauer', key: 'sauer' },
  { label: 'basisch', key: 'basisch' },
  { label: 'feucht/nass', key: 'feucht' },
  { label: 'trocken', key: 'trocken' },
  { label: 'neutral/frisch', key: 'neutral' },
];

/** Farb-Legende der Bodenökologie (über der Karte). */
export function MapLegende() {
  return (
    <div className="map-legende" aria-label="Legende Bodenökologie">
      <span className="legende-titel">Bodenökologie</span>
      {EINTRAEGE.map((e) => (
        <span key={e.key} className="legende-item">
          <span className="legende-punkt" style={{ background: OEKO_FARBE[e.key] }} />
          {e.label}
        </span>
      ))}
    </div>
  );
}
