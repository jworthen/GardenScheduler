import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { PlantCategory, ShareReservation } from '../types';

// ── Firestore security rules needed ────────────────────────────────────────
// sharePages/{token}:        any authenticated or unauthenticated user can read;
//                            authenticated users can write (no per-doc ownership check needed
//                            since the token is the access control mechanism).
// shareReservations/{id}:    any user (including unauthenticated) can create;
//                            authenticated users can read documents where userId == request.auth.uid;
//                            authenticated users can update documents where userId == request.auth.uid.
// userProfiles/{uid}:        authenticated users can read/write their own doc only.
// ───────────────────────────────────────────────────────────────────────────

// ── Token generation ────────────────────────────────────────────────────────

function generateShareToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // omit confusable chars
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── User profile (shareToken) ───────────────────────────────────────────────

export async function getOrCreateShareToken(userId: string): Promise<string> {
  const ref = doc(db, 'userProfiles', userId);
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data().shareToken) {
    return snap.data().shareToken as string;
  }
  const token = generateShareToken();
  await setDoc(ref, { shareToken: token }, { merge: true });
  return token;
}

// ── Share page ──────────────────────────────────────────────────────────────

export interface SharePagePlanting {
  plantingId: string;
  seedName: string;
  varietyName?: string;
  category: PlantCategory;
  color: string;
  availableToShare: number;
  reservedCount: number;
  transplantDate?: string;
  firstBloomDate?: string;
  firstHarvestDate?: string;
}

export interface SharePage {
  token: string;
  userId: string;
  gardenName: string;
  plantings: SharePagePlanting[];
  updatedAt: number;
}

export async function getSharePage(token: string): Promise<SharePage | null> {
  const snap = await getDoc(doc(db, 'sharePages', token));
  if (!snap.exists()) return null;
  return snap.data() as SharePage;
}

export async function updateSharePage(
  token: string,
  userId: string,
  gardenName: string,
  plantings: SharePagePlanting[],
): Promise<void> {
  await setDoc(doc(db, 'sharePages', token), {
    token,
    userId,
    gardenName,
    plantings,
    updatedAt: Date.now(),
  });
}

// ── Reservations ────────────────────────────────────────────────────────────

export async function createReservation(
  data: Omit<ShareReservation, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(collection(db, 'shareReservations'), {
    ...data,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getReservationsForOwner(userId: string): Promise<ShareReservation[]> {
  const q = query(collection(db, 'shareReservations'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ShareReservation))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateReservationStatus(
  reservationId: string,
  status: 'confirmed' | 'cancelled',
): Promise<void> {
  await updateDoc(doc(db, 'shareReservations', reservationId), {
    status,
    updatedAt: Date.now(),
  });
}
