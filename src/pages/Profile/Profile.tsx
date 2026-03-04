import { useState } from 'react';
import { User, Leaf } from 'lucide-react';
import { useGardenStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/common/PageHeader';

export default function Profile() {
  const { user } = useAuth();
  const { settings, updateSettings } = useGardenStore();
  const [gardenName, setGardenName] = useState(settings.profile?.gardenName ?? '');
  const [units, setUnits] = useState<'imperial' | 'metric'>(settings.profile?.units ?? 'imperial');
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateSettings({ profile: { gardenName, units } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
            ✓ Profile saved!
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
      </div>
    </div>
  );
}
