import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useGardenStore } from '../../store/useStore';
import { GardenBed } from '../../types';
import PageHeader from '../../components/common/PageHeader';

const EMPTY_FORM = { name: '', widthFt: '', lengthFt: '', notes: '', indoor: false };

export default function GardenBeds() {
  const { beds, addBed, updateBed, removeBed } = useGardenStore();

  const [addingBed, setAddingBed] = useState(false);
  const [newBed, setNewBed] = useState(EMPTY_FORM);
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const handleAddBed = () => {
    if (!newBed.name.trim()) return;
    addBed({
      name: newBed.name.trim(),
      widthFt: newBed.widthFt ? Number(newBed.widthFt) : undefined,
      lengthFt: newBed.lengthFt ? Number(newBed.lengthFt) : undefined,
      notes: newBed.notes.trim() || undefined,
      indoor: newBed.indoor,
    });
    setNewBed(EMPTY_FORM);
    setAddingBed(false);
  };

  const startEdit = (bed: GardenBed) => {
    setEditingBedId(bed.id);
    setEditForm({
      name: bed.name,
      widthFt: bed.widthFt?.toString() ?? '',
      lengthFt: bed.lengthFt?.toString() ?? '',
      notes: bed.notes ?? '',
      indoor: bed.indoor,
    });
  };

  const handleSaveEdit = () => {
    if (!editingBedId || !editForm.name.trim()) return;
    updateBed(editingBedId, {
      name: editForm.name.trim(),
      widthFt: editForm.widthFt ? Number(editForm.widthFt) : undefined,
      lengthFt: editForm.lengthFt ? Number(editForm.lengthFt) : undefined,
      notes: editForm.notes.trim() || undefined,
      indoor: editForm.indoor,
    });
    setEditingBedId(null);
  };

  return (
    <div>
      <PageHeader
        title="Garden Beds"
        subtitle="Manage your beds and growing areas"
        icon="🪴"
        actions={
          !addingBed ? (
            <button onClick={() => setAddingBed(true)} className="btn-primary">
              <Plus size={16} /> Add Bed
            </button>
          ) : undefined
        }
      />

      <div className="px-4 sm:px-6 py-6 max-w-2xl space-y-3">
        {/* Add bed form */}
        {addingBed && (
          <BedForm
            form={newBed}
            onChange={setNewBed}
            onSave={handleAddBed}
            onCancel={() => { setAddingBed(false); setNewBed(EMPTY_FORM); }}
            saveLabel="Add Bed"
          />
        )}

        {/* Bed list */}
        {beds.map((bed) =>
          editingBedId === bed.id ? (
            <BedForm
              key={bed.id}
              form={editForm}
              onChange={setEditForm}
              onSave={handleSaveEdit}
              onCancel={() => setEditingBedId(null)}
              saveLabel="Save"
            />
          ) : (
            <BedRow
              key={bed.id}
              bed={bed}
              onEdit={() => startEdit(bed)}
              onDelete={() => removeBed(bed.id)}
            />
          )
        )}

        {beds.length === 0 && !addingBed && (
          <div className="card p-10 text-center">
            <p className="text-2xl mb-3">🪴</p>
            <p className="font-medium text-gray-700 mb-1">No beds yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Add your garden beds and growing areas. Once added, you can select them when logging plantings and journal entries.
            </p>
            <button onClick={() => setAddingBed(true)} className="btn-primary">
              <Plus size={16} /> Add Your First Bed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface BedFormProps {
  form: { name: string; widthFt: string; lengthFt: string; notes: string; indoor: boolean };
  onChange: (f: BedFormProps['form']) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}

function BedForm({ form, onChange, onSave, onCancel, saveLabel }: BedFormProps) {
  return (
    <div className="card border-garden-300 bg-garden-50 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Bed Name *</label>
          <input
            type="text"
            className="input"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. Raised Bed A, North Border, Greenhouse Bench"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Width (ft)</label>
          <input
            type="number"
            className="input"
            min={1}
            value={form.widthFt}
            onChange={(e) => onChange({ ...form, widthFt: e.target.value })}
            placeholder="e.g. 4"
          />
        </div>
        <div>
          <label className="label">Length (ft)</label>
          <input
            type="number"
            className="input"
            min={1}
            value={form.lengthFt}
            onChange={(e) => onChange({ ...form, lengthFt: e.target.value })}
            placeholder="e.g. 8"
          />
        </div>
        <div className="col-span-2">
          <label className="label">Notes (optional)</label>
          <input
            type="text"
            className="input"
            value={form.notes}
            onChange={(e) => onChange({ ...form, notes: e.target.value })}
            placeholder="e.g. Full sun, amended with compost, drip irrigation"
          />
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              className="rounded w-4 h-4"
              checked={form.indoor}
              onChange={(e) => onChange({ ...form, indoor: e.target.checked })}
            />
            Indoor / seed-starting area
          </label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="btn-secondary text-sm py-1.5 px-3">
          <X size={14} /> Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!form.name.trim()}
          className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
        >
          <Check size={14} /> {saveLabel}
        </button>
      </div>
    </div>
  );
}

interface BedRowProps {
  bed: GardenBed;
  onEdit: () => void;
  onDelete: () => void;
}

function BedRow({ bed, onEdit, onDelete }: BedRowProps) {
  return (
    <div className="card flex items-center gap-3 px-4 py-3 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">{bed.name}</span>
          {bed.indoor && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Indoor</span>
          )}
          {bed.widthFt && bed.lengthFt && (
            <span className="text-xs text-gray-400">{bed.widthFt} × {bed.lengthFt} ft</span>
          )}
        </div>
        {bed.notes && (
          <p className="text-sm text-gray-500 mt-0.5 truncate">{bed.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-stone-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Edit"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
