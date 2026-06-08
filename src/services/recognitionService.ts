import * as tf from '@tensorflow/tfjs';
import { MODEL_CLASSES, MODEL_INPUT_SIZE } from '@/data/modelClasses';

/**
 * Offline-Bilderkennung mit TensorFlow.js.
 *
 * Strategie für 100 % Offline-Betrieb:
 *  1. Beim ersten Start wird das Modell EINMAL aus /models/ geladen
 *     (vom Service Worker precached) und anschliessend in IndexedDB
 *     gespeichert ('indexeddb://nais-zeigerpflanzen-model').
 *  2. Bei jedem weiteren Start wird zuerst versucht, das Modell direkt
 *     aus IndexedDB zu laden – kein Netzwerk, kein API-Call.
 *
 * So läuft die Inferenz vollständig lokal im Browser.
 */

const IDB_MODEL_URL = 'indexeddb://nais-zeigerpflanzen-model';
const HTTP_MODEL_URL = '/models/zeigerpflanzen/model.json';

export interface Vorhersage {
  pflanzenId: string;
  /** Wahrscheinlichkeit 0..1 */
  konfidenz: number;
}

/**
 * Wird geworfen, wenn (noch) kein Erkennungsmodell hinterlegt ist
 * (z. B. `/models/zeigerpflanzen/model.json` fehlt → 404). Das ist ein
 * erwarteter Zustand, kein technischer Fehler – die App bleibt voll
 * nutzbar (Bestimmung per Textsuche/Manuell).
 */
export class ModellNichtVerfuegbarError extends Error {
  constructor() {
    super('Es ist noch kein Bilderkennungs-Modell hinterlegt.');
    this.name = 'ModellNichtVerfuegbarError';
  }
}

let modelPromise: Promise<tf.GraphModel | tf.LayersModel> | null = null;

/**
 * Lädt das Modell (IndexedDB-first) und cached die Promise, damit es pro
 * Session nur einmal in den Speicher geladen wird.
 */
export async function ladeModell(
  onStatus?: (status: string) => void,
): Promise<tf.GraphModel | tf.LayersModel> {
  if (modelPromise) return modelPromise;

  modelPromise = (async () => {
    await tf.ready();

    // 1) Versuch: aus IndexedDB (offline, schnell)
    try {
      onStatus?.('Modell wird aus dem lokalen Cache geladen …');
      const model = await loadAnyModel(IDB_MODEL_URL);
      onStatus?.('Modell bereit (lokaler Cache).');
      return model;
    } catch {
      // noch nicht im IndexedDB -> weiter zu Schritt 2
    }

    // 2) Erstinstallation: aus /models/ laden (vom SW precached) und speichern
    onStatus?.('Modell wird erstmalig vorbereitet (einmalig) …');
    let model: tf.GraphModel | tf.LayersModel;
    try {
      model = await loadAnyModel(HTTP_MODEL_URL);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Kein Modell hinterlegt (404) bzw. nicht ladbar -> erwarteter Zustand.
      if (/404|failed to parse model json|failed to fetch|networkerror/i.test(msg)) {
        // Promise zurücksetzen, damit ein späterer Versuch (Modell nachgeliefert)
        // erneut laden kann.
        modelPromise = null;
        throw new ModellNichtVerfuegbarError();
      }
      modelPromise = null;
      throw e;
    }
    try {
      await model.save(IDB_MODEL_URL);
      onStatus?.('Modell im lokalen Cache gespeichert – ab jetzt voll offline.');
    } catch (e) {
      // Speichern fehlgeschlagen (z. B. Speicherlimit) -> trotzdem nutzbar
      console.warn('Modell konnte nicht in IndexedDB gespeichert werden:', e);
      onStatus?.('Modell geladen (Cache-Speicherung übersprungen).');
    }
    return model;
  })();

  return modelPromise;
}

/** Lädt wahlweise ein GraphModel oder LayersModel (je nach Export). */
async function loadAnyModel(url: string): Promise<tf.GraphModel | tf.LayersModel> {
  try {
    return await tf.loadGraphModel(url);
  } catch {
    return await tf.loadLayersModel(url);
  }
}

/**
 * Wandelt ein Bild-Element in einen normalisierten Modell-Input-Tensor um.
 * Skaliert auf MODEL_INPUT_SIZE und normalisiert auf [0, 1].
 */
function preprocess(img: HTMLImageElement | HTMLCanvasElement): tf.Tensor {
  return tf.tidy(() => {
    const tensor = tf.browser
      .fromPixels(img)
      .resizeBilinear([MODEL_INPUT_SIZE, MODEL_INPUT_SIZE])
      .toFloat()
      .div(255)
      .expandDims(0); // [1, H, W, 3]
    return tensor;
  });
}

/**
 * Führt die Klassifikation aus und liefert die Top-k-Vorhersagen,
 * absteigend nach Konfidenz.
 */
export async function erkennePflanze(
  img: HTMLImageElement | HTMLCanvasElement,
  topK = 3,
): Promise<Vorhersage[]> {
  const model = await ladeModell();
  const input = preprocess(img);

  const logits = model.predict(input) as tf.Tensor;
  // Falls das Modell rohe Logits liefert, in Wahrscheinlichkeiten wandeln.
  const probs = tf.tidy(() => {
    const sum = logits.sum();
    // grobe Heuristik: Summe ~1 -> bereits Softmax, sonst Softmax anwenden
    return Math.abs(sum.dataSync()[0] - 1) < 1e-3 ? logits.clone() : tf.softmax(logits);
  });

  const values = await probs.data();
  input.dispose();
  logits.dispose();
  probs.dispose();

  return Array.from(values)
    .map((konfidenz, i) => ({
      pflanzenId: MODEL_CLASSES[i] ?? `klasse_${i}`,
      konfidenz,
    }))
    .sort((a, b) => b.konfidenz - a.konfidenz)
    .slice(0, topK);
}

/** Hilfsfunktion: lädt eine Bilddatei in ein HTMLImageElement. */
export function dateiZuBild(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Bild konnte nicht geladen werden.'));
    };
    img.src = url;
  });
}

/** Prüft, ob das Modell bereits offline im IndexedDB liegt. */
export async function istModellGecacht(): Promise<boolean> {
  try {
    const models = await tf.io.listModels();
    return IDB_MODEL_URL in models;
  } catch {
    return false;
  }
}
