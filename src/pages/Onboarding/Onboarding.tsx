import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Leaf, MapPin, Sprout, Calendar, Check } from 'lucide-react';
import clsx from 'clsx';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useGardenStore } from '../../store/useStore';
import { lookupFrostDatesByZip, lookupFrostDatesByState, US_STATES, zoneData } from '../../data/frostDates';
import { seeds } from '../../data/seeds';
import { getCategoryBgLight, getCategoryTextColor, getCategoryLabel } from '../../data/seeds';

const STEPS = ['welcome', 'location', 'crops', 'complete'] as const;
type Step = typeof STEPS[number];

const POPULAR_CROPS = [
  { id: 'tomato-cherry', emoji: '🍅' },
  { id: 'tomato-beefsteak', emoji: '🍅' },
  { id: 'bell-pepper', emoji: '🫑' },
  { id: 'cucumber', emoji: '🥒' },
  { id: 'zucchini', emoji: '🥬' },
  { id: 'green-beans', emoji: '🫘' },
  { id: 'peas', emoji: '🌱' },
  { id: 'lettuce', emoji: '🥗' },
  { id: 'kale', emoji: '🥬' },
  { id: 'basil', emoji: '🌿' },
  { id: 'zinnia', emoji: '🌸' },
  { id: 'sunflower', emoji: '🌻' },
  { id: 'cosmos', emoji: '💐' },
  { id: 'marigold', emoji: '🌼' },
  { id: 'winter-squash', emoji: '🎃' },
  { id: 'dahlia', emoji: '🌺' },
].map((crop) => {
  const seed = seeds.find((s) => s.id === crop.id);
  return seed ? { ...crop, seed } : null;
}).filter(Boolean) as Array<{ id: string; emoji: string; seed: (typeof seeds)[0] }>;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setLocation, completeOnboarding, addPlanting, getAllSeeds } = useGardenStore();

  const [step, setStep] = useState<Step>('welcome');
  const [zipCode, setZipCode] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [lastFrost, setLastFrost] = useState('05-01');
  const [firstFrost, setFirstFrost] = useState('10-01');
  const [zone, setZone] = useState<number>(5);
  const [locationName, setLocationName] = useState('');
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState<Set<string>>(new Set());

  const currentStepIndex = STEPS.indexOf(step);

  const handleZipLookup = () => {
    if (zipCode.length >= 5) {
      const result = lookupFrostDatesByZip(zipCode);
      if (result) {
        setLastFrost(result.lastSpringFrost);
        setFirstFrost(result.firstFallFrost);
        setZone(result.zone);
        if (result.city && result.state) {
          setLocationName(`${result.city}, ${result.state}`);
        }
      }
      setLookupAttempted(true);
    }
  };

  const handleStateLookup = (stateCode: string) => {
    setSelectedState(stateCode);
    if (stateCode) {
      const result = lookupFrostDatesByState(stateCode);
      if (result) {
        setLastFrost(result.lastSpringFrost);
        setFirstFrost(result.firstFallFrost);
        setZone(result.zone);
        if (result.state) {
          setLocationName(result.state);
        }
      }
    }
  };

  const handleLocationNext = () => {
    setLocation({
      zipCode: zipCode || undefined,
      state: selectedState || undefined,
      city: locationName || undefined,
      zone,
      lastSpringFrost: lastFrost,
      firstFallFrost: firstFrost,
    });
    setStep('crops');
  };

  const toggleCrop = (id: string) => {
    setSelectedCrops((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleFinish = () => {
    const allSeeds = getAllSeeds();
    selectedCrops.forEach((seedId) => {
      const seed = allSeeds.find((s) => s.id === seedId);
      if (seed) {
        addPlanting(seedId, seed);
      }
    });
    completeOnboarding();
    localStorage.setItem('onboardingCompleted', 'true');

    // Write immediately — don't rely on the debounced sync so a quick
    // page refresh can't race past the save.
    if (user) {
      const { settings, plantings, tasks, inventory, journalEntries, customPlants } =
        useGardenStore.getState();
      setDoc(doc(db, 'users', user.uid, 'data', 'gardenData'), {
        settings,
        plantings,
        tasks,
        inventory,
        journalEntries,
        customPlants,
      });
    }

    navigate('/');
  };

  const formatDateDisplay = (mmdd: string) => {
    const [m, d] = mmdd.split('-').map(Number);
    const date = new Date(2024, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-50 via-white to-harvest-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        {step !== 'welcome' && (
          <div className="flex items-center gap-2 mb-6">
            {STEPS.slice(1).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                    STEPS.indexOf(s) <= currentStepIndex
                      ? 'bg-garden-600 text-white'
                      : 'bg-stone-200 text-gray-400'
                  )}
                >
                  {STEPS.indexOf(s) < currentStepIndex ? <Check size={16} /> : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={clsx(
                      'flex-1 h-0.5 min-w-[3rem]',
                      STEPS.indexOf(s) < currentStepIndex ? 'bg-garden-600' : 'bg-stone-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center animate-fade-in">
            <div className="w-20 h-20 bg-garden-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Leaf className="w-10 h-10 text-garden-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to GardenScheduler</h1>
            <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
              Plan your perfect garden with personalized planting calendars, seed tracking, and task lists.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: '🌱', title: '160+ Plants', desc: 'Vegetables, herbs, and flowers' },
                { icon: '📅', title: 'Smart Calendar', desc: 'Auto-calculated planting dates' },
                { icon: '✅', title: 'Task Lists', desc: 'Never miss a planting step' },
              ].map((feature) => (
                <div key={feature.title} className="text-center p-4 bg-stone-50 rounded-2xl">
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <div className="font-semibold text-sm text-gray-900">{feature.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{feature.desc}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep('location')}
              className="btn-primary text-base py-3 px-8 mx-auto"
            >
              Get Started <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Location Step */}
        {step === 'location' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="text-garden-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Your Location</h2>
            </div>
            <p className="text-gray-500 mb-6">
              We use your location to calculate frost dates and customize your planting calendar.
            </p>

            <div className="space-y-5">
              {/* ZIP Code */}
              <div>
                <label className="label">ZIP Code (US)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="e.g. 80204"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    maxLength={5}
                  />
                  <button
                    onClick={handleZipLookup}
                    disabled={zipCode.length < 5}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Look Up
                  </button>
                </div>
                {lookupAttempted && locationName && (
                  <p className="text-sm text-garden-600 mt-1.5 font-medium">
                    ✓ Found: {locationName} — Zone {zone}
                  </p>
                )}
              </div>

              <div className="text-center text-gray-400 text-sm">— or select your state —</div>

              {/* State Selector */}
              <div>
                <label className="label">State</label>
                <select
                  className="input"
                  value={selectedState}
                  onChange={(e) => handleStateLookup(e.target.value)}
                >
                  <option value="">Select a state...</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frost Date Overrides */}
              <div className="p-4 bg-stone-50 rounded-2xl">
                <h3 className="font-semibold text-gray-900 mb-3">Frost Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Last Spring Frost</label>
                    <input
                      type="date"
                      className="input"
                      value={`2024-${lastFrost}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('-');
                        if (parts.length === 3) {
                          setLastFrost(`${parts[1]}-${parts[2]}`);
                        }
                      }}
                    />
                    <p className="text-xs text-gray-400 mt-1">{formatDateDisplay(lastFrost)}</p>
                  </div>
                  <div>
                    <label className="label">First Fall Frost</label>
                    <input
                      type="date"
                      className="input"
                      value={`2024-${firstFrost}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('-');
                        if (parts.length === 3) {
                          setFirstFrost(`${parts[1]}-${parts[2]}`);
                        }
                      }}
                    />
                    <p className="text-xs text-gray-400 mt-1">{formatDateDisplay(firstFrost)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="label">USDA Hardiness Zone</label>
                  <select
                    className="input"
                    value={zone}
                    onChange={(e) => {
                      const z = Number(e.target.value);
                      setZone(z);
                      const zoneInfo = zoneData[z];
                      if (zoneInfo) {
                        setLastFrost(zoneInfo.lastSpringFrost);
                        setFirstFrost(zoneInfo.firstFallFrost);
                      }
                    }}
                  >
                    {Object.entries(zoneData).map(([z, info]) => (
                      <option key={z} value={z}>
                        Zone {z} — {info.description.split(':')[1]?.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep('welcome')} className="btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={handleLocationNext} className="btn-primary">
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Crops Step */}
        {step === 'crops' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <Sprout className="text-garden-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Pick Your Plants</h2>
            </div>
            <p className="text-gray-500 mb-6">
              Select plants to add to your calendar. You can add more anytime.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
              {POPULAR_CROPS.map(({ id, emoji, seed }) => (
                <button
                  key={id}
                  onClick={() => toggleCrop(id)}
                  className={clsx(
                    'flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all text-sm',
                    selectedCrops.has(id)
                      ? 'border-garden-500 bg-garden-50'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  )}
                >
                  <span className="text-xl flex-shrink-0">{emoji}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate text-xs leading-tight">
                      {seed.commonName}
                    </div>
                    <div
                      className={clsx(
                        'text-xs mt-0.5',
                        getCategoryTextColor(seed.category)
                      )}
                    >
                      {getCategoryLabel(seed.category)}
                    </div>
                  </div>
                  {selectedCrops.has(id) && (
                    <Check className="text-garden-600 ml-auto flex-shrink-0" size={14} />
                  )}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-400 mt-3">
              {selectedCrops.size} plant{selectedCrops.size !== 1 ? 's' : ''} selected
            </p>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep('location')} className="btn-secondary">
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={() => setStep('complete')} className="btn-primary">
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center animate-fade-in">
            <div className="w-20 h-20 bg-garden-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-garden-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">You're All Set! 🎉</h2>
            <p className="text-gray-500 mb-2">
              Your garden is ready with {selectedCrops.size} plant{selectedCrops.size !== 1 ? 's' : ''} scheduled.
            </p>
            <p className="text-gray-500 mb-8">
              We've calculated all your planting dates based on your frost dates.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8 text-left">
              {[
                { icon: '📅', label: 'View your calendar', desc: 'See all planting milestones' },
                { icon: '✅', label: 'Check your tasks', desc: 'Today\'s to-dos are ready' },
                { icon: '🌱', label: 'Browse seed database', desc: 'Add more plants anytime' },
                { icon: '📝', label: 'Start journaling', desc: 'Track your garden progress' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleFinish} className="btn-primary text-base py-3 px-8 mx-auto">
              Open My Garden <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
