import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  UserSettings,
  PlantingEntry,
  Task,
  InventoryItem,
  JournalEntry,
  Seed,
  PlantCategory,
  CellPlan,
  GardenBed,
} from '../types';
import {
  calculatePlantingDates,
  generateTasksForPlanting,
  formatDate,
  parseMMDD,
  applySuccession,
} from '../utils/dateCalculations';
import { seeds as defaultSeeds } from '../data/seeds';

// Simple ID generator without crypto dependency
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const DEFAULT_SETTINGS: UserSettings = {
  location: {
    lastSpringFrost: '05-01',
    firstFallFrost: '10-01',
    zone: 5,
  },
  preferences: {
    defaultCalendarView: 'monthly',
    showCompletedTasks: false,
    colorByCategory: true,
  },
  profile: {
    gardenName: '',
    units: 'imperial',
  },
  onboardingCompleted: false,
};

export interface GardenStoreData {
  settings: UserSettings;
  plantings: PlantingEntry[];
  tasks: Task[];
  inventory: InventoryItem[];
  journalEntries: JournalEntry[];
  customPlants: Seed[];
  cellPlans: CellPlan[];
  beds: GardenBed[];
}

interface GardenStore extends GardenStoreData {
  // State
  settings: UserSettings;
  plantings: PlantingEntry[];
  tasks: Task[];
  inventory: InventoryItem[];
  journalEntries: JournalEntry[];
  customPlants: Seed[];
  cellPlans: CellPlan[];
  beds: GardenBed[];
  // Community seeds (shared, loaded from Firestore, not persisted per-user)
  communitySeeds: Seed[];
  setCommunitySeeds: (seeds: Seed[]) => void;

  // Settings actions
  updateSettings: (updates: Partial<UserSettings>) => void;
  completeOnboarding: () => void;
  setLocation: (location: Partial<UserSettings['location']>) => void;

  // Planting actions
  addPlanting: (seedId: string, seed: Seed, options?: {
    quantity?: number;
    notes?: string;
    bedLocation?: string;
    year?: number;
  }) => PlantingEntry;
  addSuccessionPlanting: (basePlantingId: string, intervalDays: number) => void;
  updatePlanting: (id: string, updates: Partial<PlantingEntry>) => void;
  removePlanting: (id: string) => void;

  // Task actions
  regenerateTasksForPlanting: (plantingId: string) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;
  addCustomTask: (task: Omit<Task, 'id'>) => void;
  removeTask: (id: string) => void;

  // Inventory actions
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  removeInventoryItem: (id: string) => void;

  // Journal actions
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  removeJournalEntry: (id: string) => void;

  // Custom plants
  addCustomPlant: (plant: Omit<Seed, 'id'>) => Seed;
  removeCustomPlant: (id: string) => void;

  // Cell planner
  addCellPlan: (plan: CellPlan) => void;
  updateCellPlan: (id: string, updates: Partial<CellPlan>) => void;
  removeCellPlan: (id: string) => void;

  // Garden beds
  addBed: (bed: Omit<GardenBed, 'id' | 'createdAt'>) => void;
  updateBed: (id: string, updates: Partial<GardenBed>) => void;
  removeBed: (id: string) => void;

  // Helpers
  getAllSeeds: () => Seed[];
  getSeedById: (id: string) => Seed | undefined;
  getPlantingsByMonth: (year: number, month: number) => PlantingEntry[];
  getTasksForDate: (dateStr: string) => Task[];
  getUpcomingTasks: (daysAhead: number) => Task[];
  getOverdueTasks: () => Task[];

  // Firestore sync
  hydrate: (data: Partial<{
    settings: UserSettings;
    plantings: PlantingEntry[];
    tasks: Task[];
    inventory: InventoryItem[];
    journalEntries: JournalEntry[];
    customPlants: Seed[];
    cellPlans: CellPlan[];
    beds: GardenBed[];
  }>) => void;
  reset: () => void;
}

