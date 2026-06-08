import { useId, useMemo, useRef, useState } from 'react';
import { ZEIGERPFLANZEN } from '@/data/zeigerpflanzen';
import type { Zeigerpflanze } from '@/types/nais';

interface Props {
  /** wird mit der gewählten Pflanzen-ID aufgerufen */
  onSelect: (id: string) => void;
  /** bereits gewählte IDs (werden aus den Vorschlägen ausgeblendet) */
  excludeIds?: string[];
  autoFocus?: boolean;
  placeholder?: string;
}

const MAX_TREFFER = 8;

/** Normalisiert für tolerante Suche: lowercase + Umlaute/Akzente vereinfacht. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/[éèê]/g, 'e')
    .replace(/[áàâ]/g, 'a')
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c');
}

/**
 * Offline-Autocomplete für Zeigerpflanzen. Sucht im deutschen UND
 * lateinischen Namen (Teilstring), zeigt eine eigene Vorschlagsliste und
 * meldet die gewählte ID zurück. Kein externes Paket nötig.
 */
export function PflanzenCombobox({ onSelect, excludeIds = [], autoFocus, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  const listId = useId();
  const blurTimer = useRef<number | undefined>(undefined);

  const treffer = useMemo<Zeigerpflanze[]>(() => {
    const q = norm(query.trim());
    if (!q) return [];
    const exclude = new Set(excludeIds);
    const res: Zeigerpflanze[] = [];
    for (const p of ZEIGERPFLANZEN) {
      if (exclude.has(p.id)) continue;
      if (norm(p.nameDe).includes(q) || norm(p.nameLat).includes(q)) {
        res.push(p);
        if (res.length >= MAX_TREFFER) break;
      }
    }
    return res;
  }, [query, excludeIds]);

  function waehle(p: Zeigerpflanze | undefined) {
    if (!p) return;
    onSelect(p.id);
    setQuery('');
    setOffen(false);
    setAktiv(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!offen || treffer.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAktiv((i) => (i + 1) % treffer.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAktiv((i) => (i - 1 + treffer.length) % treffer.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      waehle(treffer[aktiv]);
    } else if (e.key === 'Escape') {
      setOffen(false);
    }
  }

  return (
    <div className="combobox">
      <input
        type="text"
        role="combobox"
        aria-expanded={offen && treffer.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoFocus={autoFocus}
        placeholder={placeholder ?? 'Zeigerpflanze suchen (deutsch oder lateinisch) …'}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOffen(true);
          setAktiv(0);
        }}
        onFocus={() => setOffen(true)}
        onKeyDown={onKeyDown}
        // Blur verzögern, damit ein Klick auf einen Vorschlag noch greift.
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOffen(false), 120);
        }}
      />

      {offen && treffer.length > 0 && (
        <ul className="suggestions" id={listId} role="listbox">
          {treffer.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={i === aktiv}
              className={i === aktiv ? 'suggestion aktiv' : 'suggestion'}
              onMouseEnter={() => setAktiv(i)}
              // onMouseDown statt onClick: feuert vor dem Input-Blur.
              onMouseDown={(e) => {
                e.preventDefault();
                window.clearTimeout(blurTimer.current);
                waehle(p);
              }}
            >
              <span className="s-de">{p.nameDe}</span>
              <span className="s-lat">{p.nameLat}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
