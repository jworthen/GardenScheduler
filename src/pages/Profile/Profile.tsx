import { useState } from 'react';
import { User, Leaf, MapPin } from 'lucide-react';
import { useGardenStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { lookupFrostDatesByZip, zoneData } from '../../data/frostDates';
import PageHeader from '../../components/common/PageHeader';

export default function Profile() {
  const { user } = useAuth();
  const { settings, updateSettings, setLocation } = useGardenStore();
  const [gardenName, setGardenName] = useState(settings.profile?.gardenName ?? '');
  const [units, setUnits] = useState<'imperial' | 'metric'>(settings.profile?.units ?? 'imperial');
  const [zipInput, setZipInput] = useState(settings.location.zipCode || '');
  const [saved, setSaved] = useState(false);

  const { location } = settings;

  const save = () => {
    updateSettings({ profile: { gardenName, units } });
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

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account and garden profile" icon="👤" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-2xl">
        {saved && (
          <div className="bg-garden-50 border border-garden-200 text-garden-700 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
            ✓ Saved!
          </div>
        )}

        {/* Account */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="text-garden-600" size={18} />
            <h2 className="font-bold text-gray-900">Account</h2>
          </div>
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-garden-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg font-semibold">{initials}</span>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{user?.displayName ?? 'User'}</p>
              <p className="text-sm text-gray-500">{user?.email ?? ''}</p>
              <p className="text-xs text-gray-400 mt-1">Signed in with Google</p>
            </div>
          </div>
        </section>

        {/* Garden Profile */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="text-garden-600" size={18} />
            <h2 className="font-bold text-gray-900">Garden Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Garden Name</label>
              <input
                type="text"
                className="input"
                value={gardenName}
                onChange={(e) => setGardenName(e.target.value)}
                placeholder="e.g. Backyard Veggie Garden"
              />
            </div>

            <div>
              <label className="label">Units</label>
              <div className="flex gap-2">
                {(['imperial', 'metric'] as const).map((u) => (
                  <label
                    key={u}
                    className={`flex-1 flex items-center justify-center py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${
                      units === u
                        ? 'border-garden-500 bg-garden-50 text-garden-700'
                        : 'border-stone-200 text-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="units"
                      value={u}
                      checked={units === u}
                      onChange={() => setUnits(u)}
                      className="hidden"
                    />
                    {u.charAt(0).toUpperCase() + u.slice(1)}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {units === 'imperial' ? 'Inches, feet, °F' : 'Centimeters, meters, °C'}
              </p>
            </div>

            <button onClick={save} className="btn-primary text-sm">
              Save Profile
            </button>
          </div>
        </section>

        {/* Location */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-garden-600" size={18} />
            <h2 className="font-bold text-gray-900">Location</h2>
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
                <button
                  onClick={handleZipLookup}
                  disabled={zipInput.length < 5}
                  className="btn-primary disabled:opacity-50 text-sm"
                >
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
                  <option key={z} value={z}>
                    Zone {z} — {info.description.split(':')[1]?.trim()}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Full frost date details are in{' '}
                <a href="/settings" className="text-garden-600 hover:underline">Settings</a>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
