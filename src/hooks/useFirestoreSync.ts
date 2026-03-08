import { useEffect, useRef, useState, useCallback } from 'react';
import { getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGardenStore, GardenStoreData } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { getCommunitySeeds } from '../lib/seedRequests';
import {
  GardenMeta,
  gardenDocRef,
  legacyDocRef,
  loadGardensList,
  saveGardensList,
  loadGardenData,
  saveGardenData,
  deleteGardenData,
} from '../lib/gardens';
import { GardenContextValue } from '../contexts/GardenContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce(fn: (...args: any[]) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function localWriteKey(uid: string, gardenId: string) {
  return `garden-local-write-time:${uid}:${gardenId}`;
}

function activeGardenKey(uid: string) {
  return `active-garden:${uid}`;
}

function safeMergeArray<T>(remote: T[] | undefined, local: T[]): T[] {
  if (remote && remote.length > 0) return remote;
  if (local.length > 0) return local;
  return remote ?? [];
}

export function useFirestoreSync(): { firestoreReady: boolean } & GardenContextValue {
  const { user } = useAuth();
  const hydrate = useGardenStore((s) => s.hydrate);
  const reset = useGardenStore((s) => s.reset);
  const setCommunitySeeds = useGardenStore((s) => s.setCommunitySeeds);

  const loadedRef = useRef(false);
  const firestoreSyncedRef = useRef(false);
  const activeGardenIdRef = useRef<string | null>(null);
  const gardensRef = useRef<GardenMeta[]>([]);

  const [firestoreReady, setFirestoreReady] = useState(false);
  const [gardens, setGardens] = useState<GardenMeta[]>([]);
  const [activeGardenId, setActiveGardenId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const setGardensAll = (g: GardenMeta[]) => {
    gardensRef.current = g;
    setGardens(g);
  };
  const setActiveAll = (id: string | null) => {
    activeGardenIdRef.current = id;
    setActiveGardenId(id);
  };

  // Immediately flush current store state to Firestore (before switching gardens)
  const flushCurrent = useCallback(() => {
    const gardenId = activeGardenIdRef.current;
    if (!user || !gardenId) return;
    const { settings, plantings, tasks, inventory, journalEntries, customPlants, cellPlans, beds } =
      useGardenStore.getState();
    const savedAt = new Date().toISOString();
    setDoc(gardenDocRef(user.uid, gardenId), {
      settings, plantings, tasks, inventory, journalEntries, customPlants, cellPlans, beds, savedAt,
    });
  }, [user]);

  const hydrateFromData = useCallback(
    (data: Record<string, unknown>) => {
      const local = useGardenStore.getState();
      hydrate({
        ...data,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cellPlans:      safeMergeArray(data.cellPlans as any[], local.cellPlans),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plantings:      safeMergeArray(data.plantings as any[], local.plantings),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tasks:          safeMergeArray(data.tasks as any[], local.tasks),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inventory:      safeMergeArray(data.inventory as any[], local.inventory),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        journalEntries: safeMergeArray(data.journalEntries as any[], local.journalEntries),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        customPlants:   safeMergeArray(data.customPlants as any[], local.customPlants),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        beds:           safeMergeArray(data.beds as any[], local.beds),
      } as Parameters<typeof hydrate>[0]);
    },
    [hydrate],
  );

  // ── Sign-in: load gardens list, run migration if needed, hydrate active garden ──
  useEffect(() => {
    if (!user) {
      if (loadedRef.current) {
        reset();
        localStorage.removeItem('onboardingCompleted');
        loadedRef.current = false;
      }
      firestoreSyncedRef.current = false;
      setFirestoreReady(false);
      setGardensAll([]);
      setActiveAll(null);
      return;
    }

    setFirestoreReady(false);
    loadedRef.current = false;
    firestoreSyncedRef.current = false;

    async function init() {
      try {
        let gardensList = await loadGardensList(user!.uid);

        // ── Migration: single-garden (v1) → multi-garden ──────────────────
        if (gardensList.length === 0) {
          const legacySnap = await getDoc(legacyDocRef(user!.uid));
          if (legacySnap.exists()) {
            const legacyData = legacySnap.data();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const gardenName = (legacyData?.settings as any)?.profile?.gardenName || 'My Garden';
            const defaultGarden: GardenMeta = {
              id: 'default',
              name: gardenName,
              createdAt: new Date().toISOString(),
            };
            await saveGardenData(user!.uid, 'default', legacyData);
            gardensList = [defaultGarden];
            await saveGardensList(user!.uid, gardensList);
          } else {
            // New user — bootstrap a default garden
            const defaultGarden: GardenMeta = {
              id: 'default',
              name: 'My Garden',
              createdAt: new Date().toISOString(),
            };
            gardensList = [defaultGarden];
            await saveGardensList(user!.uid, gardensList);
          }
        }

        firestoreSyncedRef.current = true;
        setGardensAll(gardensList);

        // Restore last-used garden (device-local)
        const savedId = localStorage.getItem(activeGardenKey(user!.uid));
        const initialId =
          savedId && gardensList.some((g) => g.id === savedId)
            ? savedId
            : gardensList[0].id;

        setActiveAll(initialId);
        localStorage.setItem(activeGardenKey(user!.uid), initialId);

        // Hydrate the store from the active garden's Firestore data
        const data = await loadGardenData(user!.uid, initialId);
        if (data) {
          const firestoreSavedAt = (data.savedAt as string) ?? '';
          const localWriteTime = localStorage.getItem(localWriteKey(user!.uid, initialId)) ?? '';
          // Use Firestore data unless local state is provably newer
          if (!localWriteTime || firestoreSavedAt >= localWriteTime) {
            hydrateFromData(data);
          }
        }
      } catch (e) {
        console.error('Firestore sync error during init:', e);
        // Fall back to local (persisted) state
      } finally {
        loadedRef.current = true;
        setFirestoreReady(true);
      }
    }

    Promise.all([init(), getCommunitySeeds().then(setCommunitySeeds)]);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced write on every store change ────────────────────────────────
  useEffect(() => {
    if (!user) return;

    function writeNow(state: GardenStoreData) {
      const gardenId = activeGardenIdRef.current;
      if (!loadedRef.current || !gardenId) return;

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
      setDoc(gardenDocRef(user!.uid, gardenId), {
        settings, plantings, tasks, inventory, journalEntries, customPlants, cellPlans, beds, savedAt,
      });
    }

    const syncToFirestore = debounce(writeNow, 1500);

    const unsubscribe = useGardenStore.subscribe((state) => {
      const gardenId = activeGardenIdRef.current;
      if (gardenId) {
        localStorage.setItem(localWriteKey(user!.uid, gardenId), new Date().toISOString());
      }
      syncToFirestore(state);
    });

    return () => unsubscribe();
  }, [user]);

  // ── Garden CRUD ──────────────────────────────────────────────────────────

  const switchGarden = useCallback(
    async (newId: string) => {
      if (!user || newId === activeGardenIdRef.current) return;
      setSwitching(true);
      try {
        flushCurrent(); // persist current garden before leaving

        loadedRef.current = false; // block debounced writes during swap
        setActiveAll(newId);
        localStorage.setItem(activeGardenKey(user.uid), newId);

        const data = await loadGardenData(user.uid, newId);
        if (data) {
          hydrate({
            settings:       data.settings,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            plantings:      (data.plantings as any[]) ?? [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tasks:          (data.tasks as any[]) ?? [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inventory:      (data.inventory as any[]) ?? [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            journalEntries: (data.journalEntries as any[]) ?? [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            customPlants:   (data.customPlants as any[]) ?? [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cellPlans:      (data.cellPlans as any[]) ?? [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            beds:           (data.beds as any[]) ?? [],
          } as Parameters<typeof hydrate>[0]);
        } else {
          reset();
        }
      } finally {
        loadedRef.current = true;
        setSwitching(false);
      }
    },
    [user, flushCurrent, hydrate, reset],
  );

  const createGarden = useCallback(
    async (name: string) => {
      if (!user) return;
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const newGarden: GardenMeta = { id, name, createdAt: new Date().toISOString() };

      // Inherit location (zone/frost dates) from the current garden
      const cur = useGardenStore.getState();
      const inheritedSettings = {
        ...cur.settings,
        profile: { ...cur.settings.profile, gardenName: name, shareToken: undefined },
      };

      await saveGardenData(user.uid, id, {
        settings: inheritedSettings,
        plantings: [], tasks: [], inventory: [], journalEntries: [],
        customPlants: [], cellPlans: [], beds: [],
        savedAt: new Date().toISOString(),
      });

      const updatedGardens = [...gardensRef.current, newGarden];
      await saveGardensList(user.uid, updatedGardens);
      setGardensAll(updatedGardens);
      await switchGarden(id);
    },
    [user, switchGarden],
  );

  const renameGarden = useCallback(
    async (id: string, name: string) => {
      if (!user) return;
      const updated = gardensRef.current.map((g) => (g.id === id ? { ...g, name } : g));
      await saveGardensList(user.uid, updated);
      setGardensAll(updated);
      // Sync the store's gardenName if renaming the active garden
      if (id === activeGardenIdRef.current) {
        const cur = useGardenStore.getState();
        cur.updateSettings({ profile: { ...cur.settings.profile, gardenName: name } });
      }
    },
    [user],
  );

  const deleteGarden = useCallback(
    async (id: string) => {
      if (!user || gardensRef.current.length <= 1) return;
      if (id === activeGardenIdRef.current) {
        const other = gardensRef.current.find((g) => g.id !== id);
        if (other) await switchGarden(other.id);
      }
      const updated = gardensRef.current.filter((g) => g.id !== id);
      await saveGardensList(user.uid, updated);
      setGardensAll(updated);
      await deleteGardenData(user.uid, id);
    },
    [user, switchGarden],
  );

  return {
    firestoreReady,
    gardens,
    activeGardenId,
    switching,
    switchGarden,
    createGarden,
    renameGarden,
    deleteGarden,
  };
}
