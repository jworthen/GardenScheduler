import { useState, useEffect, useCallback } from 'react';
import { User, Leaf, MapPin, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { useGardenStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { useGardenContext } from '../../contexts/GardenContext';
import { lookupFrostDatesByZip, zoneData } from '../../data/frostDates';
import PageHeader from '../../components/common/PageHeader';
import {
  generateShareToken,
  updateSharePage,
  getReservationsForOwner,
  updateReservationStatus,
} from '../../lib/plantShare';
import { ShareReservation } from '../../types';

export default function Profile() {
  const { user } = useAuth();
  const { settings, updateSettings, setLocation, plantings } = useGardenStore();
  const { activeGardenId, renameGarden } = useGardenContext();
  const [gardenName, setGardenName] = useState(settings.profile?.gardenName ?? '');
  const [units, setUnits] = useState<'imperial' | 'metric'>(settings.profile?.units ?? 'imperial');
  const [zipInput, setZipInput] = useState(settings.location.zipCode || '');
  const [saved, setSaved] = useState(false);

  // Share link state
  const storedToken = settings.profile?.shareToken ?? null;
  const [shareToken, setShareToken] = useState<string | null>(
    storedToken && /^[a-z2-9]{12}$/.test(storedToken) ? storedToken : null,
  );
  const [copied, setCopied] = useState(false);

  // Reservations
  const [reservations, setReservations] = useState<ShareReservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : null;
  const shareablePlantings = plantings.filter((p) => (p.availableToShare ?? 0) > 0);

  const loadReservations = useCallback(async () => {
    if (!user) return;
    setReservationsLoading(true);
    try {
      const data = await getReservationsForOwner(user.uid);
      setReservations(data);
    } finally {
      setReservationsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (shareablePlantings.length > 0) {
      loadReservations();
    }
  }, [shareablePlantings.length, loadReservations]);

  // Sync share page to Firestore whenever we have a token + shareable plantings.
  // This covers the case where the token was generated locally but the Firestore
  // doc was never written (e.g. after a token regeneration or first load).
  useEffect(() => {
    if (!user || !shareToken || shareablePlantings.length === 0) return;
    const shareable = shareablePlantings.map((p) => ({
      plantingId: p.id,
      seedName: p.seedName,
      ...(p.varietyName && { varietyName: p.varietyName }),
      category: p.category,
      color: p.color,
      availableToShare: p.availableToShare!,
      reservedCount: 0,
      ...(p.transplantDate && { transplantDate: p.transplantDate }),
      ...(p.firstBloomDate && { firstBloomDate: p.firstBloomDate }),
      ...(p.firstHarvestDate && { firstHarvestDate: p.firstHarvestDate }),
    }));
    updateSharePage(shareToken, user.uid, settings.profile?.gardenName ?? 'My Garden', shareable, user.displayName ?? undefined);
  }, [shareToken, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGetShareLink = async () => {
    if (!user) return;
    const token = generateShareToken();
    setShareToken(token);
    updateSettings({ profile: { ...settings.profile, shareToken: token } });
    const shareable = shareablePlantings.map((p) => ({
      plantingId: p.id,
      seedName: p.seedName,
      ...(p.varietyName && { varietyName: p.varietyName }),
      category: p.category,
      color: p.color,
      availableToShare: p.availableToShare!,
      reservedCount: 0,
      ...(p.transplantDate && { transplantDate: p.transplantDate }),
      ...(p.firstBloomDate && { firstBloomDate: p.firstBloomDate }),
      ...(p.firstHarvestDate && { firstHarvestDate: p.firstHarvestDate }),
    }));
    await updateSharePage(token, user.uid, settings.profile?.gardenName ?? 'My Garden', shareable, user.displayName ?? undefined);
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReservationStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    await updateReservationStatus(id, status);
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, updatedAt: Date.now() } : r)),
    );
  };

  const { location } = settings;

  const save = () => {
    updateSettings({ profile: { gardenName, units } });
    // Keep the gardens index name in sync
    if (activeGardenId) renameGarden(activeGardenId, gardenName);
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

        {/* Plant Share */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="text-garden-600" size={18} />
            <h2 className="font-bold text-gray-900">Plant Share</h2>
          </div>

          {shareablePlantings.length === 0 ? (
            <p className="text-sm text-gray-500">
              Mark plantings as "available to share" from the planting detail panel to generate a public share link.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                You have <span className="font-medium text-garden-700">{shareablePlantings.length} planting{shareablePlantings.length !== 1 ? 's' : ''}</span> available to share.
                Send this link to friends and neighbors so they can reserve plants.
              </p>

              {shareUrl ? (
                <>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="input text-sm flex-1 bg-stone-50 text-gray-600"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="btn-primary text-sm flex-shrink-0"
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <button
                    onClick={handleGetShareLink}
                    className="text-xs text-gray-400 hover:text-gray-600 mt-1"
                  >
                    Regenerate link
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGetShareLink}
                  className="btn-primary text-sm"
                >
                  <Share2 size={15} />
                  Get Share Link
                </button>
              )}

              {/* Reservations */}
              {shareUrl && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Reservation Requests</h3>
                    <button
                      onClick={loadReservations}
                      className="text-xs text-garden-600 hover:underline"
                    >
                      Refresh
                    </button>
                  </div>

                  {reservationsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={20} className="animate-spin text-gray-400" />
                    </div>
                  ) : reservations.length === 0 ? (
                    <p className="text-sm text-gray-400">No reservation requests yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {reservations.map((r) => {
                        const p = plantings.find((pl) => pl.id === r.plantingId);
                        const plantName = p ? (p.varietyName || p.seedName) : r.plantingId;
                        return (
                          <div key={r.id} className="border border-stone-200 rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{r.requesterName}</p>
                                {r.requesterEmail && (
                                  <p className="text-xs text-gray-500">{r.requesterEmail}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {r.quantity}× {plantName}
                                </p>
                                {r.notes && (
                                  <p className="text-xs text-gray-400 mt-1 italic">"{r.notes}"</p>
                                )}
                              </div>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                  r.status === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : r.status === 'cancelled'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {r.status}
                              </span>
                            </div>
                            {r.status === 'pending' && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleReservationStatus(r.id, 'confirmed')}
                                  className="flex-1 text-xs py-1.5 rounded-lg bg-garden-600 text-white hover:bg-garden-700 transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleReservationStatus(r.id, 'cancelled')}
                                  className="flex-1 text-xs py-1.5 rounded-lg border border-stone-200 text-gray-600 hover:bg-stone-50 transition-colors"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
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
