/**
 * Konfiguration für den Firestore-Zugriff über die REST-API.
 *
 * Bewusst OHNE Firebase-SDK: dessen WebChannel-/Long-Polling-Transport bleibt
 * in manchen Mobilfunk-/Proxy-Netzen hängen. Stattdessen sprechen wir die
 * Firestore-REST-API mit einzelnen HTTPS-Requests an (siehe firestoreRest.ts).
 *
 * `apiKey`/`projectId` sind die öffentliche Firebase-Web-Config; der Schutz
 * erfolgt über die Firestore-Security-Rules.
 */
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;

/** true, wenn projectId + apiKey gesetzt sind (Karte/Speichern verfügbar). */
export const firebaseKonfiguriert = Boolean(projectId && apiKey);

export const FIREBASE = { projectId, apiKey };