export const useGardenStore = create<GardenStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      plantings: [],
      tasks: [],
      inventory: [],
      journalEntries: [],
      customPlants: [],
      cellPlans: [],
      beds: [],
      communitySeeds: [],
      setCommunitySeeds: (seeds) => set({ communitySeeds: seeds }),

      updateSettings: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...updates,
            location: { ...state.settings.location, ...(updates.location || {}) },
            preferences: { ...state.settings.preferences, ...(updates.preferences || {}) },
            profile: { ...state.settings.profile, ...(updates.profile || {}) },
          },
        })),

      completeOnboarding: () =>
        set((state) => ({
          settings: { ...state.settings, onboardingCompleted: true },
        })),

      setLocation: (location) =>
        set((state) => ({
          settings: {
            ...state.settings,
            location: { ...state.settings.location, ...location },
          },
        })),

      addPlanting: (seedId, seed, options = {}) => {
        const { settings } = get();
        const year = options.year || new Date().getFullYear();
        const frostDate = parseMMDD(settings.location.lastSpringFrost, year);
        const dates = calculatePlantingDates(seed, frostDate, year);

        const planting: PlantingEntry = {
          id: generateId(),
          seedId,
          seedName: seed.commonName,
          botanicalName: seed.botanicalName,
          category: seed.category,
          color: seed.color,
          quantity: options.quantity || 1,
          notes: options.notes || '',
          bedLocation: options.bedLocation,
          year,
          createdAt: new Date().toISOString(),
          indoorStartDate: dates.indoorStartDate ? formatDate(dates.indoorStartDate) : undefined,
          potUpDate: dates.potUpDate ? formatDate(dates.potUpDate) : undefined,
          hardeningOffStart: dates.hardeningOffStart ? formatDate(dates.hardeningOffStart) : undefined,
          transplantDate: dates.transplantDate ? formatDate(dates.transplantDate) : undefined,
          directSowDate: dates.directSowDate ? formatDate(dates.directSowDate) : undefined,
          firstHarvestDate: dates.firstHarvestDate ? formatDate(dates.firstHarvestDate) : undefined,
          firstBloomDate: dates.firstBloomDate ? formatDate(dates.firstBloomDate) : undefined,
          completedTasks: [],
        };

        const newTasks = generateTasksForPlanting(planting, seed).map((t) => ({
          ...t,
          id: generateId(),
        }));

        set((state) => ({
          plantings: [...state.plantings, planting],
          tasks: [...state.tasks, ...newTasks],
        }));

        return planting;
      },

      addSuccessionPlanting: (basePlantingId, intervalDays) => {
        const { plantings, tasks, settings } = get();
        const basePlanting = plantings.find((p) => p.id === basePlantingId);
        if (!basePlanting) return;

        const existingSuccessions = plantings.filter(
          (p) => p.parentPlantingId === basePlantingId
        ).length;
        const successionNumber = existingSuccessions + 1;

        const newDates = applySuccession(basePlanting, intervalDays, successionNumber);
        const newPlanting: PlantingEntry = {
          ...basePlanting,
          id: generateId(),
          createdAt: new Date().toISOString(),
          ...newDates,
          notes: `Succession ${successionNumber + 1} of ${basePlanting.seedName}`,
          completedTasks: [],
        };

        const allSeeds = get().getAllSeeds();
        const seed = allSeeds.find((s) => s.id === basePlanting.seedId);
        const newTasks = seed
          ? generateTasksForPlanting(newPlanting, seed).map((t) => ({
              ...t,
              id: generateId(),
            }))
          : [];

        set((state) => ({
          plantings: [...state.plantings, newPlanting],
          tasks: [...state.tasks, ...newTasks],
        }));
      },

      updatePlanting: (id, updates) =>
        set((state) => ({
          plantings: state.plantings.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      removePlanting: (id) =>
        set((state) => ({
          plantings: state.plantings.filter((p) => p.id !== id && p.parentPlantingId !== id),
          tasks: state.tasks.filter((t) => t.plantingEntryId !== id),
        })),

      regenerateTasksForPlanting: (plantingId) => {
        const { plantings, tasks } = get();
        const planting = plantings.find((p) => p.id === plantingId);
        if (!planting) return;

        const allSeeds = get().getAllSeeds();
        const seed = allSeeds.find((s) => s.id === planting.seedId);
        if (!seed) return;

        const newTasks = generateTasksForPlanting(planting, seed).map((t) => ({
          ...t,
          id: generateId(),
        }));

        set((state) => ({
          tasks: [
            ...state.tasks.filter((t) => t.plantingEntryId !== plantingId),
            ...newTasks,
          ],
        }));
      },

      completeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: true, completedDate: new Date().toISOString() } : t
          ),
        })),

      uncompleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: false, completedDate: undefined } : t
          ),
        })),

      addCustomTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, { ...task, id: generateId() }],
        })),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      addInventoryItem: (item) =>
        set((state) => ({
          inventory: [
            ...state.inventory,
            {
              ...item,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      updateInventoryItem: (id, updates) =>
        set((state) => ({
          inventory: state.inventory.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
          ),
        })),

      removeInventoryItem: (id) =>
        set((state) => ({
          inventory: state.inventory.filter((i) => i.id !== id),
        })),

      addJournalEntry: (entry) =>
        set((state) => ({
          journalEntries: [
            ...state.journalEntries,
            {
              ...entry,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      updateJournalEntry: (id, updates) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((e) =>
            e.id === id
              ? { ...e, ...updates, updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      removeJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.filter((e) => e.id !== id),
        })),

      addCustomPlant: (plant) => {
        const newPlant: Seed = { ...plant, id: `custom-${generateId()}`, isCustom: true };
        set((state) => ({
          customPlants: [...state.customPlants, newPlant],
        }));
        return newPlant;
      },

      removeCustomPlant: (id) =>
        set((state) => ({
          customPlants: state.customPlants.filter((p) => p.id !== id),
        })),

      addCellPlan: (plan) =>
        set((state) => ({ cellPlans: [...state.cellPlans, plan] })),

      updateCellPlan: (id, updates) =>
        set((state) => ({
          cellPlans: state.cellPlans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      removeCellPlan: (id) =>
        set((state) => ({ cellPlans: state.cellPlans.filter((p) => p.id !== id) })),

      addBed: (bed) =>
        set((state) => ({
          beds: [...state.beds, { ...bed, id: generateId(), createdAt: new Date().toISOString() }],
        })),

      updateBed: (id, updates) =>
        set((state) => ({
          beds: state.beds.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      removeBed: (id) =>
        set((state) => ({ beds: state.beds.filter((b) => b.id !== id) })),

      getAllSeeds: () => {
        const { customPlants, communitySeeds } = get();
        return [...defaultSeeds, ...communitySeeds, ...customPlants];
      },

      getSeedById: (id) => {
        const { customPlants, communitySeeds } = get();
        return [...defaultSeeds, ...communitySeeds, ...customPlants].find((s) => s.id === id);
      },

      getPlantingsByMonth: (year, month) => {
        const { plantings } = get();
        return plantings.filter((p) => {
          const dates = [
            p.indoorStartDate,
            p.transplantDate,
            p.directSowDate,
            p.firstHarvestDate,
            p.firstBloomDate,
          ].filter(Boolean);
          return dates.some((d) => {
            const date = new Date(d!);
            return date.getFullYear() === year && date.getMonth() === month;
          });
        });
      },

      getTasksForDate: (dateStr) => {
        const { tasks } = get();
        return tasks.filter((t) => t.dueDate === dateStr);
      },

      getUpcomingTasks: (daysAhead) => {
        const { tasks } = get();
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + daysAhead);
        return tasks.filter((t) => {
          const taskDate = new Date(t.dueDate);
          return !t.completed && taskDate >= today && taskDate <= futureDate;
        }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      },

      getOverdueTasks: () => {
        const { tasks } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return tasks.filter((t) => {
          const taskDate = new Date(t.dueDate);
          return !t.completed && taskDate < today;
        }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      },

      hydrate: (data) => set((state) => ({
        settings: data.settings ?? state.settings,
        plantings: data.plantings ?? state.plantings,
        tasks: data.tasks ?? state.tasks,
        inventory: data.inventory ?? state.inventory,
        journalEntries: data.journalEntries ?? state.journalEntries,
        customPlants: data.customPlants ?? state.customPlants,
        cellPlans: data.cellPlans ?? state.cellPlans,
        beds: data.beds ?? state.beds,
      })),

      reset: () => set({
        settings: DEFAULT_SETTINGS,
        plantings: [],
        tasks: [],
        inventory: [],
        journalEntries: [],
        customPlants: [],
        cellPlans: [],
        beds: [],
        communitySeeds: [],
      }),
    }),
    { name: 'garden-store' }
  )
);
