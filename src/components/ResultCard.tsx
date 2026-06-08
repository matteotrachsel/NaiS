import type { AuswertungErgebnis } from '@/types/nais';

interface Props {
  ergebnis: AuswertungErgebnis | null;
}

const EIGNUNG_LABEL: Record<string, string> = {
  hauptbaumart: 'Hauptbaumart',
  nebenbaumart: 'Nebenbaumart',
  pionier: 'Pionier',
};

/** Zeigt das NaiS-Auswertungsergebnis: Standort + Baumartenempfehlung. */
export function ResultCard({ ergebnis }: Props) {
  if (!ergebnis) return null;

  const { pflanzen, eigenschaften, hoeheM, hoehenstufe, standorte, empfohleneBaumarten, unsicher, hinweise } =
    ergebnis;

  return (
    <section className={`card ergebnis ${unsicher ? 'ergebnis--unsicher' : ''}`}>
      <h2>Auswertung</h2>

      <dl className="meta">
        <div>
          <dt>Zeigerpflanze{pflanzen.length > 1 ? 'n' : ''}</dt>
          <dd>
            {pflanzen.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ', '}
                {p.nameDe} <em>({p.nameLat})</em>
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt>Bodenökologie</dt>
          <dd>{eigenschaften.join(', ')}</dd>
        </div>
        <div>
          <dt>Höhe / Stufe</dt>
          <dd>
            {hoeheM} m ü. M. · {hoehenstufe.label}
          </dd>
        </div>
      </dl>

      {standorte.length > 0 ? (
        <>
          <h3>Waldstandortstyp</h3>
          <ul className="standorte">
            {standorte.map((s) => (
              <li key={s.id}>
                <strong>
                  {s.name}
                  {s.naisCode ? ` · NaiS ${s.naisCode}` : ''}
                </strong>
                {s.beschreibung && <p>{s.beschreibung}</p>}
              </li>
            ))}
          </ul>

          <h3>Empfohlene Baumarten</h3>
          <ul className="baumarten">
            {empfohleneBaumarten.map((b) => (
              <li key={b.nameLat} className={`baumart baumart--${b.eignung}`}>
                <span className="baumart-name">
                  {b.nameDe} <em>({b.nameLat})</em>
                </span>
                <span className="baumart-eignung">{EIGNUNG_LABEL[b.eignung]}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="fehler">Kein passender Standortstyp gefunden.</p>
      )}

      {hinweise.length > 0 && (
        <div className="hinweise">
          {hinweise.map((h, i) => (
            <p key={i} className="hinweis">
              ⚠️ {h}
            </p>
          ))}
        </div>
      )}

      <p className="disclaimer">
        Entscheidungshilfe – ersetzt keine standortkundliche Beurteilung im Feld.
      </p>
    </section>
  );
}
