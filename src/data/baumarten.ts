import type { BaumartEmpfehlung } from '@/types/nais';

/**
 * Wiederverwendbare Baumarten-Bausteine für die Standortstypen.
 * Latein-Namen nach gängiger forstlicher Nomenklatur (CH).
 *
 * Factory-Funktionen, damit jede Verwendung eine eigene Objektinstanz
 * erhält (keine geteilten Referenzen zwischen Standortstypen).
 */
type Eignung = BaumartEmpfehlung['eignung'];

const art = (nameDe: string, nameLat: string) => (eignung: Eignung): BaumartEmpfehlung => ({
  nameDe,
  nameLat,
  eignung,
});

export const Fichte = art('Fichte', 'Picea abies');
export const Tanne = art('Weisstanne', 'Abies alba');
export const Buche = art('Buche', 'Fagus sylvatica');
export const Bergahorn = art('Bergahorn', 'Acer pseudoplatanus');
export const Esche = art('Esche', 'Fraxinus excelsior');
export const Bergulme = art('Bergulme', 'Ulmus glabra');
export const Sommerlinde = art('Sommerlinde', 'Tilia platyphyllos');
export const Winterlinde = art('Winterlinde', 'Tilia cordata');
export const Arve = art('Arve', 'Pinus cembra');
export const Laerche = art('Lärche', 'Larix decidua');
export const Waldfoehre = art('Waldföhre', 'Pinus sylvestris');
export const Bergfoehre = art('Bergföhre', 'Pinus mugo s.l.');
export const Vogelbeere = art('Vogelbeere', 'Sorbus aucuparia');
export const Mehlbeere = art('Mehlbeere', 'Sorbus aria');
export const Traubenkirsche = art('Traubenkirsche', 'Prunus padus');
export const Stieleiche = art('Stiel-/Traubeneiche', 'Quercus robur/petraea');
export const Flaumeiche = art('Flaumeiche', 'Quercus pubescens');
export const Hagebuche = art('Hagebuche', 'Carpinus betulus');
export const Hopfenbuche = art('Hopfenbuche', 'Ostrya carpinifolia');
export const Kastanie = art('Edelkastanie', 'Castanea sativa');
export const Birke = art('Birke', 'Betula pendula');
export const Gruenerle = art('Grünerle', 'Alnus viridis');
export const Weisserle = art('Weisserle', 'Alnus incana');
export const Schwarzerle = art('Schwarzerle', 'Alnus glutinosa');
export const Eibe = art('Eibe', 'Taxus baccata');
export const Robinie = art('Robinie', 'Robinia pseudoacacia');
export const Spitzahorn = art('Spitzahorn', 'Acer platanoides');
export const Sandbirke = art('Birke', 'Betula pubescens');
