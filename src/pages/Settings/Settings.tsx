import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, MapPin, Bell, Palette, Download, Trash2, AlertTriangle, User, ChevronRight } from 'lucide-react';
import { useGardenStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { lookupFrostDatesByZip, zoneData } from '../../data/frostDates';
import PageHeader from '../../components/common/PageHeader';

export default function Settings() {
  const { user } = useAuth();
  const { settings, updateSettings, setLocation } = useGardenStore();
  const [saved, setSaved] = useState(false);
  const [zipInput, setZipInput] = useState(settings.location.zipCode || '');

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
