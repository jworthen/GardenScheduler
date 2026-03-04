import { useState } from 'react';
import Modal from '../../components/common/Modal';
import { useGardenStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { PlantCategory } from '../../types';
import { submitSeedRequest } from '../../lib/seedRequests';

interface SeedRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS: Array<{ value: PlantCategory; label: string }> = [
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'herb', label: 'Herb' },
  { value: 'flower-annual', label: 'Annual Flower' },
  { value: 'flower-perennial', label: 'Perennial Flower' },
  { value: 'bulb', label: 'Bulb/Tuber' },
  { value: 'cutting', label: 'Cutting Garden' },
];

export default function SeedRequestModal({ isOpen, onClose, onSuccess }: SeedRequestModalProps) {
  const { user } = useAuth();
  const getAllSeeds = useGardenStore((s) => s.getAllSeeds);

  const [category, setCategory] = useState<PlantCategory>('vegetable');
  const [commonName, setCommonName] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!commonName.trim()) {
      setError('Please enter a variety name.');
      return;
    }

    // Duplicate check against existing database
    const existing = getAllSeeds().find(
      (s) => s.commonName.toLowerCase() === commonName.trim().toLowerCase(),
    );
    if (existing) {
      setError(`"${existing.commonName}" already exists in the database.`);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await submitSeedRequest(
        user.uid,
        user.email ?? '',
        category,
        commonName.trim(),
        notes.trim(),
        sourceUrl.trim() || undefined,
      );
      setCommonName('');
      setNotes('');
      setSourceUrl('');
      setCategory('vegetable');
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request a Variety"
      size="sm"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary" disabled={submitting}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Can't find a plant in the database? Submit a request and we'll review it for addition.
        </p>

        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as PlantCategory)}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Variety Name *</label>
          <input
            type="text"
            className={`input ${error && !commonName.trim() ? 'border-red-400' : ''}`}
            value={commonName}
            onChange={(e) => {
              setCommonName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Mortgage Lifter Tomato"
          />
        </div>

        <div>
          <label className="label">Additional Notes (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any helpful details: why you love it, where you've grown it, etc."
          />
        </div>

        <div>
          <label className="label">Source URL (optional)</label>
          <input
            type="url"
            className="input"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://www.rareseeds.com/…"
          />
          <p className="text-xs text-gray-400 mt-1">
            Link to the seed company page — helps us fill in accurate data when reviewing.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
