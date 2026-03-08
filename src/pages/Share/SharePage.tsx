import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Leaf, CheckCircle2 } from 'lucide-react';
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

function ReserveForm({
  planting,
  token,
  userId,
  onSuccess,
}: {
  planting: SharePagePlanting;
  token: string;
  userId: string;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const available = planting.availableToShare - planting.reservedCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (quantity < 1 || quantity > available) { setError(`Please choose between 1 and ${available}.`); return; }
    setSubmitting(true);
    setError('');
    try {
      await createReservation({
        token,
        userId,
        plantingId: planting.plantingId,
        requesterName: name.trim(),
        ...(email.trim() && { requesterEmail: email.trim() }),
        quantity,
        ...(notes.trim() && { notes: notes.trim() }),
      });
      onSuccess();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
        <input
          type="number"
          min={1}
          max={available}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <p className="text-xs text-gray-400 mt-0.5">{available} available</p>
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
        {submitting ? 'Submitting…' : 'Reserve Plants'}
      </button>
    </form>
  );
}

function PlantCard({
  planting,
  token,
  userId,
}: {
  planting: SharePagePlanting;
  token: string;
  userId: string;
}) {
  const [reserving, setReserving] = useState(false);
  const [done, setDone] = useState(false);
  const available = planting.availableToShare - planting.reservedCount;
  const displayName = planting.varietyName || planting.seedName;

  if (available <= 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${planting.color}`} />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{displayName}</p>
          {planting.varietyName && (
            <p className="text-xs text-gray-400">{planting.seedName}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">{CATEGORY_LABELS[planting.category] ?? planting.category}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
          {available} available
        </span>
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

      {done ? (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
          <CheckCircle2 size={16} />
          Request sent! The grower will be in touch.
        </div>
      ) : reserving ? (
        <ReserveForm
          planting={planting}
          token={token}
          userId={userId}
          onSuccess={() => { setReserving(false); setDone(true); }}
        />
      ) : (
        <button
          onClick={() => setReserving(true)}
          className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          Reserve Plants
        </button>
      )}
    </div>
  );
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [page, setPage] = useState<SharePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const available = page.plantings.filter(
    (p) => p.availableToShare - p.reservedCount > 0,
  );

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Leaf className="text-green-600" size={20} />
          <span className="font-bold text-green-700 text-lg">Last Frost</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{page.gardenName}</h1>
        <p className="text-sm text-gray-500 mt-1">Plants available to share with the community</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {available.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No plants available right now. Check back later!</p>
          </div>
        ) : (
          available.map((p) => (
            <PlantCard
              key={p.plantingId}
              planting={p}
              token={page.token}
              userId={page.userId}
            />
          ))
        )}

        {/* Sign-up CTA */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5 text-center mt-6">
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
