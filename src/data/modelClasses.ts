/**
 * Zuordnung der Modell-Output-Indizes zu Zeigerpflanzen-IDs.
 *
 * Die Reihenfolge MUSS exakt der Ausgabereihenfolge des trainierten
 * Modells (letzter Dense-/Softmax-Layer) entsprechen. Die IDs müssen mit
 * den `id`-Feldern in src/data/zeigerpflanzen.ts übereinstimmen (dort sind
 * inzwischen alle ~272 NaiS-Zeigerpflanzen erfasst).
 *
 * Aktuell deckt das Demo-Modell nur die drei Referenzarten ab. Für ein
 * eigenes (feinjustiertes) Modell diese Liste beim Training exportieren und
 * hier ablegen – idealerweise für alle erfassten Zeigerpflanzen-IDs.
 */
export const MODEL_CLASSES: string[] = [
  'vaccinium_myrtillus',
  'allium_ursinum',
  'rhododendron_ferrugineum',
];

/** Eingabegrösse des Modells (MobileNet v1/v2: 224x224). */
export const MODEL_INPUT_SIZE = 224;
