import { useState, useMemo } from 'react';
import { Plus, Search, X, Flower2, Trash2, Share2, Printer, CheckSquare, Square, Copy, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useGardenStore } from '../../store/useStore';
import { PlantingEntry, PlantCategory } from '../../types';
import { formatDisplayDateShort } from '../../utils/dateCalculations';
import { deletePhotos } from '../../lib/photoUpload';
import PageHeader from '../../components/common/PageHeader';
import PlantingDetailPanel from '../../components/PlantingDetail/PlantingDetailPanel';
import BulkTagPrintModal from '../../components/SeedTag/BulkTagPrintModal';
import { useGardenContext } from '../../contexts/GardenContext';
import { loadGardenData, saveGardenData } from '../../lib/gardens';
import { useAuth } from '../../contexts/AuthContext';

// ===== HELPERS =====

const CATEGORY_LABELS: Record<PlantCategory, string> = {
  vegetable: 'Vegetable',
  fruit: 'Fruit',
  herb: 'Herb',
  'flower-annual': 'Annual Flower',
  'flower-perennial': 'Perennial Flower',
  bulb: 'Bulb',
  cutting: 'Cutting',
};

const DATE_PILLS = [
  { key: 'indoorStartDate', label: '🌱 Start', colorClass: 'bg-green-100 text-green-800' },
  { key: 'directSowDate', label: '🌾 Sow', colorClass: 'bg-amber-100 text-amber-800' },
  { key: 'transplantDate', label: '🌿 Plant', colorClass: 'bg-blue-100 text-blue-800' },
  { key: 'firstHarvestDate', label: '🥕 Harvest', colorClass: 'bg-red-100 text-red-800' },
  { key: 'firstBloomDate', label: '🌸 Bloom', colorClass: 'bg-pink-100 text-pink-800' },
] as const;

// ===== PLANTING CARD =====

