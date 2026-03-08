export type PlantType = 'annual' | 'perennial' | 'biennial';
export type PlantCategory =
  | 'vegetable'
  | 'fruit'
  | 'herb'
  | 'flower-annual'
  | 'flower-perennial'
  | 'bulb'
  | 'cutting';

export type LightRequirement = 'full-sun' | 'partial-shade' | 'shade' | 'full-sun-to-partial-shade';
export type FrostTolerance = 'tender' | 'half-hardy' | 'hardy' | 'very-hardy';
export type WaterNeeds = 'low' | 'medium' | 'high';
export type TaskType =
  | 'start-indoors'
  | 'pot-up'
  | 'begin-hardening'
  | 'transplant'
  | 'direct-sow'
  | 'thin-seedlings'
  | 'first-harvest'
  | 'first-bloom'
  | 'deadhead'
  | 'stake'
  | 'water'
  | 'fertilize'
  | 'custom';

export interface Seed {
  id: string;
  commonName: string;
  botanicalName: string;
  plantType: PlantType;
  category: PlantCategory;
  subcategory?: string;
  daysToGermination: { min: number; max: number };
  daysToMaturity?: number;
  daysToBloom?: number;
  startIndoors: boolean;
  directSow: boolean;
  indoorStartWeeks: number;
  directSowWeeks: number;
  lightRequirement: LightRequirement;
  spacing: number;
  plantingDepth: number;
  coldStratification: boolean;
  frostTolerance: FrostTolerance;
  waterNeeds: WaterNeeds;
  specialRequirements?: string;
  growingNotes: string;
  companionPlants?: string[];
  avoidPlanting?: string[];
  openPollinated?: boolean;
  seedSavingNotes?: string;
  color: string;
  icon?: string;
  isCustom?: boolean;
}

export interface PlantingDates {
  indoorStartDate?: Date;
  potUpDate?: Date;
  hardeningOffStart?: Date;
  transplantDate?: Date;
  directSowDate?: Date;
  firstHarvestDate?: Date;
  firstBloomDate?: Date;
}

export interface PlantingEntry {
  id: string;
  seedId: string;
  seedName: string;
  varietyName?: string;
  botanicalName?: string;
  category: PlantCategory;
  color: string;
  quantity: number;
  notes: string;
  bedLocation?: string;
  year: number;
  createdAt: string;
  // Calculated dates (ISO strings)
  indoorStartDate?: string;
  potUpDate?: string;
  hardeningOffStart?: string;
  transplantDate?: string;
  directSowDate?: string;
  firstHarvestDate?: string;
  firstBloomDate?: string;
  // User overrides
  daysToMaturityOverride?: number;
  customDates?: {
    indoorStartDate?: string;
    transplantDate?: string;
    directSowDate?: string;
  };
  // Succession planting
  successionIndex?: number;
  parentPlantingId?: string;
  successionIntervalDays?: number;
  // Task tracking
  completedTasks?: string[];
  // Photo attachments (Firebase Storage download URLs)
  photos?: string[];
  // Plant sharing
  availableToShare?: number;
}

export interface Task {
  id: string;
  plantingEntryId: string;
  seedId: string;
  seedName: string;
  category: PlantCategory;
  type: TaskType;
  label: string;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
  notes?: string;
  color: string;
}

export interface InventoryItem {
  id: string;
  seedId?: string;
  varietyName: string;
  brand?: string;
  source?: string;
  yearPurchased?: number;
  quantityAmount: number;
  quantityUnit: 'packet' | 'grams' | 'ounces' | 'seeds' | 'bulbs';
  storageLocation?: string;
  germinationRate?: number;
  notes?: string;
  status: 'available' | 'low' | 'empty';
  openPollinated?: boolean;
  seedSavingNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  tags: string[];
  linkedPlantIds?: string[];
  bedLocation?: string;
  weather?: string;
  temperatureHigh?: number;
  temperatureLow?: number;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserLocation {
  zipCode?: string;
  city?: string;
  state?: string;
  zone?: number;
  lastSpringFrost: string;
  firstFallFrost: string;
}

export interface UserSettings {
  location: UserLocation;
  preferences: {
    defaultCalendarView: 'monthly' | 'weekly' | 'timeline';
    showCompletedTasks: boolean;
    colorByCategory: boolean;
  };
  profile: {
    gardenName: string;
    units: 'imperial' | 'metric';
    shareToken?: string;
  };
  onboardingCompleted: boolean;
}

export interface CompanionInfo {
  plantName: string;
  benefit: string;
  type: 'good' | 'bad';
}

export type CalendarView = 'monthly' | 'weekly' | 'timeline';

export interface FrostDateInfo {
  zone: number;
  lastSpringFrost: string;
  firstFallFrost: string;
  city?: string;
  state?: string;
}

export interface CellPlanCell {
  seedId?: string;
  varietyName?: string;
  category?: PlantCategory;
  sowDate?: string;
}

export interface CellPlan {
  id: string;
  name: string;
  cols: number;
  rows: number;
  cells: Record<string, CellPlanCell>;
  createdAt: string;
  updatedAt: string;
}

export interface GardenBed {
  id: string;
  name: string;
  widthFt?: number;
  lengthFt?: number;
  notes?: string;
  indoor: boolean;
  createdAt: string;
}

export type ShareReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface ShareReservation {
  id: string;
  token: string;
  userId: string;
  plantingId: string;
  requesterName: string;
  requesterEmail?: string;
  quantity: number;
  notes?: string;
  status: ShareReservationStatus;
  createdAt: number;
  updatedAt: number;
}

export type SeedRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SeedRequest {
  id: string;
  userId: string;
  userEmail: string;
  category: PlantCategory;
  commonName: string;
  notes: string;
  sourceUrl?: string;
  status: SeedRequestStatus;
  createdAt: number;
  reviewNotes?: string;
  reviewedAt?: number;
}
