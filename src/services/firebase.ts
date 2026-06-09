import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase-/Firestore-Anbindung für die geteilte Fundpunkt-Karte.
 *
 * Die Web-Config ist – wie üblich bei Firebase – öffentlich und darf im
 * Client liegen; der Schutz erfolgt über die Firestore-Security-Rules
 * (siehe firestore.rules). Werte via Umgebungsvariablen `VITE_FIREBASE_*`.
 */
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** true, wenn die Firebase-Config gesetzt ist (Karte/Speichern verfügbar). */
export const firebaseKonfiguriert = Boolean(cfg.apiKey && cfg.projectId);

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

/** Liefert die Firestore-Instanz (lazy initialisiert). */
export function getDb(): Firestore {
  if (!firebaseKonfiguriert) {
    throw new Error('Firebase ist nicht konfiguriert (VITE_FIREBASE_* fehlen).');
  }
  if (!db) {
    app = initializeApp(cfg as Record<string, string>);
    // Long-Polling automatisch erkennen -> robuster in Mobilfunk-/Proxy-Netzen,
    // in denen der WebChannel-Transport sonst hängen bleiben kann.
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  }
  return db;
}
