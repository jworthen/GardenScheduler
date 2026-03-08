import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

// Firestore security rules needed:
// feedbackSubmissions: authenticated users can create (userId == request.userId);
//   users can read their own; admin UID can read/update all.

export type FeedbackCategory = 'bug' | 'feature' | 'general';
export type FeedbackStatus = 'new' | 'read' | 'resolved';

export interface FeedbackSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  category: FeedbackCategory;
  message: string;
  status: FeedbackStatus;
  createdAt: number;
}

const DAILY_RATE_LIMIT = 5;

async function getUserFeedback(userId: string): Promise<FeedbackSubmission[]> {
  const q = query(collection(db, 'feedbackSubmissions'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedbackSubmission));
}

async function checkDailyRateLimit(userId: string): Promise<boolean> {
  const submissions = await getUserFeedback(userId);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = submissions.filter((s) => s.createdAt >= startOfDay.getTime()).length;
  return todayCount < DAILY_RATE_LIMIT;
}

export async function submitFeedback(
  userId: string,
  userEmail: string,
  userName: string | undefined,
  category: FeedbackCategory,
  message: string,
): Promise<void> {
  const allowed = await checkDailyRateLimit(userId);
  if (!allowed) {
    throw new Error(`You've sent ${DAILY_RATE_LIMIT} messages today. Please try again tomorrow.`);
  }
  await addDoc(collection(db, 'feedbackSubmissions'), {
    userId,
    userEmail,
    ...(userName && { userName }),
    category,
    message: message.trim(),
    status: 'new',
    createdAt: Date.now(),
  });
}

export async function getAllFeedback(): Promise<FeedbackSubmission[]> {
  const snap = await getDocs(collection(db, 'feedbackSubmissions'));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedbackSubmission));
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  await updateDoc(doc(db, 'feedbackSubmissions', id), { status });
}
