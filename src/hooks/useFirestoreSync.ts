import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGardenStore, GardenStoreData } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { getCommunitySeeds } from '../lib/seedRequests';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce(fn: (...args: any[]) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Per-user key so switching accounts doesn't mix timestamps
function localWriteKey(uid: string) {
  return `garden-local-write-time:${uid}`;
}

// Merge a remote array into local state: use remote if it has items, otherwise
// keep local. This prevents a device that wrote empty arrays to Firestore (e.g.
// a fresh login on a new device, or after a failed read) from wiping populated
// data on another device.
// Note: this means intentional "delete everything" changes won't sync cross-device
// until at least one item exists on the deleting device. Acceptable trade-off.
function safeMergeArray<T>(remote: T[] | undefined, local: T[]): T[] {
  if (remote && remote.length > 0) return remote;
  if (local.length > 0) return local;
  return remote ?? [];
}

export function useFirestoreSync() {
  const { user } = useAuth();
  const hydrate = useGardenStore((s) => s.hydrate);
  const reset = useGardenStore((s) => s.reset);
  const setCommunitySeeds = useGardenStore((s) => s.setCommunitySeeds);
  const loadedRef = useRef(false);
  // true once a Firestore read succeeds this session; false if read failed.
  // Used to block writes from a device that couldn't confirm Firestore state.
  const firestoreSyncedRef = useRef(false);
  const [firestoreReady, setFirestoreReady] = useState(false);

  // Load from Firestore on sign-in; reset store on sign-out
  useEffect(() => {
    if (!user) {
      if (loadedRef.current) {
        reset();
        localStorage.removeItem('onboardingCompleted');
        loadedRef.current = false;
      }
      firestoreSyncedRef.current = false;
      setFirestoreReady(false);
      return;
    }

    setFirestoreReady(false);
    loadedRef.current = false;
    firestoreSyncedRef.current = false;
    const docRef = doc(db, 'users', user.uid, 'data', 'gardenData');
    Promise.all([
      getDoc(docRef).then((snap) => {
        // Mark Firestore read as successful regardless of whether a doc exists.
        // This allows writes from users with no prior data (new accounts).
        firestoreSyncedRef.current = true;
        if (snap.exists()) {
          const data = snap.data();
          // Only overwrite local state if Firestore data is at least as recent.
          // This prevents a stale Firestore snapshot from clobbering local changes
          // that haven't been flushed yet (e.g. user added items then refreshed
          // before the debounced write completed).
          const firestoreSavedAt: string = data.savedAt ?? '';
          const localWriteTime: string = localStorage.getItem(localWriteKey(user.uid)) ?? '';
          if (!localWriteTime || firestoreSavedAt >= localWriteTime) {
            // Use safeMergeArray for every collection so that an empty array in
            // Firestore (written by a device that had no data) never overwrites
            // populated local state. The ?? operator doesn't help here because
            // [] is truthy.
            const local = useGardenStore.getState();
            hydrate({
              ...data,
              cellPlans: safeMergeArray(data.cellPlans, local.cellPlans),
              plantings: safeMergeArray(data.plantings, local.plantings),
              tasks: safeMergeArray(data.tasks, local.tasks),
              inventory: safeMergeArray(data.inventory, local.inventory),
              journalEntries: safeMergeArray(data.journalEntries, local.journalEntries),
              customPlants: safeMergeArray(data.customPlants, local.customPlants),
              beds: safeMergeArray(data.beds, local.beds),
            } as Parameters<typeof hydrate>[0]);
          }
          // If localWriteTime > firestoreSavedAt, the local (persisted) state is
          // newer — leave it in place and let the next debounced write catch up.
        }
      }),
      getCommunitySeeds().then(setCommunitySeeds),
    ])
      .catch(() => {
        // Firestore read failed — local (persisted) data is used as-is.
        // firestoreSyncedRef stays false so writeNow won't clobber Firestore
        // with whatever empty state this device happens to have.
      })
      .finally(() => {
        loadedRef.current = true;
        setFirestoreReady(true);
      });
  }, [user]);

  // Write to Firestore whenever store state changes (debounced)
  useEffect(() => {
    if (!user) return;

    function writeNow(state: GardenStoreData) {
      if (!loadedRef.current) return;

      // If Firestore read failed this session, only write if we actually have
      // data. This prevents a fresh device that couldn't reach Firestore from
      // writing empty arrays and overwriting another device's populated data.
      if (!firestoreSyncedRef.current) {
        const totalItems =
          (state.plantings?.length ?? 0) +
          (state.cellPlans?.length ?? 0) +
          (state.inventory?.length ?? 0) +
          (state.journalEntries?.length ?? 0) +
          (state.customPlants?.length ?? 0);
        if (totalItems === 0) return;
      }

      const { settings, plantings, tasks, inventory, journalEntries, customPlants, cellPlans, beds } = state;
      const savedAt = new Date().toISOString();
      const docRef = doc(db, 'users', user!.uid, 'data', 'gardenData');
      setDoc(docRef, { settings, plantings, tasks, inventory, journalEntries, customPlants, cellPlans, beds, savedAt });
    }

    const syncToFirestore = debounce(writeNow, 1500);

    const unsubscribe = useGardenStore.subscribe((state) => {
      // Record the local mutation time immediately (synchronously, before any
      // async Firestore write) so the load-time comparison is always accurate.
      localStorage.setItem(localWriteKey(user!.uid), new Date().toISOString());
      syncToFirestore(state);
    });

    return () => unsubscribe();
  }, [user]);

  return { firestoreReady };
}
