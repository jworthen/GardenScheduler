import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Leaf, CheckCircle2, Minus, Plus } from 'lucide-react';
import { getSharePage, createReservation, type SharePage, type SharePagePlanting } from '../../lib/plantShare';
import { formatDisplayDateShort } from '../../utils/dateCalculations';

const CATEGORY_LABELS: Record<string, string> = {
  vegetable: 'Vegetable',
  fruit: 'Fruit',
  herb: 'Herb',
  'flower-annual': 'Annual Flower',
  'flower-perennial': 'Perennial Flower',
  bulb: 'Bulb',
  cutting: 'Cutting',
};

function PlantCard({
  planting,
  qty,
  onQtyChange,
}: {
  planting: SharePagePlanting;
  qty: number;
  onQtyChange: (qty: number) => void;
}) {
  const available = planting.availableToShare - planting.reservedCount;
  const displayName = planting.varietyName || planting.seedName;
  const selected = qty > 0;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-5 transition-colors ${selected ? 'border-green-400' : 'border-stone-100'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${planting.color}`} />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{displayName}</p>
          {planting.varietyName && (
            <p className="text-xs text-gray-400">{planting.seedName}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">{CATEGORY_LABELS[planting.category] ?? planting.category}</p>
        </div>
      </div>

      {/* Key dates */}
      <div className="flex flex-wrap gap-1.5 mb-4 text-xs">
        {planting.transplantDate && (
          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            🌿 Plant {formatDisplayDateShort(planting.transplantDate)}
          </span>
        )}
        {planting.firstHarvestDate && (
          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            🥕 Harvest {formatDisplayDateShort(planting.firstHarvestDate)}
          </span>
        )}
        {planting.firstBloomDate && (
          <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
            🌸 Bloom {formatDisplayDateShort(planting.firstBloomDate)}
          </span>
        )}
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Quantity requesting</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onQtyChange(Math.max(0, qty - 1))}
            disabled={qty === 0}
            className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-gray-600 hover:bg-stone-50 disabled:opacity-30 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="text-center text-sm font-semibold text-gray-900 min-w-[3.5rem]">
            {qty} of {available}
          </span>
          <button
            type="button"
            onClick={() => onQtyChange(Math.min(available, qty + 1))}
            disabled={qty >= available}
            className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-gray-600 hover:bg-stone-50 disabled:opacity-30 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [page, setPage] = useState<SharePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selections, setSelections] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    getSharePage(token)
      .then((data) => {
        if (!data) setNotFound(true);
        else setPage(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const hasSelections = Object.values(selections).some((v) => v > 0);
  const selectedCount = Object.values(selections).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!page) return;
    setSubmitting(true);
    setError('');
    try {
      const selected = Object.entries(selections).filter(([, qty]) => qty > 0);
      await Promise.all(
        selected.map(([plantingId, quantity]) =>
          createReservation({
            token: page.token,
            userId: page.userId,
            plantingId,
            requesterName: name.trim(),
            ...(email.trim() && { requesterEmail: email.trim() }),
            quantity,
            ...(notes.trim() && { notes: notes.trim() }),
          })
        )
      );
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <Loader2 className="text-green-600 animate-spin" size={32} />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center gap-4 text-center px-4">
        <Leaf className="text-green-300" size={48} />
        <h1 className="text-xl font-bold text-gray-700">Share page not found</h1>
        <p className="text-gray-500 text-sm">This link may have expired or been removed.</p>
      </div>
    );
  }

  const available = page.plantings
    .filter((p) => p.availableToShare - p.reservedCount > 0)
    .sort((a, b) => (a.varietyName || a.seedName).localeCompare(b.varietyName || b.seedName));

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Leaf className="text-green-600" size={20} />
          <span className="font-bold text-green-700 text-lg">Last Frost</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {page.ownerName ? `${page.ownerName}'s Garden` : page.gardenName}
        </h1>
        <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto">
          {page.ownerName
            ? `${page.ownerName.split(' ')[0]} has offered to share some of their garden's harvest with the community. Browse what's available below, choose how many you'd like of each, and submit a single request — they'll reach out to arrange pickup.`
            : `This gardener has offered to share some of their harvest with the community. Browse what's available below, choose how many you'd like of each, and submit a single request — they'll reach out to arrange pickup.`}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {done ? (
          <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-sm border border-green-200 p-6 text-center">
            <CheckCircle2 className="text-green-500 mx-auto mb-3" size={40} />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Request sent!</h2>
            <p className="text-sm text-gray-500">
              {page.ownerName ?? 'The grower'} will be in touch to confirm your plants.
            </p>
          </div>
        ) : available.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No plants available right now. Check back later!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {available.map((p) => (
                <PlantCard
                  key={p.plantingId}
                  planting={p}
                  qty={selections[p.plantingId] ?? 0}
                  onQtyChange={(qty) => setSelections((prev) => ({ ...prev, [p.plantingId]: qty }))}
                />
              ))}
            </div>

            {/* Sign-up form — appears once any quantity is selected */}
            {hasSelections && (
              <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-green-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-1">
                  Request {selectedCount} plant{selectedCount !== 1 ? 's' : ''}
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  {Object.entries(selections)
                    .filter(([, qty]) => qty > 0)
                    .map(([id, qty]) => {
                      const p = available.find((pl) => pl.plantingId === id);
                      return p ? `${qty}× ${p.varietyName || p.seedName}` : null;
                    })
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your name *</label>
                    <input
                      className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="First name is fine"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="So they can confirm with you"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                    <input
                      className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. 'I live two streets over'"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {submitting ? 'Submitting…' : `Request ${selectedCount} Plant${selectedCount !== 1 ? 's' : ''}`}
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* Sign-up CTA */}
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-stone-100 p-5 text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">Want to share your own plants?</p>
          <p className="text-xs text-gray-500 mb-3">
            Last Frost is a free garden planner that helps you schedule seeds, track plantings, and share plants with neighbors.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
          >
            <Leaf size={14} />
            Try Last Frost free
          </Link>
        </div>
      </div>
    </div>
  );
}
