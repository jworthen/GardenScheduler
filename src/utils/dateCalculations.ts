import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  differenceInDays,
  isBefore,
  isAfter,
} from 'date-fns';
import { Seed, PlantingDates, PlantingEntry, Task, TaskType } from '../types';

export {
  format,
  parseISO,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  differenceInDays,
  isBefore,
  isAfter,
};

// Frost tolerance offset in days from last frost date
const FROST_TOLERANCE_OFFSETS: Record<string, number> = {
  'tender': 14,       // 2 weeks AFTER last frost
  'half-hardy': 0,    // AT last frost date
  'hardy': -14,       // 2 weeks BEFORE last frost
  'very-hardy': -28,  // 4 weeks BEFORE last frost
};

export function parseMMDD(mmdd: string, year: number): Date {
  const [month, day] = mmdd.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatDisplayDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d');
}

export function calculatePlantingDates(
  seed: Seed,
  lastFrostDate: Date,
  year?: number
): PlantingDates {
  const targetYear = year || lastFrostDate.getFullYear();
  // Adjust frost date to the target year
  const frostDate = new Date(
    targetYear,
    lastFrostDate.getMonth(),
    lastFrostDate.getDate()
  );

  const dates: PlantingDates = {};
  const frostOffset = FROST_TOLERANCE_OFFSETS[seed.frostTolerance] ?? 0;

  if (seed.startIndoors && seed.indoorStartWeeks > 0) {
    // Start indoors: X weeks before last frost
    dates.indoorStartDate = subWeeks(frostDate, seed.indoorStartWeeks);

    // Pot up: about 2 weeks after indoor start (when first true leaves appear)
    dates.potUpDate = addWeeks(dates.indoorStartDate, 2);

    // Transplant date based on frost tolerance
    dates.transplantDate = addDays(frostDate, frostOffset);

    // Hardening off starts 2 weeks before transplant
    dates.hardeningOffStart = subDays(dates.transplantDate, 14);

    // First harvest/bloom date from transplant
    if (seed.daysToMaturity) {
      dates.firstHarvestDate = addDays(dates.transplantDate, seed.daysToMaturity);
    }
    if (seed.daysToBloom) {
      dates.firstBloomDate = addDays(dates.transplantDate, seed.daysToBloom);
    }
  }

  if (seed.directSow) {
    // Direct sow date: directSowWeeks relative to last frost (negative = before frost)
    const directSowDate = addWeeks(frostDate, seed.directSowWeeks);
    dates.directSowDate = directSowDate;

    // If not starting indoors, use direct sow for harvest calculation
    if (!seed.startIndoors) {
      const germDays = seed.daysToGermination.max;
      if (seed.daysToMaturity) {
        dates.firstHarvestDate = addDays(directSowDate, germDays + seed.daysToMaturity);
      }
      if (seed.daysToBloom) {
        dates.firstBloomDate = addDays(directSowDate, germDays + seed.daysToBloom);
      }
    }
  }

  return dates;
}

