import { doc, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';

// Firestore paths:
//   Gardens index:  users/{uid}/meta/gardensIndex  → { gardens: GardenMeta[], updatedAt }
//   Garden data:    users/{ownerUid}/gardens/{gardenId}  → GardenStoreData blob + { memberUids?, ownerId? }
//   Legacy (v1):    users/{uid}/data/gardenData     → migrate on first login
//   Invite codes:   gardenInvites/{code}            → { ownerId, gardenId, gardenName, createdAt }

export interface GardenMeta {
  id: string;
  name: string;
  createdAt: string;
  /** If set, this garden is owned by another user and shared with you */
  sharedOwnerId?: string;
  /** 'owner' = you created it, 'member' = you joined via invite code */
  role?: 'owner' | 'member';
}

export const gardensIndexRef = (uid: string) =>
  doc(db, 'users', uid, 'meta', 'gardensIndex');

/**
 * Returns the Firestore ref for a garden doc.
 * For shared gardens, ownerUid differs from the current user's uid.
 */
export const gardenDocRef = (ownerUid: string, gardenId: string) =>
  doc(db, 'users', ownerUid, 'gardens', gardenId);

export const legacyDocRef = (uid: string) =>
  doc(db, 'users', uid, 'data', 'gardenData');

export const gardenInviteRef = (code: string) =>
  doc(db, 'gardenInvites', code);

// ── Gardens index ────────────────────────────────────────────────────────────

export async function loadGardensList(uid: string): Promise<GardenMeta[]> {
  const snap = await getDoc(gardensIndexRef(uid));
  if (!snap.exists()) return [];
  return (snap.data().gardens ?? []) as GardenMeta[];
}

export async function saveGardensList(uid: string, gardens: GardenMeta[]): Promise<void> {
  await setDoc(gardensIndexRef(uid), { gardens, updatedAt: new Date().toISOString() });
}

// ── Garden data ──────────────────────────────────────────────────────────────

export async function loadGardenData(ownerUid: string, gardenId: string): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(gardenDocRef(ownerUid, gardenId));
  return snap.exists() ? snap.data() : null;
}

export async function saveGardenData(ownerUid: string, gardenId: string, data: object): Promise<void> {
  await setDoc(gardenDocRef(ownerUid, gardenId), data);
}

export async function deleteGardenData(ownerUid: string, gardenId: string): Promise<void> {
  await deleteDoc(gardenDocRef(ownerUid, gardenId));
}

// ── Invite codes ─────────────────────────────────────────────────────────────

/** Creates a random 6-char uppercase invite code and stores it in Firestore. */
export async function createInviteCode(
  ownerUid: string,
  gardenId: string,
  gardenName: string,
): Promise<string> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await setDoc(gardenInviteRef(code), {
    ownerId: ownerUid,
    gardenId,
    gardenName,
    createdAt: new Date().toISOString(),
  });
  return code;
}

export interface InvitePayload {
  ownerId: string;
  gardenId: string;
  gardenName: string;
}

/** Looks up an invite code. Returns null if not found. */
export async function lookupInviteCode(code: string): Promise<InvitePayload | null> {
  const snap = await getDoc(gardenInviteRef(code.trim().toUpperCase()));
  if (!snap.exists()) return null;
  return snap.data() as InvitePayload;
}

// ── Membership ────────────────────────────────────────────────────────────────

/** Adds memberUid to the garden doc's memberUids array (Firestore arrayUnion). */
export async function addGardenMember(ownerUid: string, gardenId: string, memberUid: string): Promise<void> {
  await updateDoc(gardenDocRef(ownerUid, gardenId), {
    memberUids: arrayUnion(memberUid),
  });
}

/** Removes memberUid from the garden doc's memberUids array (Firestore arrayRemove). */
export async function removeGardenMember(ownerUid: string, gardenId: string, memberUid: string): Promise<void> {
  await updateDoc(gardenDocRef(ownerUid, gardenId), {
    memberUids: arrayRemove(memberUid),
  });
}
