import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Seed, SeedRequest, PlantCategory } from '../types';

// Firestore security rules needed:
// seedRequests: authenticated users can create (userId == request.userId),
//   read their own; admin UID can read/write all.
// communitySeeds: any authenticated user can read; admin can write.

const DAILY_RATE_LIMIT = 5;

export async function getUserRequests(userId: string): Promise<SeedRequest[]> {
  const q = query(collection(db, 'seedRequests'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SeedRequest));
  return requests.sort((a, b) => b.createdAt - a.createdAt);
}

export async function checkDailyRateLimit(userId: string): Promise<boolean> {
  const requests = await getUserRequests(userId);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = requests.filter((r) => r.createdAt >= startOfDay.getTime()).length;
  return todayCount < DAILY_RATE_LIMIT;
}

export async function submitSeedRequest(
  userId: string,
  userEmail: string,
  category: PlantCategory,
  commonName: string,
  notes: string,
): Promise<string> {
  const allowed = await checkDailyRateLimit(userId);
  if (!allowed) {
    throw new Error(`You can submit up to ${DAILY_RATE_LIMIT} requests per day. Please try again tomorrow.`);
  }
  const docRef = await addDoc(collection(db, 'seedRequests'), {
    userId,
    userEmail,
    category,
    commonName: commonName.trim(),
    notes: notes.trim(),
    status: 'pending',
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function getAllRequests(): Promise<SeedRequest[]> {
  const snap = await getDocs(collection(db, 'seedRequests'));
  const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SeedRequest));
  return requests.sort((a, b) => b.createdAt - a.createdAt);
}

export async function approveRequest(
  requestId: string,
  seed: Seed,
  reviewNotes?: string,
): Promise<void> {
  await setDoc(doc(db, 'communitySeeds', seed.id), seed);
  await updateDoc(doc(db, 'seedRequests', requestId), {
    status: 'approved',
    reviewNotes: reviewNotes ?? '',
    reviewedAt: Date.now(),
  });
}

export async function rejectRequest(requestId: string, reviewNotes: string): Promise<void> {
  await updateDoc(doc(db, 'seedRequests', requestId), {
    status: 'rejected',
    reviewNotes,
    reviewedAt: Date.now(),
  });
}

export async function getCommunitySeeds(): Promise<Seed[]> {
  const snap = await getDocs(collection(db, 'communitySeeds'));
  return snap.docs.map((d) => d.data() as Seed);
}
