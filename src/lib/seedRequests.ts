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
import { Seed, SeedRequest, PlantCategory, LightRequirement } from '../types';

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
  return snap.docs
    .map((d) => d.data() as Seed)
    .filter((s) => s.id && s.commonName && s.botanicalName);
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

async function fetchOpenFarm(query: string): Promise<OpenFarmLookupResult | null> {
  const res = await fetch(
    `https://openfarm.cc/api/v1/crops?filter=${encodeURIComponent(query)}&page[size]=1`,
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
}

/**
 * Looks up a plant on OpenFarm. Falls back through progressively simpler
 * queries: punctuation-stripped full query → last word → first word.
 * Punctuation is stripped from individual words so queries like
 * "basil, lettuce leaf" don't send "basil," (with comma) to the API.
 */
export async function lookupPlantByName(query: string): Promise<OpenFarmLookupResult | null> {
  try {
    const result = await fetchOpenFarm(query);
    if (result) return result;

    // Strip punctuation and try the cleaned full query (catches "basil, lettuce leaf" → "basil lettuce leaf")
    const cleaned = query.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (cleaned !== query.trim()) {
      const byCleaned = await fetchOpenFarm(cleaned);
      if (byCleaned) return byCleaned;
    }

    // Split cleaned query into words; try last word then first word
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const byLast = await fetchOpenFarm(words[words.length - 1]);
      if (byLast) return byLast;
      const byFirst = await fetchOpenFarm(words[0]);
      if (byFirst) return byFirst;
    }

    return null;
  } catch {
    return null;
  }
}
