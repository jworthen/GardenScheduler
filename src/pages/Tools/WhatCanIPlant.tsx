import { useMemo, useState } from 'react';
import { Sprout, Calendar, Search, Plus } from 'lucide-react';
import clsx from 'clsx';
import { useGardenStore } from '../../store/useStore';
import { seeds } from '../../data/seeds';
import { Seed } from '../../types';
import { formatDisplayDate, parseMMDD, calculatePlantingDates, format, addDays, isBefore, isAfter } from '../../utils/dateCalculations';
import { getCategoryLabel, getCategoryBgLight, getCategoryTextColor } from '../../data/seeds';
import { CategoryBadge } from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import AddToCalendarModal from '../Seeds/AddToCalendarModal';

type PlantingWindow = 'can-start-indoors' | 'can-direct-sow' | 'can-transplant' | 'too-late' | 'not-yet';

interface PlantResult {
  seed: Seed;
  windows: PlantingWindow[];
  indoorStart?: Date;
  directSow?: Date;
  transplant?: Date;
  firstHarvest?: Date;
  firstBloom?: Date;
  daysUntilStart?: number;
  status: 'ideal' | 'possible' | 'stretch' | 'too-late';
}

export default function WhatCanIPlant() {
  const { settings, addPlanting } = useGardenStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [calendarSeed, setCalendarSeed] = useState<Seed | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();

  const lastFrost = parseMMDD(settings.location.lastSpringFrost, year);
  const firstFall = parseMMDD(settings.location.firstFallFrost, year);

  // Season length in days
  const seasonDays = Math.round((firstFall.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilFrost = Math.round((lastFrost.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const plantResults = useMemo((): PlantResult[] => {
    return seeds
      .map((seed): PlantResult => {
        const dates = calculatePlantingDates(seed, lastFrost, year);
        const windows: PlantingWindow[] = [];
        let status: PlantResult['status'] = 'too-late';
        let daysUntilStart: number | undefined;

        // Check if can start indoors now
        if (dates.indoorStartDate) {
          const startDate = dates.indoorStartDate;
          const latestStart = addDays(startDate, 14); // 2 week grace window
          if (isBefore(today, latestStart) && isAfter(today, addDays(startDate, -7))) {
            windows.push('can-start-indoors');
            status = 'ideal';
          } else if (isBefore(today, startDate)) {
            daysUntilStart = Math.round((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            windows.push('not-yet');
            status = 'possible';
          }
        }

        // Check if can direct sow now
        if (dates.directSowDate) {
          const sowDate = dates.directSowDate;
          const latestSow = dates.firstHarvestDate || dates.firstBloomDate
            ? addDays(firstFall, -30)
            : addDays(firstFall, -14);

          if (isBefore(today, latestSow) && !isBefore(today, addDays(sowDate, -3))) {
            windows.push('can-direct-sow');
            if (status !== 'ideal') status = 'ideal';
          } else if (isBefore(today, sowDate)) {
            if (!daysUntilStart) {
              daysUntilStart = Math.round((sowDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }
            if (status === 'too-late') status = 'possible';
          } else if (isAfter(today, latestSow)) {
            if (windows.length === 0) status = 'too-late';
          }
        }

        // Check transplant window
        if (dates.transplantDate) {
          const transplant = dates.transplantDate;
          const latestTransplant = addDays(firstFall, -(seed.daysToMaturity || seed.daysToBloom || 60));
          if (!isBefore(today, addDays(transplant, -3)) && isBefore(today, latestTransplant)) {
            windows.push('can-transplant');
            if (status !== 'ideal') status = 'ideal';
          }
        }

        // Fallback: check if season is long enough
        const daysNeeded = (seed.daysToMaturity || seed.daysToBloom || 60) + seed.daysToGermination.max;
        if (windows.length === 0 && seasonDays > daysNeeded) {
          status = 'stretch';
        } else if (windows.length === 0 && seasonDays <= 0) {
          status = 'too-late';
        }

        return {
          seed,
          windows,
          indoorStart: dates.indoorStartDate,
          directSow: dates.directSowDate,
          transplant: dates.transplantDate,
          firstHarvest: dates.firstHarvestDate,
          firstBloom: dates.firstBloomDate,
          daysUntilStart,
          status,
        };
      })
      .filter((r) => {
        if (search) {
          const q = search.toLowerCase();
          if (!r.seed.commonName.toLowerCase().includes(q) &&
              !r.seed.botanicalName.toLowerCase().includes(q)) {
            return false;
          }
        }
        if (categoryFilter !== 'all' && r.seed.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const order = { ideal: 0, possible: 1, stretch: 2, 'too-late': 3 };
        return order[a.status] - order[b.status];
      });
  }, [settings, today, search, categoryFilter]);

  const statusGroups = useMemo(() => ({
    ideal: plantResults.filter((r) => r.status === 'ideal'),
    possible: plantResults.filter((r) => r.status === 'possible'),
    stretch: plantResults.filter((r) => r.status === 'stretch'),
    tooLate: plantResults.filter((r) => r.status === 'too-late'),
  }), [plantResults]);

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'vegetable', label: 'Vegetables' },
    { value: 'fruit', label: 'Fruits' },
    { value: 'herb', label: 'Herbs' },
    { value: 'flower-annual', label: 'Annual Flowers' },
    { value: 'flower-perennial', label: 'Perennial Flowers' },
    { value: 'bulb', label: 'Bulbs' },
  ];

  return (
    <div>
      <PageHeader
        title="What Can I Plant?"
        subtitle={`Based on today: ${format(today, 'MMMM d, yyyy')}`}
        icon="🔍"
      />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Season info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-gray-900">
              {daysUntilFrost > 0 ? daysUntilFrost : Math.abs(daysUntilFrost)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {daysUntilFrost > 0 ? 'days until last frost' : 'days past last frost'}
            </div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-garden-700">{Math.max(0, seasonDays)}</div>
            <div className="text-xs text-gray-500 mt-0.5">frost-free days left</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-green-600">{statusGroups.ideal.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">plants to start now</div>
          </div>
        </div>

        <div className="p-3 bg-garden-50 border border-garden-100 rounded-xl text-sm text-garden-700">
          Last frost: <strong>{formatDisplayDate(lastFrost)}</strong> · First fall frost: <strong>{formatDisplayDate(firstFall)}</strong>
        </div>

        {/* Search and filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search plants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategoryFilter(value)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                categoryFilter === value
                  ? 'bg-garden-600 text-white'
                  : 'bg-white text-gray-600 border border-stone-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-6">
          {statusGroups.ideal.length > 0 && (
            <ResultGroup
              title="🟢 Plant Now"
              subtitle="These plants can be started, direct sown, or transplanted right now"
              color="green"
              results={statusGroups.ideal}
              onAddToCalendar={setCalendarSeed}
            />
          )}
          {statusGroups.possible.length > 0 && (
            <ResultGroup
              title="🟡 Coming Soon"
              subtitle="Not quite time yet — watch for the start window"
              color="amber"
              results={statusGroups.possible}
              onAddToCalendar={setCalendarSeed}
            />
          )}
          {statusGroups.stretch.length > 0 && (
            <ResultGroup
              title="🟠 Possible But Tight"
              subtitle="Might not have enough time before frost — worth trying if you're experimental"
              color="orange"
              results={statusGroups.stretch}
              onAddToCalendar={setCalendarSeed}
            />
          )}
          {statusGroups.tooLate.length > 0 && search && (
            <ResultGroup
              title="🔴 Season Passed"
              subtitle="Too late for this season — plan for next year"
              color="red"
              results={statusGroups.tooLate.slice(0, 10)}
              onAddToCalendar={setCalendarSeed}
            />
          )}
        </div>
      </div>

      <AddToCalendarModal seed={calendarSeed} onClose={() => setCalendarSeed(null)} />
    </div>
  );
}

interface ResultGroupProps {
  title: string;
  subtitle: string;
  color: 'green' | 'amber' | 'orange' | 'red';
  results: PlantResult[];
  onAddToCalendar: (seed: Seed) => void;
}

function ResultGroup({ title, subtitle, color, results, onAddToCalendar }: ResultGroupProps) {
  const [expanded, setExpanded] = useState(true);

  const colorBg: Record<string, string> = {
    green: 'bg-green-50 border-green-200',
    amber: 'bg-amber-50 border-amber-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-2"
      >
        <div className="text-left">
          <h2 className="font-bold text-gray-900 text-sm">{title} ({results.length})</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.slice(0, 20).map(({ seed, windows, directSow, indoorStart, transplant, firstHarvest, firstBloom, daysUntilStart }) => (
            <div key={seed.id} className={clsx('p-3 rounded-xl border', colorBg[color])}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 truncate">{seed.commonName}</span>
                    <CategoryBadge category={seed.category} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                    {windows.includes('can-start-indoors') && (
                      <span className="bg-white/70 text-green-700 px-1.5 py-0.5 rounded">🌱 Start indoors now</span>
                    )}
                    {windows.includes('can-direct-sow') && (
                      <span className="bg-white/70 text-amber-700 px-1.5 py-0.5 rounded">🌾 Direct sow now</span>
                    )}
                    {windows.includes('can-transplant') && (
                      <span className="bg-white/70 text-blue-700 px-1.5 py-0.5 rounded">🌿 Transplant now</span>
                    )}
                    {daysUntilStart && daysUntilStart > 0 && (
                      <span className="bg-white/70 text-gray-600 px-1.5 py-0.5 rounded">
                        {daysUntilStart}d until start
                      </span>
                    )}
                  </div>
                  {(firstHarvest || firstBloom) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {firstHarvest ? `🥕 Harvest ~${format(firstHarvest, 'MMM d')}` : ''}
                      {firstBloom ? `🌸 Bloom ~${format(firstBloom, 'MMM d')}` : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onAddToCalendar(seed)}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-white/70 hover:bg-white text-garden-700 transition-colors"
                  title="Add to calendar"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
          {results.length > 20 && (
            <div className="text-sm text-gray-400 text-center py-2 col-span-2">
              + {results.length - 20} more plants
            </div>
          )}
        </div>
      )}
    </div>
  );
}
