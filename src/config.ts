/**
 * Client-Konfiguration.
 *
 * Die Foto-Erkennung läuft über einen eigenen Proxy-Endpoint (`/api/identify`),
 * der das Bild serverseitig an PlantNet weiterreicht. Dadurch entfällt das
 * CORS-/403-Problem direkter Browser-Aufrufe, und der PlantNet-API-Key bleibt
 * serverseitig (Umgebungsvariable `PLANTNET_API_KEY`) – nie im Client-Bundle.
 */
export const IDENTIFY_ENDPOINT = '/api/identify';
