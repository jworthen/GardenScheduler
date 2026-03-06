import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X, Clock, ChevronDown, ChevronUp, Search } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { SeedRequest, PlantCategory, PlantType, LightRequirement, FrostTolerance, WaterNeeds, Seed } from '../../types';
import { getAllRequests, approveRequest, rejectRequest, getCommunitySeeds, lookupPlantByName } from '../../lib/seedRequests';
import { useGardenStore } from '../../store/useStore';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID as string | undefined;

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
  vegetable: 'bg-green-500',
  fruit: 'bg-red-400',
  herb: 'bg-purple-500',
  'flower-annual': 'bg-orange-400',
  'flower-perennial': 'bg-blue-500',
  bulb: 'bg-pink-400',
  cutting: 'bg-rose-500',
};

function generateId(): string {
  return 'community-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const defaultSeedForm = (req: SeedRequest) => ({
  commonName: req.commonName,
  botanicalName: '',
  plantType: 'annual' as PlantType,
  category: req.category,
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
  reviewNotes: '',
});

interface ApproveModalProps {
  request: SeedRequest;
  onApprove: (seed: Seed, reviewNotes: string) => Promise<void>;
  onClose: () => void;
}

function ApproveModal({ request, onApprove, onClose }: ApproveModalProps) {
  const [form, setForm] = useState(defaultSeedForm(request));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'found' | 'not-found'>('idle');
  const [lookupQuery, setLookupQuery] = useState(request.commonName);
  const autoLookupRan = useRef(false);

  const set = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    if (submitError) setSubmitError(null);
  };

  const applyLookupResult = (result: Awaited<ReturnType<typeof lookupPlantByName>>) => {
    if (!result) { setLookupStatus('not-found'); return; }
    setForm((prev) => ({
      ...prev,
      ...(result.botanicalName && { botanicalName: result.botanicalName }),
      ...(result.growingNotes && { growingNotes: result.growingNotes }),
      lightRequirement: result.lightRequirement,
      startIndoors: result.startIndoors,
      directSow: result.directSow,
      ...(result.spacing !== null && { spacing: result.spacing }),
    }));
    setLookupStatus('found');
  };

  // Auto-run lookup on mount so the form is pre-filled when the admin opens it
  useEffect(() => {
    if (autoLookupRan.current) return;
    autoLookupRan.current = true;
    setLookingUp(true);
    lookupPlantByName(request.commonName)
      .then(applyLookupResult)
      .finally(() => setLookingUp(false));
  }, []);

  const handleLookup = async () => {
    setLookingUp(true);
    setLookupStatus('idle');
    try {
      const result = await lookupPlantByName(lookupQuery);
      applyLookupResult(result);
    } finally {
      setLookingUp(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.botanicalName.trim()) e.botanicalName = 'Required';
    if (!form.growingNotes.trim()) e.growingNotes = 'Required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      setSubmitError('Fill in the required fields highlighted above before approving.');
      return;
    }
    setSubmitError(null);

    const seed: Seed = {
      id: generateId(),
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
    };

    setSubmitError(null);
    setSubmitting(true);
    try {
      await onApprove(seed, form.reviewNotes);
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to approve — check Firestore permissions and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Approve: ${request.commonName}`}
      size="lg"
      footer={
        <div className="flex flex-col gap-2 w-full">
          {submitError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Approve & Add to Database'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {(request.notes || request.sourceUrl) && (
          <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-gray-600 space-y-1">
            {request.notes && (
              <p><span className="font-medium">Notes:</span> {request.notes}</p>
            )}
            {request.sourceUrl && (
              <p>
                <span className="font-medium">Source: </span>
                <a
                  href={request.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:underline break-all"
                >
                  {request.sourceUrl}
                </a>
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              className="input text-sm flex-1"
              value={lookupQuery}
              onChange={(e) => { setLookupQuery(e.target.value); setLookupStatus('idle'); }}
              placeholder="Search OpenFarm…"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookup(); } }}
            />
            <button
              type="button"
              onClick={handleLookup}
              disabled={lookingUp || submitting || !lookupQuery.trim()}
              className="btn-secondary text-sm flex items-center gap-1.5 flex-shrink-0"
            >
              <Search size={14} />
              {lookingUp ? 'Looking up…' : 'Auto-fill'}
            </button>
          </div>
          {lookupStatus === 'found' && (
            <p className="text-xs text-green-600">Data found and filled in — review before saving.</p>
          )}
          {lookupStatus === 'not-found' && (
            <p className="text-xs text-amber-600">No match found. Try a shorter search term (e.g. "basil").</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Common Name</label>
            <input className="input" value={form.commonName} onChange={(e) => set('commonName', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Botanical Name *</label>
            <input className={`input ${errors.botanicalName ? 'border-red-400' : ''}`} value={form.botanicalName} onChange={(e) => set('botanicalName', e.target.value)} placeholder="e.g. Solanum lycopersicum" />
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
            <label className="label">Subcategory</label>
            <input className="input" value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} placeholder="e.g. Cherry Tomato" />
          </div>
          <div>
            <label className="label">Icon (emoji)</label>
            <input className="input" value={form.icon} onChange={(e) => set('icon', e.target.value)} maxLength={2} />
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
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.startIndoors} onChange={(e) => set('startIndoors', e.target.checked)} className="rounded" />
            Start Indoors
          </label>
          {form.startIndoors && (
            <div className="pl-6">
              <label className="label">Weeks before last frost to start indoors</label>
              <input type="number" className="input w-28" value={form.indoorStartWeeks} onChange={(e) => set('indoorStartWeeks', Number(e.target.value))} />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.directSow} onChange={(e) => set('directSow', e.target.checked)} className="rounded" />
            Direct Sow
          </label>
          {form.directSow && (
            <div className="pl-6">
              <label className="label">Weeks relative to last frost (negative = before)</label>
              <input type="number" className="input w-28" value={form.directSowWeeks} onChange={(e) => set('directSowWeeks', Number(e.target.value))} />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.openPollinated} onChange={(e) => set('openPollinated', e.target.checked)} className="rounded" />
            Open Pollinated / Heirloom
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.coldStratification} onChange={(e) => set('coldStratification', e.target.checked)} className="rounded" />
            Requires Cold Stratification
          </label>
        </div>

        <div>
          <label className="label">Growing Notes *</label>
          <textarea className={`input resize-none ${errors.growingNotes ? 'border-red-400' : ''}`} rows={3} value={form.growingNotes} onChange={(e) => set('growingNotes', e.target.value)} placeholder="Growing instructions..." />
          {errors.growingNotes && <p className="text-xs text-red-500 mt-1">{errors.growingNotes}</p>}
        </div>

        <div>
          <label className="label">Special Requirements (optional)</label>
          <textarea className="input resize-none" rows={2} value={form.specialRequirements} onChange={(e) => set('specialRequirements', e.target.value)} />
        </div>

        <div>
          <label className="label">Review Notes (shown to requester, optional)</label>
          <input className="input" value={form.reviewNotes} onChange={(e) => set('reviewNotes', e.target.value)} placeholder="e.g. Added with minor corrections." />
        </div>
      </div>
    </Modal>
  );
}

interface RejectModalProps {
  request: SeedRequest;
  onReject: (reviewNotes: string) => Promise<void>;
  onClose: () => void;
}

function RejectModal({ request, onReject, onClose }: RejectModalProps) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onReject(reviewNotes);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Reject: ${request.commonName}`}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={submitting}>Cancel</button>
          <button onClick={handleSubmit} className="btn-primary bg-red-600 hover:bg-red-700" disabled={submitting}>
            {submitting ? 'Rejecting…' : 'Reject Request'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Rejecting the request for <strong>{request.commonName}</strong>. The requester will see this note.
        </p>
        <div>
          <label className="label">Reason (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="e.g. Already exists as 'Brandywine Tomato', or not enough info to add."
          />
        </div>
      </div>
    </Modal>
  );
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminSeedRequests() {
  const { user } = useAuth();
  const setCommunitySeeds = useGardenStore((s) => s.setCommunitySeeds);

  const [requests, setRequests] = useState<SeedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [approvingRequest, setApprovingRequest] = useState<SeedRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<SeedRequest | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = ADMIN_UID ? user?.uid === ADMIN_UID : false;

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllRequests();
      setRequests(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleApprove = async (seed: Seed, reviewNotes: string) => {
    if (!approvingRequest) return;
    await approveRequest(approvingRequest.id, seed, reviewNotes);
    // Refresh community seeds in store so the new variety appears immediately
    const fresh = await getCommunitySeeds();
    setCommunitySeeds(fresh);
    await loadRequests();
  };

  const handleReject = async (reviewNotes: string) => {
    if (!rejectingRequest) return;
    await rejectRequest(rejectingRequest.id, reviewNotes);
    await loadRequests();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-lg font-medium">Admin access required</p>
          <p className="text-sm mt-1">Set <code className="bg-stone-100 px-1 rounded">VITE_ADMIN_UID</code> to your Firebase UID in <code className="bg-stone-100 px-1 rounded">.env.local</code>.</p>
        </div>
      </div>
    );
  }

  const filtered = requests.filter((r) => filterStatus === 'all' || r.status === filterStatus);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <PageHeader
        title="Crop Type Request Queue"
        subtitle={`${pendingCount} pending review · missing crop types only`}
        icon="🌿"
      />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all',
                filterStatus === s
                  ? 'bg-garden-600 text-white'
                  : 'bg-white text-gray-600 border border-stone-200 hover:border-stone-300',
              )}
            >
              {s}
              {s === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-garden-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock className="mx-auto mb-3 opacity-30" size={40} />
            <p className="text-lg font-medium">No {filterStatus !== 'all' ? filterStatus : ''} requests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((req) => (
              <div key={req.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{req.commonName}</span>
                      <span className="text-xs text-gray-400 capitalize bg-stone-100 px-2 py-0.5 rounded-full">
                        {req.category}
                      </span>
                      <span className={clsx(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        req.status === 'pending' && 'bg-amber-100 text-amber-700',
                        req.status === 'approved' && 'bg-green-100 text-green-700',
                        req.status === 'rejected' && 'bg-red-100 text-red-700',
                      )}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {req.userEmail} · {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setApprovingRequest(req)}
                          className="btn-secondary text-xs text-green-700 border-green-300 hover:bg-green-50"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => setRejectingRequest(req)}
                          className="btn-secondary text-xs text-red-700 border-red-300 hover:bg-red-50"
                        >
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpandedId((id) => id === req.id ? null : req.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {expandedId === req.id && (
                  <div className="mt-3 pt-3 border-t border-stone-100 text-sm space-y-1 text-gray-600">
                    {req.notes ? (
                      <p><span className="font-medium">Notes:</span> {req.notes}</p>
                    ) : (
                      <p className="text-gray-400 italic">No additional notes.</p>
                    )}
                    {req.sourceUrl && (
                      <p>
                        <span className="font-medium">Source: </span>
                        <a
                          href={req.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-700 hover:underline break-all"
                        >
                          {req.sourceUrl}
                        </a>
                      </p>
                    )}
                    {req.reviewNotes && (
                      <p><span className="font-medium">Review notes:</span> {req.reviewNotes}</p>
                    )}
                    {req.reviewedAt && (
                      <p className="text-xs text-gray-400">
                        Reviewed {new Date(req.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {approvingRequest && (
        <ApproveModal
          request={approvingRequest}
          onApprove={handleApprove}
          onClose={() => setApprovingRequest(null)}
        />
      )}
      {rejectingRequest && (
        <RejectModal
          request={rejectingRequest}
          onReject={handleReject}
          onClose={() => setRejectingRequest(null)}
        />
      )}
    </div>
  );
}
