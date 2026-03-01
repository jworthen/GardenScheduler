import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGardenStore, GardenStoreData } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce(fn: (...args: any[]) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function useFirestoreSync() {
  const { user } = useAuth();
  const hydrate = useGardenStore((s) => s.hydrate);
  const reset = useGardenStore((s) => s.reset);
  const loadedRef = useRef(false);
  const [ready, setReady] = useState(false);

  // Load from Firestore on sign-in; reset store on sign-out
  useEffect(() => {
    if (!user) {
      if (loadedRef.current) {
        reset();
        loadedRef.current = false;
        setReady(false);
      }
      return;
    }

    loadedRef.current = false;
    setReady(false);
    const docRef = doc(db, 'users', user.uid, 'data', 'gardenData');
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        hydrate(snap.data() as Parameters<typeof hydrate>[0]);
      }
      loadedRef.current = true;
      setReady(true);
    });
  }, [user]);

  // Write to Firestore whenever store state changes (debounced)
  useEffect(() => {
    if (!user) return;

    const syncToFirestore = debounce((state: GardenStoreData) => {
      if (!loadedRef.current) return;
      const { settings, plantings, tasks, inventory, journalEntries, customPlants } = state;
      const docRef = doc(db, 'users', user.uid, 'data', 'gardenData');
      setDoc(docRef, { settings, plantings, tasks, inventory, journalEntries, customPlants });
    }, 1500);

    const unsubscribe = useGardenStore.subscribe((state) => {
      syncToFirestore(state);
    });

    return () => unsubscribe();
  }, [user]);

  return { ready };
}
