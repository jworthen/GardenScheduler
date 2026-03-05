import { useState } from 'react';
import Modal from '../../components/common/Modal';
import { Seed } from '../../types';
import { useGardenStore } from '../../store/useStore';
import { calculatePlantingDates, formatDisplayDate, parseMMDD } from '../../utils/dateCalculations';
import { Calendar, Plus } from 'lucide-react';
import clsx from 'clsx';

interface AddToCalendarModalProps {
  seed: Seed | null;
  onClose: () => void;
}

export default function AddToCalendarModal({ seed, onClose }: AddToCalendarModalProps) {
  const { settings, addPlanting, beds } = useGardenStore();
  const [varietyName, setVarietyName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [bedLocation, setBedLocation] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [added, setAdded] = useState(false);

  if (!seed) return null;

  const frostDate = parseMMDD(settings.location.lastSpringFrost, year);
  const dates = calculatePlantingDates(seed, frostDate, year);

  const handleAdd = () => {
    addPlanting(seed.id, seed, { quantity, notes, bedLocation, year, varietyName: varietyName.trim() || undefined });
    setAdded(true);
    setTimeout(() => {
      onClose();
      setAdded(false);
    }, 1500);
  };

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

  return (
    <Modal
      isOpen={!!seed}
      onClose={onClose}
      title={`Add to Calendar: ${seed.commonName}`}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={added}
            className={clsx(
              'btn-primary',
              added && 'bg-green-500 hover:bg-green-500'
            )}
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

        {/* Variety Name */}
        <div>
          <label className="label">Variety Name (optional)</label>
          <input
            type="text"
            className="input"
            placeholder={`e.g. Sungold, Brandywine, Early Girl`}
            value={varietyName}
            onChange={(e) => setVarietyName(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            The specific variety of {seed.commonName} you're growing.
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
