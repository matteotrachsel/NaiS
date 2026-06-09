/**
 * Client-Flag für die geteilte Karte.
 *
 * Der eigentliche Firestore-Zugriff läuft serverseitig über den Proxy
 * `/api/firestore` (siehe firestoreRest.ts + api/firestore.js). Im Client wird
 * nur noch geprüft, ob die Funktion grundsätzlich aktiv ist – der API-Key
 * liegt ausschliesslich serverseitig.
 */
export const firebaseKonfiguriert = Boolean(
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
);
