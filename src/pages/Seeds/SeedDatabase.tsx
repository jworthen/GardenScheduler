import { useState, useMemo } from 'react';
import { Search, Filter, Plus, X, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { useGardenStore } from '../../store/useStore';
import { Seed, PlantCategory, LightRequirement } from '../../types';
import { getCategoryBgLight, getCategoryTextColor, getCategoryLabel, getCategoryColor } from '../../data/seeds';
import { CategoryBadge, FrostBadge, LightBadge } from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import AddToCalendarModal from './AddToCalendarModal';
import SeedDetailModal from './SeedDetailModal';
import AddCustomPlantModal from './AddCustomPlantModal';

const CATEGORIES: Array<{ value: PlantCategory | 'all'; label: string; emoji: string }> = [
  { value: 'all', label: 'All Plants', emoji: '🌿' },
  { value: 'vegetable', label: 'Vegetables', emoji: '🥦' },
  { value: 'fruit', label: 'Fruits', emoji: '🍓' },
  { value: 'herb', label: 'Herbs', emoji: '🌿' },
  { value: 'flower-annual', label: 'Annual Flowers', emoji: '🌸' },
  { value: 'flower-perennial', label: 'Perennial Flowers', emoji: '💐' },
  { value: 'bulb', label: 'Bulbs & Tubers', emoji: '🌷' },
  { value: 'cutting', label: 'Cutting Garden', emoji: '✂️' },
];

const LIGHT_OPTIONS: Array<{ value: LightRequirement | 'all'; label: string }> = [
  { value: 'all', label: 'Any Light' },
  { value: 'full-sun', label: 'Full Sun' },
  { value: 'partial-shade', label: 'Partial Shade' },
  { value: 'shade', label: 'Shade' },
  { value: 'full-sun-to-partial-shade', label: 'Sun/Part Shade' },
];

const FROST_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'tender', label: 'Tender' },
  { value: 'half-hardy', label: 'Half Hardy' },
  { value: 'hardy', label: 'Hardy' },
  { value: 'very-hardy', label: 'Very Hardy' },
];

