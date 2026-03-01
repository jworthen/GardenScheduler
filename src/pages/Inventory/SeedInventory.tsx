import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';
import { useGardenStore } from '../../store/useStore';
import { InventoryItem } from '../../types';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { format } from '../../utils/dateCalculations';

export default function SeedInventory() {
  const { inventory, addInventoryItem, updateInventoryItem, removeInventoryItem, getAllSeeds } = useGardenStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const allSeeds = getAllSeeds();

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      if (search && !item.varietyName.toLowerCase().includes(search.toLowerCase()) &&
          !item.brand?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return true;
    });
  }, [inventory, search, statusFilter]);

  const stats = {
    total: inventory.length,
    available: inventory.filter((i) => i.status === 'available').length,
    low: inventory.filter((i) => i.status === 'low').length,
    empty: inventory.filter((i) => i.status === 'empty').length,
  };

  return (
    <div>
      <PageHeader
        title="Seed Inventory"
        subtitle="Track your seed collection"
        icon="📦"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            <Plus size={16} /> Add Seeds
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'bg-stone-100 text-gray-700' },
            { label: 'Available', value: stats.available, color: 'bg-green-100 text-green-700' },
            { label: 'Running Low', value: stats.low, color: 'bg-amber-100 text-amber-700' },
            { label: 'Empty', value: stats.empty, color: 'bg-red-100 text-red-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={clsx('rounded-xl p-3 text-center', color)}>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Search and filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search varieties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="low">Low</option>
            <option value="empty">Empty</option>
          </select>
        </div>

        {/* Inventory list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="mx-auto mb-3 opacity-30" size={40} />
            <p className="text-lg font-medium">
              {inventory.length === 0 ? 'No seeds in inventory' : 'No matches found'}
            </p>
            <p className="text-sm mt-1">
              {inventory.length === 0
                ? 'Add seeds to track your collection'
                : 'Try adjusting your search'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                onEdit={setEditItem}
                onRemove={() => {
                  if (window.confirm(`Remove "${item.varietyName}" from inventory?`)) {
                    removeInventoryItem(item.id);
                  }
                }}
                onStatusChange={(status) => updateInventoryItem(item.id, { status })}
              />
            ))}
          </div>
        )}
      </div>

      <InventoryFormModal
        isOpen={showAdd}
        item={null}
        onClose={() => setShowAdd(false)}
        onSave={(data) => {
          addInventoryItem(data);
          setShowAdd(false);
        }}
        seeds={allSeeds}
      />

      <InventoryFormModal
        isOpen={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={(data) => {
          if (editItem) {
            updateInventoryItem(editItem.id, data);
            setEditItem(null);
          }
        }}
        seeds={allSeeds}
      />
    </div>
  );
}

interface InventoryCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onRemove: () => void;
  onStatusChange: (status: InventoryItem['status']) => void;
}

function InventoryCard({ item, onEdit, onRemove, onStatusChange }: InventoryCardProps) {
  const statusColors = {
    available: 'bg-green-100 text-green-700 border-green-200',
    low: 'bg-amber-100 text-amber-700 border-amber-200',
    empty: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{item.varietyName}</h3>
            <span className={clsx('badge border text-xs', statusColors[item.status])}>
              {item.status === 'available' ? '✓ Available' : item.status === 'low' ? '⚠ Low' : '✕ Empty'}
            </span>
            {item.openPollinated && (
              <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs">OP</span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
            {item.brand && <span>{item.brand}</span>}
            {item.source && <span>from {item.source}</span>}
            {item.yearPurchased && <span>{item.yearPurchased}</span>}
            <span>{item.quantityAmount} {item.quantityUnit}</span>
            {item.storageLocation && <span>📍 {item.storageLocation}</span>}
            {item.germinationRate && <span>🌱 {item.germinationRate}% germ rate</span>}
          </div>
          {item.notes && (
            <p className="text-xs text-gray-400 mt-1.5 truncate">{item.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-stone-100 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Quick status change */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
        {(['available', 'low', 'empty'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={clsx(
              'text-xs px-2 py-1 rounded-lg border transition-colors',
              item.status === s
                ? statusColors[s]
                : 'bg-stone-50 text-gray-500 border-stone-200 hover:bg-stone-100'
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

interface InventoryFormModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  seeds: ReturnType<ReturnType<typeof useGardenStore>['getAllSeeds']>;
}

function InventoryFormModal({ isOpen, item, onClose, onSave, seeds }: InventoryFormModalProps) {
  const [form, setForm] = useState({
    seedId: item?.seedId || '',
    varietyName: item?.varietyName || '',
    brand: item?.brand || '',
    source: item?.source || '',
    yearPurchased: item?.yearPurchased?.toString() || new Date().getFullYear().toString(),
    quantityAmount: item?.quantityAmount?.toString() || '1',
    quantityUnit: item?.quantityUnit || 'packet' as InventoryItem['quantityUnit'],
    storageLocation: item?.storageLocation || '',
    germinationRate: item?.germinationRate?.toString() || '',
    notes: item?.notes || '',
    status: item?.status || 'available' as InventoryItem['status'],
    openPollinated: item?.openPollinated || false,
    seedSavingNotes: item?.seedSavingNotes || '',
  });

  const set = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSeedSelect = (seedId: string) => {
    set('seedId', seedId);
    if (seedId) {
      const seed = seeds.find((s) => s.id === seedId);
      if (seed) {
        set('varietyName', seed.commonName);
        set('openPollinated', seed.openPollinated || false);
      }
    }
  };

  const handleSave = () => {
    if (!form.varietyName.trim()) return;
    onSave({
      seedId: form.seedId || undefined,
      varietyName: form.varietyName,
      brand: form.brand || undefined,
      source: form.source || undefined,
      yearPurchased: form.yearPurchased ? Number(form.yearPurchased) : undefined,
      quantityAmount: Number(form.quantityAmount) || 1,
      quantityUnit: form.quantityUnit,
      storageLocation: form.storageLocation || undefined,
      germinationRate: form.germinationRate ? Number(form.germinationRate) : undefined,
      notes: form.notes || undefined,
      status: form.status,
      openPollinated: form.openPollinated || undefined,
      seedSavingNotes: form.seedSavingNotes || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Seed' : 'Add Seeds to Inventory'}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={!form.varietyName.trim()} className="btn-primary disabled:opacity-50">
            {item ? 'Save Changes' : 'Add to Inventory'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Link to Seed Database (optional)</label>
          <select className="input" value={form.seedId} onChange={(e) => handleSeedSelect(e.target.value)}>
            <option value="">Not linked</option>
            {seeds.map((s) => <option key={s.id} value={s.id}>{s.commonName}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Variety Name *</label>
          <input
            type="text"
            className="input"
            value={form.varietyName}
            onChange={(e) => set('varietyName', e.target.value)}
            placeholder="e.g. Sungold Tomato"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Brand</label>
            <input type="text" className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="e.g. Baker Creek" />
          </div>
          <div>
            <label className="label">Source</label>
            <input type="text" className="input" value={form.source} onChange={(e) => set('source', e.target.value)} placeholder="e.g. Local nursery" />
          </div>
          <div>
            <label className="label">Year Purchased</label>
            <input type="number" className="input" value={form.yearPurchased} onChange={(e) => set('yearPurchased', e.target.value)} />
          </div>
          <div>
            <label className="label">Quantity</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="input flex-1"
                value={form.quantityAmount}
                onChange={(e) => set('quantityAmount', e.target.value)}
                min="0"
                step="0.1"
              />
              <select className="input w-28" value={form.quantityUnit} onChange={(e) => set('quantityUnit', e.target.value)}>
                <option value="packet">Packets</option>
                <option value="seeds">Seeds</option>
                <option value="grams">Grams</option>
                <option value="ounces">Ounces</option>
                <option value="bulbs">Bulbs</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Storage Location</label>
            <input type="text" className="input" value={form.storageLocation} onChange={(e) => set('storageLocation', e.target.value)} placeholder="e.g. Fridge, shed" />
          </div>
          <div>
            <label className="label">Germination Rate (%)</label>
            <input type="number" className="input" value={form.germinationRate} onChange={(e) => set('germinationRate', e.target.value)} placeholder="e.g. 85" min="0" max="100" />
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <div className="flex gap-2">
            {(['available', 'low', 'empty'] as const).map((s) => (
              <label key={s} className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all',
                form.status === s ? 'border-garden-500 bg-garden-50 text-garden-700' : 'border-stone-200 text-gray-600'
              )}>
                <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => set('status', s)} className="hidden" />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.openPollinated} onChange={(e) => set('openPollinated', e.target.checked)} className="rounded" />
            Open Pollinated / Heirloom (seed saving possible)
          </label>
        </div>
        {form.openPollinated && (
          <div>
            <label className="label">Seed Saving Notes</label>
            <textarea className="input resize-none" rows={2} value={form.seedSavingNotes} onChange={(e) => set('seedSavingNotes', e.target.value)} placeholder="How to save seeds from this variety..." />
          </div>
        )}
        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any notes about these seeds..." />
        </div>
      </div>
    </Modal>
  );
}
