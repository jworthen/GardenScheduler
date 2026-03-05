import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, MapPin, Bell, Palette, Download, Trash2, AlertTriangle, User, ChevronRight, Rows3, Plus, Pencil, Check, X } from 'lucide-react';
import { useGardenStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { lookupFrostDatesByZip, zoneData } from '../../data/frostDates';
import PageHeader from '../../components/common/PageHeader';
import { GardenBed } from '../../types';

const EMPTY_BED_FORM = { name: '', widthFt: '', lengthFt: '', notes: '', indoor: false };

export default function Settings() {
  const { user } = useAuth();
  const { settings, updateSettings, setLocation, beds, addBed, updateBed, removeBed } = useGardenStore();
  const [saved, setSaved] = useState(false);
  const [zipInput, setZipInput] = useState(settings.location.zipCode || '');

  // Bed manager state
  const [addingBed, setAddingBed] = useState(false);
  const [newBed, setNewBed] = useState(EMPTY_BED_FORM);
  const [editingBedId, setEditingBedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_BED_FORM);

  const { location, preferences } = settings;

  const save = (updates: Partial<typeof settings>) => {
    updateSettings(updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleZipLookup = () => {
    if (zipInput.length >= 5) {
      const result = lookupFrostDatesByZip(zipInput);
      if (result) {
        setLocation({
          zipCode: zipInput,
          zone: result.zone,
          lastSpringFrost: result.lastSpringFrost,
          firstFallFrost: result.firstFallFrost,
          city: result.city,
          state: result.state,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    }
  };

  const formatFrostDate = (mmdd: string) => {
    const [m, d] = mmdd.split('-').map(Number);
    return new Date(2024, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const handleAddBed = () => {
    if (!newBed.name.trim()) return;
    addBed({
      name: newBed.name.trim(),
      widthFt: newBed.widthFt ? Number(newBed.widthFt) : undefined,
      lengthFt: newBed.lengthFt ? Number(newBed.lengthFt) : undefined,
      notes: newBed.notes.trim() || undefined,
      indoor: newBed.indoor,
    });
    setNewBed(EMPTY_BED_FORM);
    setAddingBed(false);
  };

  const startEditBed = (bed: GardenBed) => {
    setEditingBedId(bed.id);
    setEditForm({
      name: bed.name,
      widthFt: bed.widthFt?.toString() ?? '',
      lengthFt: bed.lengthFt?.toString() ?? '',
      notes: bed.notes ?? '',
      indoor: bed.indoor,
    });
  };

  const handleSaveEditBed = () => {
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

  const handleExport = () => {
    const store = useGardenStore.getState();
    const data = {
      settings: store.settings,
      plantings: store.plantings,
      tasks: store.tasks,
      inventory: store.inventory,
      journalEntries: store.journalEntries,
      customPlants: store.customPlants,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `last-frost-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your garden settings" icon="⚙️" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-2xl">
        {saved && (
          <div className="bg-garden-50 border border-garden-200 text-garden-700 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
            ✓ Settings saved!
          </div>
        )}

        {/* Account */}
        <Link to="/profile" className="card p-4 flex items-center gap-3 hover:bg-stone-50 transition-colors">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-garden-100 text-garden-600 flex-shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{user?.displayName ?? 'User'}</p>
            <p className="text-xs text-gray-500">{settings.profile?.gardenName || 'No garden name set'}</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        </Link>

        {/* Location */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-garden-600" size={18} />
            <h2 className="font-bold text-gray-900">Location & Frost Dates</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">ZIP Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="Enter ZIP code"
                />
                <button onClick={handleZipLookup} disabled={zipInput.length < 5} className="btn-primary disabled:opacity-50 text-sm">
                  Look Up
                </button>
              </div>
              {location.city && location.state && (
                <p className="text-xs text-garden-600 mt-1">
                  📍 {location.city}, {location.state}
                </p>
              )}
            </div>

            <div>
              <label className="label">USDA Hardiness Zone</label>
              <select
                className="input"
                value={location.zone || 5}
                onChange={(e) => {
                  const z = Number(e.target.value);
                  const zoneInfo = zoneData[z];
                  setLocation({ zone: z, lastSpringFrost: zoneInfo.lastSpringFrost, firstFallFrost: zoneInfo.firstFallFrost });
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                }}
              >
                {Object.entries(zoneData).map(([z, info]) => (
                  <option key={z} value={z}>Zone {z} — {info.description.split(':')[1]?.trim()}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Last Spring Frost</label>
                <input
                  type="date"
                  className="input"
                  value={`2024-${location.lastSpringFrost}`}
                  onChange={(e) => {
                    const parts = e.target.value.split('-');
                    if (parts.length === 3) {
                      setLocation({ lastSpringFrost: `${parts[1]}-${parts[2]}` });
                    }
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">{formatFrostDate(location.lastSpringFrost)}</p>
              </div>
              <div>
                <label className="label">First Fall Frost</label>
                <input
                  type="date"
                  className="input"
                  value={`2024-${location.firstFallFrost}`}
                  onChange={(e) => {
                    const parts = e.target.value.split('-');
                    if (parts.length === 3) {
                      setLocation({ firstFallFrost: `${parts[1]}-${parts[2]}` });
                    }
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">{formatFrostDate(location.firstFallFrost)}</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-700">
                <strong>Tip:</strong> Override frost dates to account for your microclimate. South-facing slopes, urban heat islands, or low-lying frost pockets can shift dates by 1-2 weeks.
              </p>
            </div>

            <button
              onClick={() => save({ location })}
              className="btn-primary text-sm"
            >
              Save Frost Dates
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="text-garden-600" size={18} />
            <h2 className="font-bold text-gray-900">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Default Calendar View</label>
              <div className="flex gap-2">
                {(['monthly', 'timeline'] as const).map((v) => (
                  <label key={v} className={`flex-1 flex items-center justify-center py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${
                    preferences.defaultCalendarView === v ? 'border-garden-500 bg-garden-50 text-garden-700' : 'border-stone-200 text-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="calView"
                      value={v}
                      checked={preferences.defaultCalendarView === v}
                      onChange={() => save({ preferences: { ...preferences, defaultCalendarView: v } })}
                      className="hidden"
                    />
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.showCompletedTasks}
                onChange={(e) => save({ preferences: { ...preferences, showCompletedTasks: e.target.checked } })}
                className="rounded w-4 h-4"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Show completed tasks by default</span>
                <p className="text-xs text-gray-500">Display completed tasks in the task list</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.colorByCategory}
                onChange={(e) => save({ preferences: { ...preferences, colorByCategory: e.target.checked } })}
                className="rounded w-4 h-4"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Color code by plant category</span>
                <p className="text-xs text-gray-500">Use different colors for vegetables, flowers, herbs, etc.</p>
              </div>
            </label>
          </div>
        </section>

        {/* Garden Beds */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Rows3 className="text-garden-600" size={18} />
              <h2 className="font-bold text-gray-900">Garden Beds</h2>
            </div>
            {!addingBed && (
              <button
                onClick={() => setAddingBed(true)}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                <Plus size={14} /> Add Bed
              </button>
            )}
          </div>

          <div className="space-y-2">
            {beds.map((bed) =>
              editingBedId === bed.id ? (
                /* Edit form */
                <div key={bed.id} className="border border-garden-300 rounded-xl p-3 space-y-3 bg-garden-50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="label">Bed Name *</label>
                      <input
                        type="text"
                        className="input"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="label">Width (ft)</label>
                      <input
                        type="number"
                        className="input"
                        min={1}
                        value={editForm.widthFt}
                        onChange={(e) => setEditForm((f) => ({ ...f, widthFt: e.target.value }))}
                        placeholder="e.g. 4"
                      />
                    </div>
                    <div>
                      <label className="label">Length (ft)</label>
                      <input
                        type="number"
                        className="input"
                        min={1}
                        value={editForm.lengthFt}
                        onChange={(e) => setEditForm((f) => ({ ...f, lengthFt: e.target.value }))}
                        placeholder="e.g. 8"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Notes (optional)</label>
                      <input
                        type="text"
                        className="input"
                        value={editForm.notes}
                        onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="e.g. Full sun, amended with compost"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          className="rounded w-4 h-4"
                          checked={editForm.indoor}
                          onChange={(e) => setEditForm((f) => ({ ...f, indoor: e.target.checked }))}
                        />
                        Indoor / seed-starting area
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingBedId(null)} className="btn-secondary text-sm py-1.5 px-3">
                      <X size={14} /> Cancel
                    </button>
                    <button onClick={handleSaveEditBed} disabled={!editForm.name.trim()} className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50">
                      <Check size={14} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                /* Bed row */
                <div key={bed.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-stone-200 bg-white group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{bed.name}</span>
                      {bed.indoor && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Indoor</span>
                      )}
                      {bed.widthFt && bed.lengthFt && (
                        <span className="text-xs text-gray-400">{bed.widthFt}×{bed.lengthFt} ft</span>
                      )}
                    </div>
                    {bed.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{bed.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => startEditBed(bed)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit bed"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => removeBed(bed.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete bed"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            )}

            {beds.length === 0 && !addingBed && (
              <p className="text-sm text-gray-400 text-center py-4">
                No beds yet. Add your garden beds to use them when planning plantings.
              </p>
            )}
          </div>

          {/* Add bed form */}
          {addingBed && (
            <div className="border border-garden-300 rounded-xl p-3 space-y-3 bg-garden-50 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Bed Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={newBed.name}
                    onChange={(e) => setNewBed((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Raised Bed A, North Border"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Width (ft)</label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    value={newBed.widthFt}
                    onChange={(e) => setNewBed((f) => ({ ...f, widthFt: e.target.value }))}
                    placeholder="e.g. 4"
                  />
                </div>
                <div>
                  <label className="label">Length (ft)</label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    value={newBed.lengthFt}
                    onChange={(e) => setNewBed((f) => ({ ...f, lengthFt: e.target.value }))}
                    placeholder="e.g. 8"
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Notes (optional)</label>
                  <input
                    type="text"
                    className="input"
                    value={newBed.notes}
                    onChange={(e) => setNewBed((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Full sun, amended with compost"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      className="rounded w-4 h-4"
                      checked={newBed.indoor}
                      onChange={(e) => setNewBed((f) => ({ ...f, indoor: e.target.checked }))}
                    />
                    Indoor / seed-starting area
                  </label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setAddingBed(false); setNewBed(EMPTY_BED_FORM); }}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={handleAddBed}
                  disabled={!newBed.name.trim()}
                  className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
                >
                  <Plus size={14} /> Add Bed
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Data Management */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Download className="text-garden-600" size={18} />
            <h2 className="font-bold text-gray-900">Data & Backup</h2>
          </div>

          <div className="space-y-3">
            <button onClick={handleExport} className="btn-secondary w-full justify-center text-sm">
              <Download size={16} /> Export All Data (JSON)
            </button>
            <p className="text-xs text-gray-400 text-center">
              Your data is saved locally in your browser. Export regularly to keep a backup.
            </p>
          </div>
        </section>

        {/* About */}
        <section className="card p-5">
          <h2 className="font-bold text-gray-900 mb-2">About Last Frost</h2>
          <p className="text-sm text-gray-500">
            A comprehensive seed starting and garden planning application with 160+ plant varieties, smart planting calendars, task management, seed inventory tracking, and garden journaling.
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Version 1.0.0 · Data stored locally in your browser
          </p>
        </section>
      </div>
    </div>
  );
}
