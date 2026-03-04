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

// ---------------------------------------------------------------------------
// OpenFarm plant lookup (https://openfarm.cc) – free, no API key required
// ---------------------------------------------------------------------------

export interface OpenFarmLookupResult {
  botanicalName: string;
  growingNotes: string;
  lightRequirement: LightRequirement;
  startIndoors: boolean;
  directSow: boolean;
  spacing: number | null; // inches, null if unknown
}

function mapSunRequirement(sun: string): LightRequirement {
  const s = sun.toLowerCase();
  if (s.includes('full sun') && (s.includes('partial') || s.includes('shade'))) return 'full-sun-to-partial-shade';
  if (s.includes('full sun')) return 'full-sun';
  if (s.includes('partial')) return 'partial-shade';
  if (s.includes('shade')) return 'shade';
  return 'full-sun';
}

function mapSowingMethod(method: string): { startIndoors: boolean; directSow: boolean } {
  const m = method.toLowerCase();
  if (m.includes('transplant') && m.includes('direct')) return { startIndoors: true, directSow: true };
  if (m.includes('direct')) return { startIndoors: false, directSow: true };
  if (m.includes('transplant')) return { startIndoors: true, directSow: false };
  return { startIndoors: true, directSow: false };
}

export async function lookupPlantByName(commonName: string): Promise<OpenFarmLookupResult | null> {
  try {
    const res = await fetch(
      `https://openfarm.cc/api/v1/crops?filter=${encodeURIComponent(commonName)}&page[size]=1`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const attrs = json?.data?.[0]?.attributes;
    if (!attrs) return null;

    // OpenFarm spread/row_spacing is in cm → convert to inches
    const spacingCm: number | null = attrs.spread ?? attrs.row_spacing ?? null;
    const spacingIn = spacingCm ? Math.round(spacingCm / 2.54) : null;

    return {
      botanicalName: attrs.binomial_name ?? '',
      growingNotes: attrs.description ?? '',
      lightRequirement: mapSunRequirement(attrs.sun_requirements ?? ''),
      ...mapSowingMethod(attrs.sowing_method ?? ''),
      spacing: spacingIn,
    };
  } catch {
    return null;
  }
}
