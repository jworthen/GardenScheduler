import { useState, useRef } from 'react';
import { Trash2, Camera, X, Loader2, Tag, Share2 } from 'lucide-react';
import clsx from 'clsx';
import { useGardenStore } from '../../store/useStore';
import { PlantingEntry } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { uploadPhoto, deletePhotos, MAX_PHOTO_BYTES } from '../../lib/photoUpload';
import { getOrCreateShareToken, updateSharePage } from '../../lib/plantShare';
import SeedTagModal from '../SeedTag/SeedTagModal';

interface Props {
  planting: PlantingEntry;
  onClose: () => void;
  onRemove: () => void;
}

export default function PlantingDetailPanel({ planting, onClose, onRemove }: Props) {
  const { addSuccessionPlanting, updatePlanting, plantings, settings } = useGardenStore();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successionDays, setSuccessionDays] = useState(14);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [showTag, setShowTag] = useState(false);
  const [shareQty, setShareQty] = useState(planting.availableToShare ?? 0);
  const [shareSaving, setShareSaving] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !user) return;

    const oversized = files.filter((f) => f.size > MAX_PHOTO_BYTES);
    if (oversized.length) {
      alert(`${oversized.map((f) => f.name).join(', ')} ${oversized.length === 1 ? 'is' : 'are'} too large. Max 10 MB per photo.`);
      return;
    }

    setUploadingCount((c) => c + files.length);
    const urls = await Promise.all(
      files.map((file) => {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `users/${user.uid}/plantings/${planting.id}/${Date.now()}_${safeName}`;
        return uploadPhoto(file, path).finally(() => setUploadingCount((c) => c - 1));
      }),
    );
    updatePlanting(planting.id, { photos: [...(planting.photos ?? []), ...urls] });
  };

  const removePhoto = async (url: string) => {
    updatePlanting(planting.id, { photos: (planting.photos ?? []).filter((u) => u !== url) });
    await deletePhotos([url]);
  };

  type DateField = keyof Pick<PlantingEntry,
    'indoorStartDate' | 'potUpDate' | 'hardeningOffStart' | 'transplantDate' |
    'directSowDate' | 'firstHarvestDate' | 'firstBloomDate'
  >;

  const rows: { label: string; field: DateField }[] = [
    { label: '🌱 Start Indoors',      field: 'indoorStartDate' },
    { label: '🪴 Pot Up',             field: 'potUpDate' },
    { label: '🌤️ Begin Hardening Off', field: 'hardeningOffStart' },
    { label: '🌿 Transplant Outdoors', field: 'transplantDate' },
    { label: '🌾 Direct Sow',         field: 'directSowDate' },
    { label: '🥕 First Harvest',      field: 'firstHarvestDate' },
    { label: '🌸 First Bloom',        field: 'firstBloomDate' },
  ];

  const handleDateChange = (field: DateField, value: string) => {
    updatePlanting(planting.id, { [field]: value || undefined });
  };

  const saveSharing = async () => {
    if (!user) return;
    setShareSaving(true);
    try {
      updatePlanting(planting.id, { availableToShare: shareQty || undefined });
      // Keep share page doc in sync
      let token = settings.profile?.shareToken;
      if (!token) {
        token = await getOrCreateShareToken(user.uid);
        // Token is now in Firestore userProfiles; update local settings too
        useGardenStore.getState().updateSettings({ profile: { ...settings.profile, shareToken: token } });
      }
      const allPlantings = useGardenStore.getState().plantings;
      const shareable = allPlantings
        .map((p) => p.id === planting.id ? { ...p, availableToShare: shareQty || undefined } : p)
        .filter((p) => (p.availableToShare ?? 0) > 0)
        .map((p) => ({
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
      await updateSharePage(token, user.uid, settings.profile?.gardenName ?? 'My Garden', shareable);
    } finally {
      setShareSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-40 overflow-y-auto animate-slide-in">
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={clsx('w-8 h-8 rounded-xl flex-shrink-0', planting.color)} />
            <div>
              <h3 className="font-bold text-gray-900">{planting.varietyName || planting.seedName}</h3>
              {planting.varietyName && (
                <p className="text-xs text-gray-400">{planting.seedName}</p>
              )}
              {planting.bedLocation && (
                <p className="text-xs text-gray-500">📍 {planting.bedLocation}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        {/* Dates */}
        <div className="space-y-0 mb-5">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Key Dates</h4>
          {rows.map(({ label, field }) => {
            const date = planting[field];
            return (
              <div key={field} className="flex items-center justify-between py-1.5 border-b border-stone-100 group">
                <span className="text-sm text-gray-600 flex-shrink-0 mr-2">{label}</span>
                <input
                  type="date"
                  value={date ?? ''}
                  onChange={(e) => handleDateChange(field, e.target.value)}
                  className={clsx(
                    'text-sm font-medium bg-transparent border-0 rounded px-1.5 py-0.5 text-right',
                    'focus:outline-none focus:ring-1 focus:ring-garden-500 focus:bg-white focus:text-left',
                    'hover:bg-stone-50 cursor-pointer transition-colors',
                    date ? 'text-gray-900' : 'text-gray-300',
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Details */}
        {(planting.quantity > 1 || planting.notes) && (
          <div className="space-y-2 mb-5">
            {planting.quantity > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Quantity</span>
                <span className="font-medium">{planting.quantity} plants</span>
              </div>
            )}
            {planting.notes && (
              <p className="text-sm text-gray-600 bg-stone-50 rounded-xl p-3">{planting.notes}</p>
            )}
          </div>
        )}

        {/* Succession Planting */}
        {!planting.parentPlantingId && (
          <div className="mb-5 p-4 bg-stone-50 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Add Succession Planting</h4>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-gray-600 flex-shrink-0">Every</label>
              <input
                type="number"
                className="input w-20 text-sm"
                value={successionDays}
                onChange={(e) => setSuccessionDays(Number(e.target.value))}
                min={7}
                step={7}
              />
              <span className="text-sm text-gray-600">days</span>
            </div>
            <button
              onClick={() => addSuccessionPlanting(planting.id, successionDays)}
              className="btn-secondary text-sm w-full justify-center"
            >
              + Add Succession
            </button>
          </div>
        )}

        {/* Photos */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Photos</h4>
          {(planting.photos?.length ?? 0) > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {planting.photos!.map((url) => (
                <div key={url} className="relative group aspect-square">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg" loading="lazy" />
                  <button
                    onClick={() => removePhoto(url)}
                    className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {uploadingCount > 0 && Array.from({ length: uploadingCount }).map((_, i) => (
                <div key={`uploading-${i}`} className="aspect-square rounded-lg bg-stone-100 flex items-center justify-center">
                  <Loader2 size={20} className="text-gray-400 animate-spin" />
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingCount > 0}
            className="btn-secondary text-sm w-full justify-center disabled:opacity-50"
          >
            <Camera size={14} />
            {uploadingCount > 0
              ? `Uploading ${uploadingCount} photo${uploadingCount !== 1 ? 's' : ''}…`
              : 'Add Photos'}
          </button>
        </div>

        {/* Print Tag */}
        <button
          onClick={() => setShowTag(true)}
          className="btn-secondary text-sm w-full justify-center mb-2"
        >
          <Tag size={14} />
          Print Seed Tag
        </button>

        {/* Sharing */}
        <div className="mb-5 p-4 bg-stone-50 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Share2 size={14} className="text-garden-600" />
            <h4 className="text-sm font-semibold text-gray-900">Share with Neighbors</h4>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-sm text-gray-600 flex-shrink-0">Available to give away</label>
            <input
              type="number"
              className="input w-20 text-sm"
              value={shareQty}
              min={0}
              onChange={(e) => setShareQty(Math.max(0, Number(e.target.value)))}
            />
            <span className="text-sm text-gray-600">plants</span>
          </div>
          <button
            onClick={saveSharing}
            disabled={shareSaving}
            className="btn-secondary text-sm w-full justify-center disabled:opacity-50"
          >
            {shareSaving ? 'Saving…' : shareQty > 0 ? 'Update Sharing' : 'Save (0 = not sharing)'}
          </button>
          {(planting.availableToShare ?? 0) > 0 && (
            <p className="text-xs text-garden-600 mt-2 text-center">
              Currently sharing {planting.availableToShare} · share link in Profile
            </p>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors w-full justify-center"
        >
          <Trash2 size={14} />
          Delete Planting
        </button>
      </div>

      {showTag && (
        <SeedTagModal planting={planting} onClose={() => setShowTag(false)} />
      )}
    </div>
  );
}
