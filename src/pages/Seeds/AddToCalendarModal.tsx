import { useState } from 'react';
import Modal from '../../components/common/Modal';
import { Seed } from '../../types';
import { useGardenStore } from '../../store/useStore';
import { calculatePlantingDates, formatDisplayDate, parseMMDD } from '../../utils/dateCalculations';
import { Calendar, ChevronRight, Plus } from 'lucide-react';
import clsx from 'clsx';

interface AddToCalendarModalProps {
  seed: Seed | null;
  onClose: () => void;
}

export default function AddToCalendarModal({ seed, onClose }: AddToCalendarModalProps) {
  const { settings, addPlanting, beds } = useGardenStore();

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [varietyName, setVarietyName] = useState('');

  // Step 2
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [bedLocation, setBedLocation] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [daysToMaturityOverride, setDaysToMaturityOverride] = useState('');
  const [added, setAdded] = useState(false);

  if (!seed) return null;

  const frostDate = parseMMDD(settings.location.lastSpringFrost, year);

  const effectiveDTM =
    daysToMaturityOverride !== '' ? Number(daysToMaturityOverride) : undefined;
  const seedForDates = effectiveDTM != null
    ? { ...seed, daysToMaturity: effectiveDTM }
    : seed;
  const dates = calculatePlantingDates(seedForDates, frostDate, year);

  const dateRows = [
    { label: '🌱 Start Indoors', date: dates.indoorStartDate, show: !!dates.indoorStartDate },
    { label: '🪴 Pot Up', date: dates.potUpDate, show: !!dates.potUpDate },
    { label: '🌤️ Begin Hardening Off', date: dates.hardeningOffStart, show: !!dates.hardeningOffStart },
    { label: '🌿 Transplant Outdoors', date: dates.transplantDate, show: !!dates.transplantDate },
    { label: '🌾 Direct Sow', date: dates.directSowDate, show: !!dates.directSowDate },
    { label: '🥕 First Harvest', date: dates.firstHarvestDate, show: !!dates.firstHarvestDate },
    { label: '🌸 First Bloom', date: dates.firstBloomDate, show: !!dates.firstBloomDate },
  ].filter((r) => r.show);

  const currentYear = new Date().getFullYear();

  const handleAdd = () => {
    addPlanting(seed.id, seed, {
      quantity,
      notes,
      bedLocation,
      year,
      varietyName: varietyName.trim() || undefined,
      daysToMaturityOverride: effectiveDTM,
    });
    setAdded(true);
    setTimeout(() => {
      onClose();
      setAdded(false);
    }, 1500);
  };

  const handleClose = () => {
    setStep(1);
    setVarietyName('');
    setQuantity(1);
    setNotes('');
    setBedLocation('');
    setDaysToMaturityOverride('');
    setAdded(false);
    onClose();
  };

  // ── Step 1 ────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <Modal
        isOpen={!!seed}
        onClose={handleClose}
        title={seed.commonName}
        size="sm"
        footer={
          <>
            <button onClick={handleClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={() => setStep(2)}
              className="btn-primary"
            >
              Next <ChevronRight size={16} />
            </button>
          </>
        }
      >
        <div className="space-y-5 py-2">
          <div className="text-center">
            <p className="text-3xl mb-2">{seed.icon ?? '🌱'}</p>
            <p className="text-sm text-gray-500">
              What variety of <strong>{seed.commonName}</strong> are you growing?
            </p>
          </div>

          <div>
            <input
              type="text"
              className="input text-base py-3"
              placeholder={`e.g. ${seed.category === 'vegetable' ? 'Cherokee Purple, Mortgage Lifter' : seed.category === 'herb' ? 'Genovese, Thai, Purple' : 'Early Wonder, Fordhook Giant'}`}
              value={varietyName}
              onChange={(e) => setVarietyName(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') setStep(2); }}
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              Optional — skip if you don't have a specific variety.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={!!seed}
      onClose={handleClose}
      title={
        varietyName.trim()
          ? `${varietyName.trim()} (${seed.commonName})`
          : `Add to Calendar: ${seed.commonName}`
      }
      size="md"
      footer={
        <>
          <button onClick={() => setStep(1)} className="btn-secondary">
            ← Back
          </button>
          <button
            onClick={handleAdd}
            disabled={added}
            className={clsx('btn-primary', added && 'bg-green-500 hover:bg-green-500')}
          >
            {added ? (
              <>✓ Added!</>
            ) : (
              <>
                <Plus size={16} /> Add to Calendar
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Calculated Dates Preview */}
        <div className="bg-stone-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-garden-600" />
            <h3 className="font-semibold text-gray-900 text-sm">
              Calculated Dates for {year}
            </h3>
          </div>
          {dateRows.length > 0 ? (
            <div className="space-y-2">
              {dateRows.map(({ label, date }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium text-gray-900">
                    {date ? formatDisplayDate(date) : '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No dates calculated for this plant.</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Based on last frost: {formatDisplayDate(frostDate)}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Garden Year</label>
            <select
              className="input"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </select>
          </div>
          <div>
            <label className="label">Quantity / # of Plants</label>
            <input
              type="number"
              className="input"
              min={1}
              max={999}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>

        {/* Days to maturity override */}
        {seed.daysToMaturity != null && (
          <div>
            <label className="label">Days to Maturity (optional override)</label>
            <input
              type="number"
              className="input"
              min={1}
              max={365}
              placeholder={`Default: ${seed.daysToMaturity} days`}
              value={daysToMaturityOverride}
              onChange={(e) => setDaysToMaturityOverride(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Override for a variety with different maturity than the crop-type default.
            </p>
          </div>
        )}

        <div>
          <label className="label">Bed / Garden Location (optional)</label>
          <input
            type="text"
            className="input"
            list="bed-options"
            placeholder={beds.length > 0 ? 'Select a bed or type a name' : 'e.g. Raised Bed A, North Garden'}
            value={bedLocation}
            onChange={(e) => setBedLocation(e.target.value)}
          />
          {beds.length > 0 && (
            <datalist id="bed-options">
              {beds.map((b) => (
                <option key={b.id} value={b.name} />
              ))}
            </datalist>
          )}
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Any special notes for this planting..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
