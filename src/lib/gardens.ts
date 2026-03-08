import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

// Firestore paths:
//   Gardens index:  users/{uid}/meta/gardensIndex  → { gardens: GardenMeta[], updatedAt }
//   Garden data:    users/{uid}/gardens/{gardenId}  → GardenStoreData blob
//   Legacy (v1):    users/{uid}/data/gardenData     → migrate on first login

export interface GardenMeta {
  id: string;
  name: string;
  createdAt: string;
}

export const gardensIndexRef = (uid: string) =>
  doc(db, 'users', uid, 'meta', 'gardensIndex');

export const gardenDocRef = (uid: string, gardenId: string) =>
  doc(db, 'users', uid, 'gardens', gardenId);

export const legacyDocRef = (uid: string) =>
  doc(db, 'users', uid, 'data', 'gardenData');

export async function loadGardensList(uid: string): Promise<GardenMeta[]> {
  const snap = await getDoc(gardensIndexRef(uid));
  if (!snap.exists()) return [];
  return (snap.data().gardens ?? []) as GardenMeta[];
}

export async function saveGardensList(uid: string, gardens: GardenMeta[]): Promise<void> {
  await setDoc(gardensIndexRef(uid), { gardens, updatedAt: new Date().toISOString() });
}

export async function loadGardenData(uid: string, gardenId: string): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(gardenDocRef(uid, gardenId));
  return snap.exists() ? snap.data() : null;
}

export async function saveGardenData(uid: string, gardenId: string, data: object): Promise<void> {
  await setDoc(gardenDocRef(uid, gardenId), data);
}

export async function deleteGardenData(uid: string, gardenId: string): Promise<void> {
  await deleteDoc(gardenDocRef(uid, gardenId));
}