function PlantingCard({
  planting,
  onClick,
  onDelete,
  selectMode,
  selected,
  onSelect,
}: {
  planting: PlantingEntry;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const displayName = planting.varietyName || planting.seedName;
  const subName = planting.varietyName ? planting.seedName : null;

  return (
    <div
      className={clsx(
        'card p-4 hover:shadow-md transition-all hover:-translate-y-0.5 group relative',
        selectMode && selected && 'ring-2 ring-garden-500 bg-garden-50',
      )}
      onClick={selectMode ? () => onSelect?.(planting.id) : undefined}
    >
      {/* Select checkbox (select mode) */}
      {selectMode ? (
        <div className="absolute top-2.5 right-2.5">
          {selected
            ? <CheckSquare size={16} className="text-garden-600" />
            : <Square size={16} className="text-gray-300" />}
        </div>
      ) : (
        /* Delete button — hover reveal */
        <button
          onClick={onDelete}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
          title="Delete planting"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Clickable body */}
      <button onClick={selectMode ? undefined : onClick} className="text-left w-full">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3 pr-6">
          <div className={clsx('w-3 h-3 rounded-full flex-shrink-0 mt-1', planting.color)} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{displayName}</p>
            {subName && <p className="text-xs text-gray-400 truncate">{subName}</p>}
          </div>
          {planting.successionIndex !== undefined && (
            <span className="badge bg-stone-100 text-gray-500 text-xs flex-shrink-0">
              #{planting.successionIndex + 1}
            </span>
          )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {DATE_PILLS.map(({ key, label, colorClass }) => {
          const date = planting[key as keyof PlantingEntry] as string | undefined;
          if (!date) return null;
          return (
            <span key={key} className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', colorClass)}>
              {label} {formatDisplayDateShort(date)}
            </span>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="capitalize">{CATEGORY_LABELS[planting.category] ?? planting.category}</span>
        {planting.bedLocation && (
          <>
            <span>·</span>
            <span className="truncate">📍 {planting.bedLocation}</span>
          </>
        )}
        {planting.quantity > 1 && (
          <>
            <span>·</span>
            <span>{planting.quantity}×</span>
          </>
        )}
        {(planting.availableToShare ?? 0) > 0 && (
          <>
            <span>·</span>
            <span className="flex items-center gap-0.5 text-garden-600">
              <Share2 size={10} />
              {planting.availableToShare}
            </span>
          </>
        )}
      </div>
      </button>
    </div>
  );
}

// ===== PAGE =====

type SortKey = 'name' | 'sowDate' | 'transplantDate';
const SORT_KEYS: SortKey[] = ['name', 'sowDate', 'transplantDate'];

export default function Plantings() {
  const { plantings, tasks, removePlanting, clearAllPlantings } = useGardenStore();
  const { user } = useAuth();
  const { gardens, activeGardenId } = useGardenContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBulkPrint, setShowBulkPrint] = useState(false);

  // ── Multi-select / copy ──
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copyTargetId, setCopyTargetId] = useState('');
  const [copying, setCopying] = useState(false);

  const otherGardens = gardens.filter((g) => g.id !== activeGardenId);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setCopyTargetId('');
  };

  const handleCopyToGarden = async () => {
    if (!user || !copyTargetId || selectedIds.size === 0) return;
    const targetGarden = gardens.find((g) => g.id === copyTargetId);
    if (!targetGarden) return;

    setCopying(true);
    try {
      const ownerUid = targetGarden.sharedOwnerId ?? user.uid;
      const existing = await loadGardenData(ownerUid, copyTargetId);
      const existingPlantings = (existing?.plantings as PlantingEntry[]) ?? [];
      const existingTasks = (existing?.tasks ?? []) as typeof tasks;

      const toCopy = plantings.filter((p) => selectedIds.has(p.id));
      // Map old IDs → new IDs so tasks stay linked
      const idMap = new Map<string, string>();
      const newPlantings = toCopy.map((p) => {
        const newId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        idMap.set(p.id, newId);
        return { ...p, id: newId };
      });
      const newTasks = tasks
        .filter((t) => idMap.has(t.plantingEntryId))
        .map((t) => ({
          ...t,
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          plantingEntryId: idMap.get(t.plantingEntryId)!,
        }));

      await saveGardenData(ownerUid, copyTargetId, {
        ...existing,
        plantings: [...existingPlantings, ...newPlantings],
        tasks: [...existingTasks, ...newTasks],
        savedAt: new Date().toISOString(),
      });

      exitSelectMode();
      alert(`Copied ${newPlantings.length} planting${newPlantings.length !== 1 ? 's' : ''} to "${targetGarden.name}".`);
    } catch (e) {
      console.error(e);
      alert('Failed to copy plantings. Please try again.');
    } finally {
      setCopying(false);
    }
  };
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<PlantCategory | ''>('');
  const [filterBed, setFilterBed] = useState('');
  const [sort, setSort] = useState<SortKey>(() => {
    const stored = localStorage.getItem('plantings-sort');
    return SORT_KEYS.includes(stored as SortKey) ? (stored as SortKey) : 'sowDate';
  });

  const setSortPersisted = (key: SortKey) => {
    localStorage.setItem('plantings-sort', key);
    setSort(key);
  };

  const selectedPlanting = plantings.find((p) => p.id === selectedId) ?? null;

  // Unique bed names for the filter dropdown
  const beds = useMemo(() => {
    const names = plantings.map((p) => p.bedLocation).filter(Boolean) as string[];
    return [...new Set(names)].sort();
  }, [plantings]);

  // Categories present in this user's plantings
  const presentCategories = useMemo(() => {
    return [...new Set(plantings.map((p) => p.category))].sort() as PlantCategory[];
  }, [plantings]);

  const filtered = useMemo(() => {
    let list = [...plantings];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.varietyName ?? '').toLowerCase().includes(q) ||
          p.seedName.toLowerCase().includes(q) ||
          (p.bedLocation ?? '').toLowerCase().includes(q),
      );
    }

    if (filterCategory) {
      list = list.filter((p) => p.category === filterCategory);
    }

    if (filterBed) {
      list = list.filter((p) => p.bedLocation === filterBed);
    }

    list.sort((a, b) => {
      if (sort === 'name') {
        return (a.varietyName || a.seedName).localeCompare(b.varietyName || b.seedName);
      }
      if (sort === 'sowDate') {
        const da = a.indoorStartDate ?? a.directSowDate ?? '';
        const db = b.indoorStartDate ?? b.directSowDate ?? '';
        return da.localeCompare(db);
      }
      if (sort === 'transplantDate') {
        return (a.transplantDate ?? '').localeCompare(b.transplantDate ?? '');
      }
      return 0;
    });

    return list;
  }, [plantings, search, filterCategory, filterBed, sort]);

  const hasFilters = search || filterCategory || filterBed;

  return (
    <div>
      <PageHeader
        title="My Plantings"
        subtitle={`${plantings.length} plant${plantings.length !== 1 ? 's' : ''} scheduled`}
        icon="🌿"
        actions={
          <div className="flex items-center gap-2">
            {plantings.length > 0 && (
              <>
                <button
                  onClick={() => setShowBulkPrint(true)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-stone-100 px-3 py-2 rounded-lg border border-stone-200 transition-colors"
                >
                  <Printer size={15} />
                  Print Tags
                </button>
                {otherGardens.length > 0 && (
                  <button
                    onClick={() => { setSelectMode(true); setSelectedId(null); }}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-stone-100 px-3 py-2 rounded-lg border border-stone-200 transition-colors"
                  >
                    <Copy size={15} />
                    Copy to Garden
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete all ${plantings.length} planting${plantings.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
                    const allPhotos = plantings.flatMap((p) => p.photos ?? []);
                    if (allPhotos.length) await deletePhotos(allPhotos);
                    clearAllPlantings();
                    setSelectedId(null);
                  }}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200 transition-colors"
                >
                  <Trash2 size={15} />
                  Delete All
                </button>
              </>
            )}
            <Link to="/seeds" className="btn-primary text-sm">
              <Plus size={16} /> Add Plant
            </Link>
          </div>
        }
      />

      <div className="px-4 sm:px-6 py-4">
        {plantings.length === 0 ? (
          <div className="text-center py-24">
            <Flower2 className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-lg font-medium text-gray-500 mb-1">No plants yet</p>
            <p className="text-sm text-gray-400 mb-5">Browse the seed database to start scheduling plants</p>
            <Link to="/seeds" className="btn-primary mx-auto">
              <Plus size={16} /> Browse Seeds
            </Link>
          </div>
        ) : (
          <>
            {/* Filter / sort bar */}
            <div className="flex flex-wrap gap-2 mb-5">
              {/* Search */}
              <div className="relative flex-1 min-w-40">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search plants…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-8 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category filter */}
              {presentCategories.length > 1 && (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as PlantCategory | '')}
                  className="input text-sm w-auto"
                >
                  <option value="">All types</option>
                  {presentCategories.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
                  ))}
                </select>
              )}

              {/* Bed filter */}
              {beds.length > 0 && (
                <select
                  value={filterBed}
                  onChange={(e) => setFilterBed(e.target.value)}
                  className="input text-sm w-auto"
                >
                  <option value="">All beds</option>
                  {beds.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              )}

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSortPersisted(e.target.value as SortKey)}
                className="input text-sm w-auto"
              >
                <option value="sowDate">Sort: Sow date</option>
                <option value="transplantDate">Sort: Transplant date</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>

            {/* Results count when filtering */}
            {hasFilters && (
              <p className="text-sm text-gray-500 mb-3">
                {filtered.length} of {plantings.length} plants
                {hasFilters && (
                  <button
                    onClick={() => { setSearch(''); setFilterCategory(''); setFilterBed(''); }}
                    className="ml-2 text-garden-600 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </p>
            )}

            {/* Select mode bar */}
            {selectMode && (
              <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-garden-50 rounded-xl border border-garden-200">
                <span className="text-sm font-medium text-garden-800">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={() => setSelectedIds(new Set(filtered.map((p) => p.id)))}
                  className="text-sm text-garden-600 hover:underline"
                >
                  Select all ({filtered.length})
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Deselect all
                  </button>
                )}
                <div className="flex-1" />
                <select
                  value={copyTargetId}
                  onChange={(e) => setCopyTargetId(e.target.value)}
                  className="input text-sm w-auto"
                >
                  <option value="">Copy to…</option>
                  {otherGardens.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleCopyToGarden}
                  disabled={selectedIds.size === 0 || !copyTargetId || copying}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {copying ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                  {copying ? 'Copying…' : 'Copy'}
                </button>
                <button onClick={exitSelectMode} className="btn-secondary text-sm">
                  <X size={14} /> Cancel
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="font-medium">No plants match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((p) => (
                  <PlantingCard
                    key={p.id}
                    planting={p}
                    onClick={() => setSelectedId(p.id)}
                    onDelete={async (e) => {
                      e.stopPropagation();
                      const name = p.varietyName || p.seedName;
                      if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
                        await deletePhotos(p.photos ?? []);
                        removePlanting(p.id);
                        if (selectedId === p.id) setSelectedId(null);
                      }
                    }}
                    selectMode={selectMode}
                    selected={selectedIds.has(p.id)}
                    onSelect={toggleSelect}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showBulkPrint && (
        <BulkTagPrintModal
          plantings={filtered}
          onClose={() => setShowBulkPrint(false)}
        />
      )}

      {selectedPlanting && (
        <PlantingDetailPanel
          planting={selectedPlanting}
          onClose={() => setSelectedId(null)}
          onRemove={async () => {
            if (window.confirm(`Remove ${selectedPlanting.varietyName || selectedPlanting.seedName} from calendar?`)) {
              await deletePhotos(selectedPlanting.photos ?? []);
              removePlanting(selectedPlanting.id);
              setSelectedId(null);
            }
          }}
        />
      )}
    </div>
  );
}
