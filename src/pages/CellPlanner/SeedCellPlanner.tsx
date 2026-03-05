import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Grid3X3, Plus, Trash2, Printer, ChevronRight, X, Eraser, Sprout } from 'lucide-react';
import clsx from 'clsx';
import { useGardenStore } from '../../store/useStore';
import { CellPlan, InventoryItem, PlantCategory, Seed } from '../../types';
import PageHeader from '../../components/common/PageHeader';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ---------------------------------------------------------------------------
// Start Plantings modal
// ---------------------------------------------------------------------------

interface StartPlantingsModalProps {
  plan: CellPlan;
  allSeeds: Seed[];
  inventory: InventoryItem[];
  addPlanting: (seedId: string, seed: Seed, options?: { quantity?: number; bedLocation?: string; year?: number }) => void;
  onClose: () => void;
}

function StartPlantingsModal({ plan, allSeeds, inventory, addPlanting, onClose }: StartPlantingsModalProps) {
  const seedGroups = useMemo(() => {
    const map = new Map<string, { seedId: string; varietyName: string; category: PlantCategory; count: number }>();
    Object.values(plan.cells).forEach((cell) => {
      const key = cell.seedId ?? cell.varietyName ?? '';
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          seedId: cell.seedId ?? key,
          varietyName: cell.varietyName ?? '',
          category: (cell.category as PlantCategory) ?? 'vegetable',
          count: 0,
        });
      }
      map.get(key)!.count++;
    });
    return Array.from(map.values()).sort((a, b) => a.varietyName.localeCompare(b.varietyName));
  }, [plan]);

  const [checked, setChecked] = useState<Set<string>>(() => new Set(seedGroups.map((g) => g.seedId)));
  const [year, setYear] = useState(new Date().getFullYear());
  const [bedLocation, setBedLocation] = useState(plan.name);

  const allChecked = checked.size === seedGroups.length;

  const handleCreate = () => {
    seedGroups.forEach((group) => {
      if (!checked.has(group.seedId)) return;

      let seed = allSeeds.find((s) => s.id === group.seedId);
      // For inv: IDs, resolve through the inventory item to get the db seed (and its schedule data)
      if (!seed && group.seedId.startsWith('inv:')) {
        const invItemId = group.seedId.slice(4);
        const invItem = inventory.find((i) => i.id === invItemId);
        if (invItem?.seedId) seed = allSeeds.find((s) => s.id === invItem.seedId);
      }
      if (!seed) {
        // Stub for unlinked custom seeds — no schedule dates will be generated
        seed = {
          id: group.seedId,
          commonName: group.varietyName,
          botanicalName: '',
          plantType: 'annual',
          category: group.category,
          daysToGermination: { min: 5, max: 14 },
          startIndoors: false,
          directSow: true,
          indoorStartWeeks: 0,
          directSowWeeks: 0,
          lightRequirement: 'full-sun',
          spacing: 6,
          plantingDepth: 0.25,
          coldStratification: false,
          frostTolerance: 'tender',
          waterNeeds: 'medium',
          growingNotes: '',
          color: CATEGORY_ACCENT[group.category],
          isCustom: true,
        };
      }

      addPlanting(group.seedId, seed, {
        quantity: group.count,
        bedLocation: bedLocation.trim() || undefined,
        year,
      });
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] flex flex-col">
        <h2 className="text-lg font-semibold text-gray-900">Start Plantings</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Each seed in <span className="font-medium text-gray-700">{plan.name}</span> becomes a
          tracked planting. Cell count becomes quantity.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <input
              type="number"
              className="input text-sm"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              min={2020}
              max={2040}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bed / Location</label>
            <input
              type="text"
              className="input text-sm"
              value={bedLocation}
              onChange={(e) => setBedLocation(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Seeds in this flat
          </span>
          <button
            type="button"
            onClick={() => setChecked(allChecked ? new Set() : new Set(seedGroups.map((g) => g.seedId)))}
            className="text-xs text-garden-600 hover:underline"
          >
            {allChecked ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 -mx-1 px-1 space-y-1">
          {seedGroups.map((group) => {
            const hasDbLink = !group.seedId.startsWith('inv:') ||
              inventory.some((i) => i.id === group.seedId.slice(4) && i.seedId);
            return (
              <label
                key={group.seedId}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors',
                  checked.has(group.seedId) ? 'bg-garden-50' : 'hover:bg-stone-50',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked.has(group.seedId)}
                  onChange={(e) => {
                    const next = new Set(checked);
                    if (e.target.checked) next.add(group.seedId);
                    else next.delete(group.seedId);
                    setChecked(next);
                  }}
                  className="rounded flex-shrink-0"
                />
                <span
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_ACCENT[group.category] }}
                />
                <span className="flex-1 text-sm text-gray-800">{group.varietyName}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">×{group.count}</span>
                {!hasDbLink && (
                  <span className="text-[10px] text-amber-600 flex-shrink-0">no schedule</span>
                )}
              </label>
            );
          })}
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={checked.size === 0}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sprout size={15} />
            Start {checked.size} Planting{checked.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_BG: Record<PlantCategory, string> = {
  vegetable: '#bbf7d0',
  fruit: '#fecaca',
  herb: '#e9d5ff',
  'flower-annual': '#fed7aa',
  'flower-perennial': '#bfdbfe',
  bulb: '#fbcfe8',
  cutting: '#ffe4e6',
};

const CATEGORY_ACCENT: Record<PlantCategory, string> = {
  vegetable: '#16a34a',
  fruit: '#ef4444',
  herb: '#9333ea',
  'flower-annual': '#f97316',
  'flower-perennial': '#3b82f6',
  bulb: '#ec4899',
  cutting: '#f43f5e',
};

interface SeedOption {
  seedId: string;   // inv:<itemId> for inventory items; seed db id for search results
  itemId?: string;  // inventory item id — unique per packet
  varietyName: string;
  category: PlantCategory;
}

const FLAT_PRESETS = [
  { label: '50-cell', cols: 5, rows: 10 },
  { label: '72-cell', cols: 9, rows: 8 },
  { label: '128-cell', cols: 8, rows: 16 },
  { label: '288-cell', cols: 12, rows: 24 },
];

export default function SeedCellPlanner() {
  const { cellPlans, addCellPlan, updateCellPlan, removeCellPlan, inventory, getAllSeeds, addPlanting } =
    useGardenStore();

  const [activePlanId, setActivePlanId] = useState<string | null>(
    () => cellPlans[0]?.id ?? null
  );
  const [activeSeed, setActiveSeed] = useState<SeedOption | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showStartPlantings, setShowStartPlantings] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCols, setNewCols] = useState(9);
  const [newRows, setNewRows] = useState(8);
  const [seedSearch, setSeedSearch] = useState('');
  const paintingRef = useRef(false);
  const dragSourceRef = useRef<string | null>(null);
  const dragTargetRef = useRef<string | null>(null);
  const [dragSourceKey, setDragSourceKey] = useState<string | null>(null);
  const [dragTargetKey, setDragTargetKey] = useState<string | null>(null);

  const activePlan = cellPlans.find((p) => p.id === activePlanId) ?? null;
  const allSeeds = getAllSeeds();

  // One entry per non-empty inventory packet — no deduplication
  const inventorySeeds: SeedOption[] = inventory
    .filter((item) => item.status !== 'empty')
    .map((item) => {
      const seed = item.seedId ? allSeeds.find((s) => s.id === item.seedId) : undefined;
      return {
        seedId: `inv:${item.id}`,   // always unique per packet
        itemId: item.id,
        varietyName: item.varietyName,
        category: seed?.category ?? 'vegetable',
      };
    })
    .sort((a, b) => a.varietyName.localeCompare(b.varietyName));

  // Set of db seed ids present in inventory — used for "in stash" badge in search
  const inventorySeedIds = new Set(
    inventory.filter((i) => i.status !== 'empty' && i.seedId).map((i) => i.seedId!)
  );

  const filteredAllSeeds = seedSearch.trim()
    ? allSeeds
        .filter((s) => s.commonName.toLowerCase().includes(seedSearch.toLowerCase()))
        .sort((a, b) => {
          const aIn = inventorySeedIds.has(a.id) ? 0 : 1;
          const bIn = inventorySeedIds.has(b.id) ? 0 : 1;
          return aIn - bIn;
        })
    : allSeeds;

  const handleCreatePlan = () => {
    if (!newName.trim()) return;
    const id = generateId();
    const plan: CellPlan = {
      id,
      name: newName.trim(),
      cols: newCols,
      rows: newRows,
      cells: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addCellPlan(plan);
    setActivePlanId(id);
    setShowNewPlan(false);
    setNewName('');
    setNewCols(9);
    setNewRows(8);
  };

  const paintCell = useCallback(
    (col: number, row: number) => {
      if (!activePlan) return;
      const key = `${col}-${row}`;
      const newCells = { ...activePlan.cells };

      if (isErasing) {
        delete newCells[key];
      } else if (activeSeed) {
        newCells[key] = {
          seedId: activeSeed.seedId,
          varietyName: activeSeed.varietyName,
          category: activeSeed.category,
        };
      } else {
        return;
      }

      updateCellPlan(activePlan.id, { cells: newCells, updatedAt: new Date().toISOString() });
    },
    [activePlan, activeSeed, isErasing, updateCellPlan]
  );

  const clearCell = useCallback(
    (col: number, row: number) => {
      if (!activePlan) return;
      const key = `${col}-${row}`;
      const newCells = { ...activePlan.cells };
      delete newCells[key];
      updateCellPlan(activePlan.id, { cells: newCells, updatedAt: new Date().toISOString() });
    },
    [activePlan, updateCellPlan]
  );

  const cancelDrag = useCallback(() => {
    dragSourceRef.current = null;
    dragTargetRef.current = null;
    setDragSourceKey(null);
    setDragTargetKey(null);
  }, []);

  const moveCell = useCallback(
    (fromKey: string, toKey: string) => {
      if (!activePlan || fromKey === toKey) return;
      const newCells = { ...activePlan.cells };
      newCells[toKey] = newCells[fromKey];
      delete newCells[fromKey];
      updateCellPlan(activePlan.id, { cells: newCells, updatedAt: new Date().toISOString() });
    },
    [activePlan, updateCellPlan]
  );

  useEffect(() => {
    const stop = () => { paintingRef.current = false; };
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  // Build legend from cells in active plan
  const legend = new Map<string, { varietyName: string; category: PlantCategory; count: number }>();
  if (activePlan) {
    Object.values(activePlan.cells).forEach((cell) => {
      const key = cell.seedId ?? cell.varietyName ?? '';
      if (!key) return;
      if (!legend.has(key)) {
        legend.set(key, {
          varietyName: cell.varietyName ?? '',
          category: (cell.category as PlantCategory) ?? 'vegetable',
          count: 0,
        });
      }
      legend.get(key)!.count++;
    });
  }

  const selectSeed = (opt: SeedOption) => {
    if (activeSeed?.seedId === opt.seedId) {
      setActiveSeed(null);
    } else {
      setActiveSeed(opt);
      setIsErasing(false);
    }
  };

  const toggleEraser = () => {
    setIsErasing((e) => !e);
    setActiveSeed(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Print stylesheet injected inline */}
      <style>{`
        @media print {
          body { margin: 0; }
          .cell-grid-wrapper { page-break-inside: avoid; }
          ${activePlan && activePlan.cols > activePlan.rows
            ? `@page { size: landscape; }
               .cell-grid { width: 100%; }
               .cell-grid { grid-template-columns: repeat(${activePlan.cols}, 1fr) !important; }`
            : ''}
        }
      `}</style>

      <PageHeader
        title="Cell Planner"
        subtitle="Map out your seed trays and flats"
        icon="🌱"
        actions={
          <div className="flex items-center gap-2 print:hidden">
            {activePlan && Object.keys(activePlan.cells).length > 0 && (
              <button
                onClick={() => setShowStartPlantings(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Sprout size={16} />
                Start Plantings
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="btn-secondary flex items-center gap-2"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: plan list ── */}
        <aside className="w-52 flex-shrink-0 border-r border-stone-200 bg-white flex flex-col overflow-hidden print:hidden">
          <div className="px-3 py-3 border-b border-stone-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plans</span>
            <button
              onClick={() => setShowNewPlan(true)}
              className="p-1 rounded-md text-garden-600 hover:bg-garden-50 transition-colors"
              title="New plan"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {cellPlans.length === 0 ? (
              <div className="px-4 mt-8 text-center">
                <p className="text-xs text-gray-400">No plans yet.</p>
                <button
                  onClick={() => setShowNewPlan(true)}
                  className="mt-3 text-xs text-garden-600 hover:underline"
                >
                  Create your first plan
                </button>
              </div>
            ) : (
              cellPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setActivePlanId(plan.id)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                    plan.id === activePlanId
                      ? 'bg-garden-50 text-garden-700 font-medium'
                      : 'text-gray-600 hover:bg-stone-50'
                  }`}
                >
                  <Grid3X3 size={14} className="flex-shrink-0 opacity-50" />
                  <span className="flex-1 truncate">{plan.name}</span>
                  {plan.id === activePlanId && (
                    <ChevronRight size={14} className="opacity-40 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {activePlan && (
            <div className="px-3 py-3 border-t border-stone-100 space-y-2.5">
              <p className="text-xs text-gray-500">
                {activePlan.cols} cols × {activePlan.rows} rows &nbsp;·&nbsp;{' '}
                {activePlan.cols * activePlan.rows} cells
              </p>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${activePlan.name}"?`)) {
                    removeCellPlan(activePlan.id);
                    const next = cellPlans.find((p) => p.id !== activePlan.id);
                    setActivePlanId(next?.id ?? null);
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={13} />
                Delete plan
              </button>
            </div>
          )}
        </aside>

        {/* ── Center: grid ── */}
        <main className="flex-1 overflow-auto bg-stone-50 p-4 sm:p-6">
          {!activePlan ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <Grid3X3 size={52} className="text-gray-200" />
              <div>
                <p className="text-gray-500 font-medium">No plan selected</p>
                <p className="text-sm text-gray-400 mt-1">Select a plan from the list or create a new one</p>
              </div>
              <button
                onClick={() => setShowNewPlan(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={16} />
                New Plan
              </button>
            </div>
          ) : (
            <div className="cell-grid-wrapper">
              {/* Print-only header */}
              <div className="hidden print:block mb-4">
                <h1 className="text-2xl font-bold">{activePlan.name}</h1>
                <p className="text-sm text-gray-500">
                  {activePlan.cols} columns × {activePlan.rows} rows &nbsp;·&nbsp; Printed{' '}
                  {new Date().toLocaleDateString()}
                </p>
              </div>

              {/* Hint bar */}
              <div className="mb-3 text-xs text-gray-400 print:hidden">
                {isErasing
                  ? 'Eraser active — click or drag cells to clear them. Right-click also clears.'
                  : activeSeed
                  ? `Painting "${activeSeed.varietyName}" — click or drag cells. Right-click to clear.`
                  : 'Select a seed or the eraser from the stash panel, then click cells to fill them.'}
              </div>

              {/* Grid */}
              <div
                className="cell-grid inline-grid gap-px bg-stone-300 border border-stone-300 rounded overflow-hidden"
                style={{
                  gridTemplateColumns: `repeat(${activePlan.cols}, minmax(2.5rem, 4rem))`,
                }}
                onDragStart={(e) => e.preventDefault()}
                onMouseUp={() => {
                  if (dragSourceRef.current && dragTargetRef.current) {
                    moveCell(dragSourceRef.current, dragTargetRef.current);
                  }
                  cancelDrag();
                }}
                onMouseLeave={cancelDrag}
              >
                {Array.from({ length: activePlan.rows }, (_, row) =>
                  Array.from({ length: activePlan.cols }, (_, col) => {
                    const key = `${col}-${row}`;
                    const cell = activePlan.cells[key];
                    const cat = cell?.category as PlantCategory | undefined;
                    const cellNum = row * activePlan.cols + col + 1;
                    return (
                      <div
                        key={key}
                        style={{
                          backgroundColor: cat ? CATEGORY_BG[cat] : '#ffffff',
                          borderLeft: cat ? `3px solid ${CATEGORY_ACCENT[cat]}` : '3px solid transparent',
                          opacity: dragSourceKey === key ? 0.4 : 1,
                          outline: dragTargetKey === key && dragSourceKey !== key ? '2px solid #4f7c3f' : 'none',
                          outlineOffset: '-2px',
                        }}
                        className={`min-h-[2.5rem] p-1 select-none flex flex-col justify-center ${
                          cell && !activeSeed && !isErasing ? 'cursor-grab' : 'cursor-pointer'
                        }`}
                        onMouseDown={(e) => {
                          if (e.button !== 0) return;
                          if (cell && !activeSeed && !isErasing) {
                            // Start move drag
                            dragSourceRef.current = key;
                            dragTargetRef.current = key;
                            setDragSourceKey(key);
                            setDragTargetKey(key);
                          } else {
                            paintingRef.current = true;
                            paintCell(col, row);
                          }
                        }}
                        onMouseEnter={() => {
                          if (dragSourceRef.current) {
                            dragTargetRef.current = key;
                            setDragTargetKey(key);
                          } else if (paintingRef.current) {
                            paintCell(col, row);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          clearCell(col, row);
                        }}
                      >
                        {cell?.varietyName ? (
                          <span
                            className="text-[10px] leading-tight font-medium text-gray-800 break-words"
                            title={cell.varietyName}
                          >
                            {cell.varietyName}
                          </span>
                        ) : (
                          <span className="text-[9px] text-stone-300 text-center w-full">
                            {cellNum}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Legend */}
              {legend.size > 0 && (
                <div className="mt-6 print:mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Legend
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(legend.entries()).map(([key, info]) => (
                      <div
                        key={key}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: CATEGORY_BG[info.category],
                          borderLeft: `3px solid ${CATEGORY_ACCENT[info.category]}`,
                        }}
                      >
                        <span className="font-medium text-gray-800">{info.varietyName}</span>
                        <span className="text-gray-500">×{info.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Right panel: seed stash ── */}
        <aside className="w-52 flex-shrink-0 border-l border-stone-200 bg-white flex flex-col overflow-hidden print:hidden">
          <div className="px-3 py-3 border-b border-stone-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stash</span>
          </div>

          {/* Active tool pill */}
          <div className="px-3 pt-3 flex-shrink-0 space-y-2">
            <button
              onClick={toggleEraser}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors ${
                isErasing
                  ? 'bg-gray-100 text-gray-700 font-medium ring-1 ring-gray-300'
                  : 'text-gray-500 hover:bg-stone-50'
              }`}
            >
              <Eraser size={13} />
              Eraser
            </button>

            {activeSeed && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-gray-800"
                style={{
                  backgroundColor: CATEGORY_BG[activeSeed.category],
                  borderLeft: `3px solid ${CATEGORY_ACCENT[activeSeed.category]}`,
                }}
              >
                <span className="flex-1 truncate">✏️ {activeSeed.varietyName}</span>
                <button
                  onClick={() => setActiveSeed(null)}
                  className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X size={11} />
                </button>
              </div>
            )}
          </div>

          {/* Search — always visible */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <input
              className="w-full text-xs border border-stone-200 rounded px-2 py-1.5 focus:outline-none focus:border-garden-400"
              placeholder="Search seeds…"
              value={seedSearch}
              onChange={(e) => setSeedSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto pb-2">
            {seedSearch.trim() ? (
              /* ── Search results ── */
              filteredAllSeeds.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">No matches</p>
              ) : (
                filteredAllSeeds.map((seed) => {
                  const inInventory = inventorySeedIds.has(seed.id);
                  return (
                    <button
                      key={seed.id}
                      onClick={() =>
                        selectSeed({ seedId: seed.id, varietyName: seed.commonName, category: seed.category })
                      }
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                        activeSeed?.seedId === seed.id
                          ? 'bg-garden-50 text-garden-700'
                          : 'text-gray-600 hover:bg-stone-50'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_ACCENT[seed.category] }}
                      />
                      <span className="flex-1 truncate">{seed.commonName}</span>
                      {inInventory && (
                        <span className="text-[9px] text-garden-600 font-medium flex-shrink-0">in stash</span>
                      )}
                    </button>
                  );
                })
              )
            ) : (
              /* ── Default: inventory only ── */
              inventorySeeds.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-gray-400">No seeds in inventory.</p>
                  <p className="text-xs text-gray-400 mt-1">Search to pick from the full database.</p>
                </div>
              ) : (
                <>
                  <div className="px-3 pt-1 pb-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      My Inventory
                    </span>
                  </div>
                  {inventorySeeds.map((opt) => (
                    <button
                      key={opt.itemId ?? opt.seedId}
                      onClick={() => selectSeed(opt)}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                        activeSeed?.itemId === opt.itemId
                          ? 'bg-garden-50 text-garden-700'
                          : 'text-gray-600 hover:bg-stone-50'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_ACCENT[opt.category] }}
                      />
                      <span className="truncate">{opt.varietyName}</span>
                    </button>
                  ))}
                  <p className="px-3 pt-3 text-[10px] text-gray-400">
                    Search above to pick from the full seed database.
                  </p>
                </>
              )
            )}
          </div>
        </aside>
      </div>

      {/* ── Start plantings modal ── */}
      {showStartPlantings && activePlan && (
        <StartPlantingsModal
          plan={activePlan}
          allSeeds={allSeeds}
          inventory={inventory}
          addPlanting={addPlanting}
          onClose={() => setShowStartPlantings(false)}
        />
      )}

      {/* ── New plan dialog ── */}
      {showNewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNewPlan(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">New Cell Plan</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan name</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Spring 2026 — Flat 1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlan()}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    className="input w-full"
                    value={newCols}
                    onChange={(e) =>
                      setNewCols(Math.max(1, Math.min(32, parseInt(e.target.value) || 1)))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="input w-full"
                    value={newRows}
                    onChange={(e) =>
                      setNewRows(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">{newCols * newRows} cells total</p>

              <div>
                <p className="text-xs text-gray-500 mb-2">Common flat sizes:</p>
                <div className="flex flex-wrap gap-1.5">
                  {FLAT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setNewCols(preset.cols);
                        setNewRows(preset.rows);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        newCols === preset.cols && newRows === preset.rows
                          ? 'border-garden-500 bg-garden-50 text-garden-700'
                          : 'border-stone-200 text-gray-600 hover:border-garden-300 hover:bg-garden-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewPlan(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={!newName.trim()}
                className="btn-primary flex-1"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
