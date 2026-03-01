import { useState } from 'react';
import Modal from '../../components/common/Modal';
import { useGardenStore } from '../../store/useStore';
import { Seed, PlantCategory, PlantType, LightRequirement, FrostTolerance, WaterNeeds } from '../../types';

interface AddCustomPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const CATEGORY_COLORS: Record<PlantCategory, string> = {
  'vegetable': 'bg-green-500',
  'fruit': 'bg-red-400',
  'herb': 'bg-purple-500',
  'flower-annual': 'bg-orange-400',
  'flower-perennial': 'bg-blue-500',
  'bulb': 'bg-pink-400',
  'cutting': 'bg-rose-500',
};

export default function AddCustomPlantModal({ isOpen, onClose }: AddCustomPlantModalProps) {
  const { addCustomPlant } = useGardenStore();

  const [form, setForm] = useState({
    commonName: '',
    botanicalName: '',
    plantType: 'annual' as PlantType,
    category: 'vegetable' as PlantCategory,
    subcategory: '',
    germMin: 7,
    germMax: 14,
    daysToMaturity: '',
    daysToBloom: '',
    startIndoors: true,
    directSow: false,
    indoorStartWeeks: 6,
    directSowWeeks: 0,
    lightRequirement: 'full-sun' as LightRequirement,
    spacing: 12,
    plantingDepth: 0.25,
    frostTolerance: 'tender' as FrostTolerance,
    waterNeeds: 'medium' as WaterNeeds,
    growingNotes: '',
    specialRequirements: '',
    openPollinated: false,
    coldStratification: false,
    icon: '🌱',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.commonName.trim()) e.commonName = 'Common name is required';
    if (!form.botanicalName.trim()) e.botanicalName = 'Botanical name is required';
    if (!form.growingNotes.trim()) e.growingNotes = 'Growing notes are required';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    addCustomPlant({
      commonName: form.commonName,
      botanicalName: form.botanicalName,
      plantType: form.plantType,
      category: form.category,
      subcategory: form.subcategory || undefined,
      daysToGermination: { min: form.germMin, max: form.germMax },
      daysToMaturity: form.daysToMaturity ? Number(form.daysToMaturity) : undefined,
      daysToBloom: form.daysToBloom ? Number(form.daysToBloom) : undefined,
      startIndoors: form.startIndoors,
      directSow: form.directSow,
      indoorStartWeeks: form.indoorStartWeeks,
      directSowWeeks: form.directSowWeeks,
      lightRequirement: form.lightRequirement,
      spacing: form.spacing,
      plantingDepth: form.plantingDepth,
      coldStratification: form.coldStratification,
      frostTolerance: form.frostTolerance,
      waterNeeds: form.waterNeeds,
      growingNotes: form.growingNotes,
      specialRequirements: form.specialRequirements || undefined,
      openPollinated: form.openPollinated,
      color: CATEGORY_COLORS[form.category],
      icon: form.icon,
    });

    onClose();
  };

  const set = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Custom Plant"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary">Save Plant</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Common Name *</label>
            <input
              type="text"
              className={`input ${errors.commonName ? 'border-red-400' : ''}`}
              value={form.commonName}
              onChange={(e) => set('commonName', e.target.value)}
              placeholder="e.g. Cherokee Purple Tomato"
            />
            {errors.commonName && <p className="text-xs text-red-500 mt-1">{errors.commonName}</p>}
          </div>
          <div className="col-span-2">
            <label className="label">Botanical Name *</label>
            <input
              type="text"
              className={`input ${errors.botanicalName ? 'border-red-400' : ''}`}
              value={form.botanicalName}
              onChange={(e) => set('botanicalName', e.target.value)}
              placeholder="e.g. Solanum lycopersicum"
            />
            {errors.botanicalName && <p className="text-xs text-red-500 mt-1">{errors.botanicalName}</p>}
          </div>
          <div>
            <label className="label">Plant Type</label>
            <select className="input" value={form.plantType} onChange={(e) => set('plantType', e.target.value)}>
              <option value="annual">Annual</option>
              <option value="perennial">Perennial</option>
              <option value="biennial">Biennial</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value as PlantCategory)}>
              {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Germ Min (days)</label>
            <input type="number" className="input" value={form.germMin} onChange={(e) => set('germMin', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Germ Max (days)</label>
            <input type="number" className="input" value={form.germMax} onChange={(e) => set('germMax', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Days to Maturity</label>
            <input type="number" className="input" value={form.daysToMaturity} onChange={(e) => set('daysToMaturity', e.target.value)} placeholder="optional" />
          </div>
          <div>
            <label className="label">Days to Bloom</label>
            <input type="number" className="input" value={form.daysToBloom} onChange={(e) => set('daysToBloom', e.target.value)} placeholder="optional" />
          </div>
          <div>
            <label className="label">Spacing (inches)</label>
            <input type="number" className="input" value={form.spacing} onChange={(e) => set('spacing', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Planting Depth (inches)</label>
            <input type="number" step="0.125" className="input" value={form.plantingDepth} onChange={(e) => set('plantingDepth', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Frost Tolerance</label>
            <select className="input" value={form.frostTolerance} onChange={(e) => set('frostTolerance', e.target.value)}>
              <option value="tender">Tender</option>
              <option value="half-hardy">Half Hardy</option>
              <option value="hardy">Hardy</option>
              <option value="very-hardy">Very Hardy</option>
            </select>
          </div>
          <div>
            <label className="label">Light Requirement</label>
            <select className="input" value={form.lightRequirement} onChange={(e) => set('lightRequirement', e.target.value)}>
              <option value="full-sun">Full Sun</option>
              <option value="partial-shade">Partial Shade</option>
              <option value="shade">Shade</option>
              <option value="full-sun-to-partial-shade">Full Sun to Partial Shade</option>
            </select>
          </div>
          <div>
            <label className="label">Water Needs</label>
            <select className="input" value={form.waterNeeds} onChange={(e) => set('waterNeeds', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="label">Icon (emoji)</label>
            <input type="text" className="input" value={form.icon} onChange={(e) => set('icon', e.target.value)} maxLength={2} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.startIndoors} onChange={(e) => set('startIndoors', e.target.checked)} className="rounded" />
            <span className="text-sm">Start Indoors</span>
          </label>
          {form.startIndoors && (
            <div className="pl-6">
              <label className="label">Weeks before last frost to start indoors</label>
              <input type="number" className="input w-32" value={form.indoorStartWeeks} onChange={(e) => set('indoorStartWeeks', Number(e.target.value))} />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.directSow} onChange={(e) => set('directSow', e.target.checked)} className="rounded" />
            <span className="text-sm">Direct Sow Outdoors</span>
          </label>
          {form.directSow && (
            <div className="pl-6">
              <label className="label">Weeks relative to last frost (negative = before)</label>
              <input type="number" className="input w-32" value={form.directSowWeeks} onChange={(e) => set('directSowWeeks', Number(e.target.value))} />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.openPollinated} onChange={(e) => set('openPollinated', e.target.checked)} className="rounded" />
            <span className="text-sm">Open Pollinated / Heirloom</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.coldStratification} onChange={(e) => set('coldStratification', e.target.checked)} className="rounded" />
            <span className="text-sm">Requires Cold Stratification</span>
          </label>
        </div>

        <div>
          <label className="label">Growing Notes *</label>
          <textarea
            className={`input resize-none ${errors.growingNotes ? 'border-red-400' : ''}`}
            rows={3}
            value={form.growingNotes}
            onChange={(e) => set('growingNotes', e.target.value)}
            placeholder="Describe how to grow this plant..."
          />
          {errors.growingNotes && <p className="text-xs text-red-500 mt-1">{errors.growingNotes}</p>}
        </div>

        <div>
          <label className="label">Special Requirements (optional)</label>
          <textarea
            className="input resize-none"
            rows={2}
            value={form.specialRequirements}
            onChange={(e) => set('specialRequirements', e.target.value)}
            placeholder="Any special care instructions..."
          />
        </div>
      </div>
    </Modal>
  );
}
