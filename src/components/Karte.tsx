import { useEffect, useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  Popup,
  Rectangle,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import { firebaseKonfiguriert } from '@/services/firebase';
import {
  ladeBeobachtungen,
  ladeZonen,
  speichereZone,
} from '@/services/observationService';
import {
  beobachtungsFarbe,
  dominanteAusEigenschaften,
  dominanteEigenschaft,
  dominanterStandort,
  farbeFuer,
  rasterAggregation,
  punktInPolygon,
} from '@/services/aggregation';
import type { Beobachtung, Zone, ZonePunkt } from '@/types/karte';
import { MapLegende } from '@/components/MapLegende';

const CH_MITTE: [number, number] = [46.8, 8.23];

/** Umschaltbare BAFU-Overlays (geo.admin.ch, WMTS). */
interface BafuLayer {
  id: string;
  name: string; // Toolbar-Label
  titel: string; // Legenden-Titel
  url: string;
  legende: string;
  info: string;
}
const BAFU_LAYERS: BafuLayer[] = [
  {
    id: 'ch.bafu.wald-standortsregionen',
    name: 'Standortregionen',
    titel: 'Waldstandortsregionen (BAFU)',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.bafu.wald-standortsregionen/default/current/3857/{z}/{x}/{y}.png',
    legende:
      'https://api3.geo.admin.ch/static/images/legends/ch.bafu.wald-standortsregionen_de.png',
    info: 'Regionen nach Klima, Waldvegetation und Höhenstufen (Frehner et al. 2005). Keine Buche in «Nördliche Zwischenalpen ohne Buche», «Kontinentale Hochalpen» und «Südliche Zwischenalpen».',
  },
  {
    id: 'ch.bafu.wald-vegetationshoehenstufen_1975',
    name: 'Höhenstufen',
    titel: 'Vegetationshöhenstufen (BAFU)',
    url: 'https://wmts.geo.admin.ch/1.0.0/ch.bafu.wald-vegetationshoehenstufen_1975/default/current/3857/{z}/{x}/{y}.png',
    legende:
      'https://api3.geo.admin.ch/static/images/legends/ch.bafu.wald-vegetationshoehenstufen_1975_de.png',
    info: 'Vegetationshöhenstufen von kollin bis alpin (Frehner et al. 2005).',
  },
];

interface Props {
  online: boolean;
}

/** Passt die Kartenansicht an die vorhandenen Fundpunkte an. */
function FitBounds({ punkte }: { punkte: Beobachtung[] }) {
  const map = useMap();
  useEffect(() => {
    if (punkte.length === 0) return;
    const bounds: LatLngBoundsExpression = punkte.map((p) => [p.lat, p.lon]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [punkte, map]);
  return null;
}

/** Fängt Karten-Klicks im Zeichenmodus ab. */
function ZeichenKlicks({
  aktiv,
  onPunkt,
}: {
  aktiv: boolean;
  onPunkt: (p: ZonePunkt) => void;
}) {
  useMapEvents({
    click(e) {
      if (aktiv) onPunkt({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

export function Karte({ online }: Props) {
  const [beobachtungen, setBeobachtungen] = useState<Beobachtung[]>([]);
  const [zonen, setZonen] = useState<Zone[]>([]);
  const [laden, setLaden] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);

  const [rasterAn, setRasterAn] = useState(false);
  const [aktiveLayer, setAktiveLayer] = useState<string[]>([]);
  const [zeichnen, setZeichnen] = useState(false);

  const toggleLayer = (id: string) =>
    setAktiveLayer((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  const [entwurf, setEntwurf] = useState<ZonePunkt[]>([]);
  const [zoneName, setZoneName] = useState('');
  const [speichereZ, setSpeichereZ] = useState(false);

  useEffect(() => {
    if (!firebaseKonfiguriert || !online) {
      setLaden(false);
      return;
    }
    let abbruch = false;
    (async () => {
      try {
        const [b, z] = await Promise.all([ladeBeobachtungen(), ladeZonen()]);
        if (!abbruch) {
          setBeobachtungen(b);
          setZonen(z);
        }
      } catch {
        if (!abbruch) setFehler('Daten konnten nicht geladen werden.');
      } finally {
        if (!abbruch) setLaden(false);
      }
    })();
    return () => {
      abbruch = true;
    };
  }, [online]);

  const raster = useMemo(
    () => (rasterAn ? rasterAggregation(beobachtungen, 0.01) : []),
    [rasterAn, beobachtungen],
  );

  // Aggregation des aktuellen Zonen-Entwurfs.
  const entwurfAggregat = useMemo(() => {
    if (entwurf.length < 3) return null;
    const drin = beobachtungen.filter((o) => punktInPolygon(o, entwurf));
    return {
      anzahl: drin.length,
      eigenschaft: dominanteEigenschaft(drin),
      standort: dominanterStandort(drin),
      eigenschaftenAlle: [...new Set(drin.flatMap((o) => o.eigenschaften))],
      enthalten: drin,
    };
  }, [entwurf, beobachtungen]);

  function startZeichnen() {
    setZeichnen(true);
    setEntwurf([]);
    setZoneName('');
  }
  function abbrechen() {
    setZeichnen(false);
    setEntwurf([]);
    setZoneName('');
  }

  async function zoneSpeichern() {
    if (!entwurfAggregat || entwurf.length < 3 || !zoneName.trim()) return;
    setSpeichereZ(true);
    try {
      const a = entwurfAggregat;
      const neu: Zone = {
        name: zoneName.trim(),
        polygon: entwurf,
        standorttypId: a.standort?.id ?? null,
        standorttypName: a.standort?.name ?? null,
        naisCode: a.standort?.naisCode ?? null,
        eigenschaften: a.eigenschaftenAlle,
        anzahlPunkte: a.anzahl,
      };
      await speichereZone(neu);
      setZonen((z) => [{ ...neu, createdAt: Date.now() }, ...z]);
      abbrechen();
    } catch {
      setFehler('Zone konnte nicht gespeichert werden.');
    } finally {
      setSpeichereZ(false);
    }
  }

  if (!firebaseKonfiguriert) {
    return (
      <section className="card">
        <h2>Karte</h2>
        <p className="hinweis">
          ℹ️ Die geteilte Karte ist noch nicht konfiguriert. Sobald Firebase
          eingerichtet ist, erscheinen hier alle Fundpunkte.
        </p>
      </section>
    );
  }
  if (!online) {
    return (
      <section className="card">
        <h2>Karte</h2>
        <p className="hinweis">
          ℹ️ Die Karte benötigt eine Internetverbindung. Bestimmung und Suche
          funktionieren weiterhin offline.
        </p>
      </section>
    );
  }

  return (
    <div className="karte-wrap">
      <div className="karte-toolbar">
        <button
          className={rasterAn ? 'tool aktiv' : 'tool'}
          onClick={() => setRasterAn((v) => !v)}
        >
          ▦ Raster
        </button>
        {BAFU_LAYERS.map((l) => (
          <button
            key={l.id}
            className={aktiveLayer.includes(l.id) ? 'tool aktiv' : 'tool'}
            onClick={() => toggleLayer(l.id)}
            title={`${l.titel} ein-/ausblenden`}
          >
            🗺 {l.name}
          </button>
        ))}
        {zeichnen ? (
          <>
            <button className="tool" onClick={abbrechen}>
              Abbrechen
            </button>
            <span className="tool-info">
              {entwurf.length} Punkt{entwurf.length === 1 ? '' : 'e'}
              {entwurf.length < 3 ? ' (min. 3)' : ''}
            </span>
          </>
        ) : (
          <button className="tool aktiv-rot" onClick={startZeichnen}>
            ✎ Zone zeichnen
          </button>
        )}
        <span className="tool-zaehler">{beobachtungen.length} Fundpunkte</span>
      </div>

      <div className="karte-flaeche">
        <MapContainer center={CH_MITTE} zoom={8} className="leaflet-karte">
          <TileLayer
            url="https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg"
            attribution='&copy; <a href="https://www.swisstopo.admin.ch">swisstopo</a>'
            maxZoom={18}
          />

          {/* BAFU-Overlays (über Basiskarte, unter Markern) */}
          {BAFU_LAYERS.filter((l) => aktiveLayer.includes(l.id)).map((l) => (
            <TileLayer
              key={l.id}
              url={l.url}
              opacity={0.6}
              maxZoom={18}
              attribution={`${l.titel} &copy; <a href="https://www.bafu.admin.ch">BAFU</a>`}
            />
          ))}

          {!zeichnen && <FitBounds punkte={beobachtungen} />}

          {/* Raster-Aggregation */}
          {raster.map((z, i) => (
            <Rectangle
              key={`r${i}`}
              bounds={[
                [z.sued, z.west],
                [z.nord, z.ost],
              ]}
              pathOptions={{
                color: z.farbe,
                weight: 1,
                fillOpacity: 0.35,
              }}
            >
              <Tooltip>
                {z.anzahl} Fund{z.anzahl === 1 ? '' : 'e'} ·{' '}
                {z.eigenschaft ?? 'gemischt'}
                {z.standort ? ` · ${z.standort.name}` : ''}
              </Tooltip>
            </Rectangle>
          ))}

          {/* Gespeicherte Zonen */}
          {zonen.map((z) => (
            <Polygon
              key={z.id ?? z.name}
              positions={z.polygon.map((p) => [p.lat, p.lon])}
              pathOptions={{
                color: '#d8232a',
                weight: 2,
                fillColor: farbeFuer(dominanteAusEigenschaften(z.eigenschaften)),
                fillOpacity: 0.18,
              }}
            >
              <Popup>
                <strong>{z.name}</strong>
                <br />
                {z.standorttypName
                  ? `${z.naisCode ? z.naisCode + ' · ' : ''}${z.standorttypName}`
                  : 'Kein dominanter Standortstyp'}
                <br />
                <small>{z.anzahlPunkte} Fundpunkte einbezogen</small>
              </Popup>
            </Polygon>
          ))}

          {/* Fundpunkte */}
          {beobachtungen.map((o) => (
            <CircleMarker
              key={o.id}
              center={[o.lat, o.lon]}
              radius={6}
              pathOptions={{
                color: '#1a1a1a',
                weight: 1,
                fillColor: beobachtungsFarbe(o),
                fillOpacity: 0.85,
              }}
            >
              <Popup>
                <strong>{o.pflanzenText}</strong>
                <br />
                {o.eigenschaften.join(', ')}
                <br />
                {o.hoeheM != null ? `${o.hoeheM} m ü. M. · ` : ''}
                {o.hoehenstufe ?? ''}
                {o.standorttypName ? (
                  <>
                    <br />
                    {o.naisCode ? o.naisCode + ' · ' : ''}
                    {o.standorttypName}
                  </>
                ) : null}
              </Popup>
            </CircleMarker>
          ))}

          {/* Zonen-Entwurf */}
          <ZeichenKlicks
            aktiv={zeichnen}
            onPunkt={(p) => setEntwurf((e) => [...e, p])}
          />
          {zeichnen && entwurf.length > 0 && (
            <>
              <Polyline
                positions={[...entwurf, entwurf[0]].map((p) => [p.lat, p.lon])}
                pathOptions={{ color: '#d8232a', weight: 2, dashArray: '5 5' }}
              />
              {entwurf.map((p, i) => (
                <CircleMarker
                  key={`e${i}`}
                  center={[p.lat, p.lon]}
                  radius={4}
                  pathOptions={{ color: '#d8232a', fillColor: '#fff', fillOpacity: 1 }}
                />
              ))}
            </>
          )}
        </MapContainer>

        <MapLegende />

        {aktiveLayer.length > 0 && (
          <div className="bafu-legenden">
            {BAFU_LAYERS.filter((l) => aktiveLayer.includes(l.id)).map((l) => (
              <div key={l.id} className="bafu-legende">
                <strong>{l.titel}</strong>
                <p>{l.info}</p>
                <img src={l.legende} alt={`Legende ${l.titel}`} />
              </div>
            ))}
            <a
              className="bafu-quelle"
              href="https://www.gebirgswald.ch/de/nais-download.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Details zu NaiS ↗
            </a>
          </div>
        )}
      </div>

      {/* Panel zum Abschliessen einer Zone */}
      {zeichnen && (
        <div className="zone-panel">
          {entwurf.length < 3 ? (
            <p className="hinweis">
              Tippe auf die Karte, um die Eckpunkte des Waldgebiets zu setzen
              (mindestens 3).
            </p>
          ) : (
            <>
              <div className="zone-aggregat">
                <span>
                  <strong>{entwurfAggregat?.anzahl ?? 0}</strong> Fundpunkte in der
                  Zone
                </span>
                <span>
                  Ökologie:{' '}
                  <strong>{entwurfAggregat?.eigenschaft ?? 'gemischt/keine'}</strong>
                </span>
                <span>
                  Standort:{' '}
                  <strong>
                    {entwurfAggregat?.standort
                      ? `${entwurfAggregat.standort.naisCode ?? ''} ${entwurfAggregat.standort.name}`
                      : 'kein dominanter Typ'}
                  </strong>
                </span>
              </div>
              <div className="zone-form">
                <input
                  type="text"
                  placeholder="Name des Waldgebiets …"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  maxLength={100}
                />
                <button
                  className="btn-primary"
                  onClick={zoneSpeichern}
                  disabled={!zoneName.trim() || speichereZ}
                >
                  {speichereZ ? 'Speichere …' : 'Zone speichern'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {laden && <p className="hinweis karte-status">Lade Fundpunkte …</p>}
      {fehler && <p className="fehler karte-status">{fehler}</p>}
    </div>
  );
}
