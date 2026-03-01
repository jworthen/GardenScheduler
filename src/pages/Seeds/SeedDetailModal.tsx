import Modal from '../../components/common/Modal';
import { Seed } from '../../types';
import { CategoryBadge, FrostBadge, LightBadge } from '../../components/common/Badge';
import { Plus, Leaf } from 'lucide-react';
import clsx from 'clsx';

interface SeedDetailModalProps {
  seed: Seed | null;
  onClose: () => void;
  onAddToCalendar: (seed: Seed) => void;
}

export default function SeedDetailModal({ seed, onClose, onAddToCalendar }: SeedDetailModalProps) {
  if (!seed) return null;

  return (
    <Modal
      isOpen={!!seed}
      onClose={onClose}
      title={seed.commonName}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button onClick={() => { onAddToCalendar(seed); onClose(); }} className="btn-primary">
            <Plus size={16} /> Add to Calendar
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Header info */}
        <div className="flex items-start gap-4">
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0', seed.color)}>
            {seed.icon || <Leaf className="text-white" size={20} />}
          </div>
          <div>
            <p className="text-sm text-gray-500 italic">{seed.botanicalName}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <CategoryBadge category={seed.category} />
              <FrostBadge tolerance={seed.frostTolerance} />
              <LightBadge light={seed.lightRequirement} />
              {seed.openPollinated && (
                <span className="badge bg-amber-50 text-amber-700 border border-amber-200">OP/Heirloom</span>
              )}
              {seed.coldStratification && (
                <span className="badge bg-blue-50 text-blue-700 border border-blue-200">❄️ Cold Stratification</span>
              )}
            </div>
          </div>
        </div>

        {/* Growing info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Plant Type', value: capitalize(seed.plantType) },
            { label: 'Days to Germinate', value: `${seed.daysToGermination.min}–${seed.daysToGermination.max} days` },
            ...(seed.daysToMaturity ? [{ label: 'Days to Maturity', value: `${seed.daysToMaturity} days` }] : []),
            ...(seed.daysToBloom ? [{ label: 'Days to Bloom', value: `${seed.daysToBloom} days` }] : []),
            { label: 'Spacing', value: `${seed.spacing}"` },
            { label: 'Plant Depth', value: seed.plantingDepth === 0 ? 'Surface sow' : `${seed.plantingDepth}"` },
            { label: 'Water Needs', value: capitalize(seed.waterNeeds) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-stone-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-0.5">{label}</div>
              <div className="text-sm font-medium text-gray-900">{value}</div>
            </div>
          ))}
        </div>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-3">
          {seed.startIndoors && (
            <div className="bg-garden-50 rounded-xl p-3 border border-garden-100">
              <div className="text-xs text-garden-600 font-medium mb-1">🌱 Start Indoors</div>
              <div className="text-sm text-gray-900">
                {seed.indoorStartWeeks} weeks before last frost
              </div>
            </div>
          )}
          {seed.directSow && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="text-xs text-amber-600 font-medium mb-1">🌾 Direct Sow</div>
              <div className="text-sm text-gray-900">
                {seed.directSowWeeks === 0
                  ? 'At last frost date'
                  : seed.directSowWeeks > 0
                  ? `${seed.directSowWeeks} weeks after last frost`
                  : `${Math.abs(seed.directSowWeeks)} weeks before last frost`}
              </div>
            </div>
          )}
        </div>

        {/* Growing notes */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Growing Notes</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{seed.growingNotes}</p>
        </div>

        {/* Special requirements */}
        {seed.specialRequirements && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
            <h3 className="text-sm font-semibold text-yellow-800 mb-1">Special Requirements</h3>
            <p className="text-sm text-yellow-700">{seed.specialRequirements}</p>
          </div>
        )}

        {/* Companion planting */}
        {(seed.companionPlants?.length || seed.avoidPlanting?.length) && (
          <div className="space-y-2">
            {seed.companionPlants && seed.companionPlants.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                  ✅ Good Companions
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {seed.companionPlants.map((p) => (
                    <span key={p} className="badge bg-green-50 text-green-700 border border-green-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {seed.avoidPlanting && seed.avoidPlanting.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                  ⛔ Avoid Planting With
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {seed.avoidPlanting.map((p) => (
                    <span key={p} className="badge bg-red-50 text-red-700 border border-red-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Seed saving */}
        {seed.seedSavingNotes && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Seed Saving</h3>
            <p className="text-sm text-gray-600">{seed.seedSavingNotes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}
