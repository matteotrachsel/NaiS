import { useState } from 'react';
import { PflanzenCombobox } from '@/components/PflanzenCombobox';
import { ZEIGERPFLANZEN_BY_ID } from '@/data/zeigerpflanzen';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Erfassung mehrerer Zeigerpflanzen per Textsuche.
 * Gewählte Arten erscheinen als entfernbare Chips; über „＋" wird das
 * Suchfeld für eine weitere Art eingeblendet.
 */
export function PflanzenAuswahl({ selectedIds, onChange }: Props) {
  // Suchfeld initial offen, wenn noch keine Pflanze gewählt ist.
  const [sucheOffen, setSucheOffen] = useState(selectedIds.length === 0);

  function hinzufuegen(id: string) {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id]);
    setSucheOffen(false);
  }

  function entfernen(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  return (
    <section className="card">
      <h2>Zeigerpflanzen</h2>

      {selectedIds.length > 0 && (
        <ul className="pflanzen-chips">
          {selectedIds.map((id) => {
            const p = ZEIGERPFLANZEN_BY_ID[id];
            return (
              <li key={id} className="pflanze-chip">
                <span className="chip-name">
                  {p ? p.nameDe : id}
                  {p && <em> ({p.nameLat})</em>}
                </span>
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`${p ? p.nameDe : id} entfernen`}
                  onClick={() => entfernen(id)}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {sucheOffen ? (
        <PflanzenCombobox
          onSelect={hinzufuegen}
          excludeIds={selectedIds}
          autoFocus={selectedIds.length > 0}
        />
      ) : (
        <button
          type="button"
          className="btn-add"
          onClick={() => setSucheOffen(true)}
        >
          ＋ Zeigerpflanze hinzufügen
        </button>
      )}

      {selectedIds.length === 0 && (
        <p className="hinweis">
          Tippe einen Pflanzennamen (deutsch oder lateinisch) oder nutze die
          Kamera-Erkennung oben. Mehrere Zeigerpflanzen grenzen den Standort
          sicherer ein.
        </p>
      )}
    </section>
  );
}