export default function SeedDatabase() {
  const { getAllSeeds, plantings } = useGardenStore();
  const allSeeds = getAllSeeds();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlantCategory | 'all'>('all');
  const [selectedLight, setSelectedLight] = useState<LightRequirement | 'all'>('all');
  const [selectedFrost, setSelectedFrost] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [calendarSeed, setCalendarSeed] = useState<Seed | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);

  const scheduledSeedIds = new Set(plantings.map((p) => p.seedId));

  const filtered = useMemo(() => {
    return allSeeds.filter((seed) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !seed.commonName.toLowerCase().includes(q) &&
          !seed.botanicalName.toLowerCase().includes(q) &&
          !(seed.subcategory?.toLowerCase().includes(q)) &&
          !(seed.growingNotes?.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      if (selectedCategory !== 'all' && seed.category !== selectedCategory) return false;
      if (selectedLight !== 'all' && seed.lightRequirement !== selectedLight) return false;
      if (selectedFrost !== 'all' && seed.frostTolerance !== selectedFrost) return false;
      return true;
    });
  }, [allSeeds, search, selectedCategory, selectedLight, selectedFrost]);

  const grouped = useMemo(() => {
    const groups: Record<string, Seed[]> = {};
    filtered.forEach((seed) => {
      const key = seed.category;
      if (!groups[key]) groups[key] = [];
      groups[key].push(seed);
    });
    return groups;
  }, [filtered]);

  const hasFilters = selectedCategory !== 'all' || selectedLight !== 'all' || selectedFrost !== 'all' || search;

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedLight('all');
    setSelectedFrost('all');
  };

  return (
    <div>
      <PageHeader
        title="Seed Database"
        subtitle={`${allSeeds.length} varieties across all categories`}
        icon="🌱"
        actions={
          <button onClick={() => setShowAddCustom(true)} className="btn-primary text-sm">
            <Plus size={16} /> Add Custom
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              className="input pl-9 pr-9"
              placeholder="Search by name, type, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'btn-secondary relative',
              hasFilters && 'border-garden-400 text-garden-700'
            )}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-garden-600 rounded-full text-white text-xs flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {CATEGORIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setSelectedCategory(value as PlantCategory | 'all')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                selectedCategory === value
                  ? 'bg-garden-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-stone-200 hover:border-stone-300'
              )}
            >
              <span>{emoji}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in">
            <div>
              <label className="label">Light Requirements</label>
              <select
                className="input text-sm"
                value={selectedLight}
                onChange={(e) => setSelectedLight(e.target.value as LightRequirement | 'all')}
              >
                {LIGHT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Frost Tolerance</label>
              <select
                className="input text-sm"
                value={selectedFrost}
                onChange={(e) => setSelectedFrost(e.target.value)}
              >
                {FROST_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <div className="flex items-end">
                <button onClick={clearFilters} className="btn-secondary text-sm w-full justify-center">
                  <X size={14} /> Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filtered.length === allSeeds.length
              ? `${allSeeds.length} plants`
              : `${filtered.length} of ${allSeeds.length} plants`}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-garden-600 hover:text-garden-700 font-medium">
              Clear all filters
            </button>
          )}
        </div>

        {/* Seed cards - grouped by category if not filtered */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="mx-auto mb-3 opacity-30" size={40} />
            <p className="text-lg font-medium">No plants found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : selectedCategory !== 'all' || search ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((seed) => (
              <SeedCard
                key={seed.id}
                seed={seed}
                isScheduled={scheduledSeedIds.has(seed.id)}
                onView={setSelectedSeed}
                onAddToCalendar={setCalendarSeed}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORIES.slice(1).map(({ value, label, emoji }) => {
              const group = grouped[value];
              if (!group || group.length === 0) return null;
              return (
                <div key={value}>
                  <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>{emoji}</span> {label}
                    <span className="text-sm font-normal text-gray-400">({group.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.map((seed) => (
                      <SeedCard
                        key={seed.id}
                        seed={seed}
                        isScheduled={scheduledSeedIds.has(seed.id)}
                        onView={setSelectedSeed}
                        onAddToCalendar={setCalendarSeed}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <SeedDetailModal
        seed={selectedSeed}
        onClose={() => setSelectedSeed(null)}
        onAddToCalendar={setCalendarSeed}
      />
      <AddToCalendarModal
        seed={calendarSeed}
        onClose={() => setCalendarSeed(null)}
      />
      <AddCustomPlantModal
        isOpen={showAddCustom}
        onClose={() => setShowAddCustom(false)}
      />
    </div>
  );
}

interface SeedCardProps {
  seed: Seed;
  isScheduled: boolean;
  onView: (seed: Seed) => void;
  onAddToCalendar: (seed: Seed) => void;
}

function SeedCard({ seed, isScheduled, onView, onAddToCalendar }: SeedCardProps) {
  return (
    <div
      className="card p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onView(seed)}
    >
      <div className="flex items-start gap-3">
        <div className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
          seed.color
        )}>
          {seed.icon || '🌱'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {seed.commonName}
            </h3>
            {isScheduled && (
              <span className="badge bg-garden-50 text-garden-700 border border-garden-200 text-xs flex-shrink-0 ml-1">
                ✓ Added
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 italic mt-0.5 truncate">{seed.botanicalName}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <CategoryBadge category={seed.category} />
        {seed.openPollinated && (
          <span className="badge bg-amber-50 text-amber-700 border border-amber-200">OP</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500">
        <div>
          <span className="font-medium">Germ:</span>{' '}
          {seed.daysToGermination.min}–{seed.daysToGermination.max}d
        </div>
        {seed.daysToMaturity && (
          <div>
            <span className="font-medium">Maturity:</span> {seed.daysToMaturity}d
          </div>
        )}
        {seed.daysToBloom && (
          <div>
            <span className="font-medium">Bloom:</span> {seed.daysToBloom}d
          </div>
        )}
        <div>
          <span className="font-medium">Space:</span> {seed.spacing}"
        </div>
        <div className="col-span-2">
          <LightBadge light={seed.lightRequirement} className="text-xs" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="text-xs text-gray-400">
          {seed.startIndoors && `🌱 ${seed.indoorStartWeeks}wk indoors`}
          {seed.startIndoors && seed.directSow && ' · '}
          {seed.directSow && '🌾 Direct sow'}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCalendar(seed);
        }}
        className="mt-3 w-full py-1.5 text-xs font-medium rounded-lg border border-garden-200 text-garden-700 hover:bg-garden-50 transition-colors opacity-0 group-hover:opacity-100"
      >
        + Add to Calendar
      </button>
    </div>
  );
}