export function generateTasksForPlanting(
  planting: PlantingEntry,
  seed: Seed
): Omit<Task, 'id'>[] {
  const tasks: Omit<Task, 'id'>[] = [];

  const taskDef = (
    type: TaskType,
    label: string,
    dateStr: string | undefined
  ) => {
    if (!dateStr) return;
    tasks.push({
      plantingEntryId: planting.id,
      seedId: planting.seedId,
      seedName: planting.seedName,
      category: planting.category,
      type,
      label,
      dueDate: dateStr,
      completed: false,
      color: planting.color,
    });
  };

  const n = planting.varietyName || planting.seedName;
  taskDef('start-indoors', `Start ${n} indoors`, planting.indoorStartDate);
  taskDef('pot-up', `Pot up ${n} seedlings`, planting.potUpDate);
  taskDef('begin-hardening', `Begin hardening off ${n}`, planting.hardeningOffStart);
  taskDef('transplant', `Transplant ${n} outdoors`, planting.transplantDate);
  taskDef('direct-sow', `Direct sow ${n}`, planting.directSowDate);
  taskDef('first-harvest', `First ${n} harvest expected`, planting.firstHarvestDate);
  taskDef('first-bloom', `${n} expected to bloom`, planting.firstBloomDate);

  if (seed.spacing && planting.directSowDate) {
    const thinDate = addDays(parseISO(planting.directSowDate), seed.daysToGermination.max + 14);
    taskDef('thin-seedlings', `Thin ${n} seedlings`, formatDate(thinDate));
  }

  return tasks;
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfWeek(startOfMonth(new Date(year, month, 1)), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(new Date(year, month, 1)), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function getDaysInSeason(lastFrostDate: Date): Date[] {
  const start = subWeeks(lastFrostDate, 12);
  const end = addWeeks(lastFrostDate, 26);
  return eachDayOfInterval({ start, end });
}

export function isDateInRange(
  date: Date | string,
  rangeStart: Date | string,
  rangeEnd: Date | string
): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const s = typeof rangeStart === 'string' ? parseISO(rangeStart) : rangeStart;
  const e = typeof rangeEnd === 'string' ? parseISO(rangeEnd) : rangeEnd;
  return !isBefore(d, s) && !isAfter(d, e);
}

export function getRelativeToFrost(date: Date | string, frostDate: Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const diff = differenceInDays(d, frostDate);
  if (diff === 0) return 'On last frost date';
  if (diff > 0) return `${diff} days after last frost`;
  return `${Math.abs(diff)} days before last frost`;
}

export function getCurrentSeasonYear(): number {
  const now = new Date();
  // Garden season: if we're past August, plan for next year
  return now.getMonth() > 7 ? now.getFullYear() + 1 : now.getFullYear();
}

export function applySuccession(
  basePlanting: PlantingEntry,
  intervalDays: number,
  successionNumber: number
): Partial<PlantingEntry> {
  const shiftDate = (dateStr: string | undefined) => {
    if (!dateStr) return undefined;
    return formatDate(addDays(parseISO(dateStr), intervalDays * successionNumber));
  };

  return {
    indoorStartDate: shiftDate(basePlanting.indoorStartDate),
    potUpDate: shiftDate(basePlanting.potUpDate),
    hardeningOffStart: shiftDate(basePlanting.hardeningOffStart),
    transplantDate: shiftDate(basePlanting.transplantDate),
    directSowDate: shiftDate(basePlanting.directSowDate),
    firstHarvestDate: shiftDate(basePlanting.firstHarvestDate),
    firstBloomDate: shiftDate(basePlanting.firstBloomDate),
    successionIndex: successionNumber,
    parentPlantingId: basePlanting.id,
    successionIntervalDays: intervalDays,
  };
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function getTaskIcon(taskType: TaskType): string {
  const icons: Record<TaskType, string> = {
    'start-indoors': '🌱',
    'pot-up': '🪴',
    'begin-hardening': '🌤️',
    'transplant': '🌿',
    'direct-sow': '🌾',
    'thin-seedlings': '✂️',
    'first-harvest': '🥕',
    'first-bloom': '🌸',
    'deadhead': '🌺',
    'stake': '🪤',
    'water': '💧',
    'fertilize': '🌿',
    'custom': '📝',
  };
  return icons[taskType] || '📝';
}

export function getTaskLabel(taskType: TaskType): string {
  const labels: Record<TaskType, string> = {
    'start-indoors': 'Start Indoors',
    'pot-up': 'Pot Up',
    'begin-hardening': 'Begin Hardening Off',
    'transplant': 'Transplant',
    'direct-sow': 'Direct Sow',
    'thin-seedlings': 'Thin Seedlings',
    'first-harvest': 'First Harvest',
    'first-bloom': 'First Bloom',
    'deadhead': 'Deadhead',
    'stake': 'Stake',
    'water': 'Water',
    'fertilize': 'Fertilize',
    'custom': 'Custom Task',
  };
  return labels[taskType] || taskType;
}
