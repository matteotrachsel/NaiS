import { restCreate, restList } from './firestoreRest';
import type { Beobachtung, Zone } from '@/types/karte';

const OBS = 'observations';
const ZONEN = 'zonen';

function ohneId<T extends { id?: string }>(obj: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = obj;
  void _id;
  return rest;
}

export async function speichereBeobachtung(b: Beobachtung): Promise<void> {
  await restCreate(OBS, { ...ohneId(b), createdAt: Date.now() });
}

export async function ladeBeobachtungen(max = 300): Promise<Beobachtung[]> {
  const docs = await restList(OBS, max);
  return (docs as unknown as Beobachtung[]).sort(
    (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
  );
}

export async function speichereZone(z: Zone): Promise<void> {
  await restCreate(ZONEN, { ...ohneId(z), createdAt: Date.now() });
}

export async function ladeZonen(max = 300): Promise<Zone[]> {
  const docs = await restList(ZONEN, max);
  return (docs as unknown as Zone[]).sort(
    (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
  );
}
