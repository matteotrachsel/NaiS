import {
  addDoc,
  collection,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { Beobachtung, Zone } from '@/types/karte';

const OBS = 'observations';
const ZONEN = 'zonen';

/** Wandelt einen Firestore-Timestamp in ms (Epoch) um. */
function zeitMs(v: unknown): number | undefined {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === 'number') return v;
  return undefined;
}

/** Entfernt das `id`-Feld vor dem Schreiben. */
function ohneId<T extends { id?: string }>(obj: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = obj;
  void _id;
  return rest;
}

export async function speichereBeobachtung(b: Beobachtung): Promise<void> {
  await addDoc(collection(getDb(), OBS), {
    ...ohneId(b),
    createdAt: serverTimestamp(),
  });
}

export async function ladeBeobachtungen(max = 2000): Promise<Beobachtung[]> {
  const snap = await getDocs(
    query(collection(getDb(), OBS), orderBy('createdAt', 'desc'), fbLimit(max)),
  );
  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    return { id: d.id, ...data, createdAt: zeitMs(data.createdAt) } as Beobachtung;
  });
}

export async function speichereZone(z: Zone): Promise<void> {
  await addDoc(collection(getDb(), ZONEN), {
    ...ohneId(z),
    createdAt: serverTimestamp(),
  });
}

export async function ladeZonen(max = 500): Promise<Zone[]> {
  const snap = await getDocs(
    query(collection(getDb(), ZONEN), orderBy('createdAt', 'desc'), fbLimit(max)),
  );
  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    return { id: d.id, ...data, createdAt: zeitMs(data.createdAt) } as Zone;
  });
}
