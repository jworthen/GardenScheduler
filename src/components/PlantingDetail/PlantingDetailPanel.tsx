import { useState, useRef } from 'react';
import { Trash2, Camera, X, Loader2, Tag } from 'lucide-react';
import clsx from 'clsx';
import { useGardenStore } from '../../store/useStore';
import { PlantingEntry } from '../../types';
import { formatDisplayDateShort } from '../../utils/dateCalculations';
import { useAuth } from '../../contexts/AuthContext';
import { uploadPhoto, deletePhotos, MAX_PHOTO_BYTES } from '../../lib/photoUpload';
import SeedTagModal from '../SeedTag/SeedTagModal';

interface Props {
  planting: PlantingEntry;
  onClose: () => void;
  onRemove: () => void;
}

export default function PlantingDetailPanel({ planting, onClose, onRemove }: Props) {
  const { addSuccessionPlanting, updatePlanting } = useGardenStore();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successionDays, setSuccessionDays] = useState(14);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [showTag, setShowTag] = useState(false);

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

  const rows = [
    { label: '🌱 Start Indoors', date: planting.indoorStartDate },
    { label: '🪴 Pot Up', date: planting.potUpDate },
    { label: '🌤️ Begin Hardening Off', date: planting.hardeningOffStart },
    { label: '🌿 Transplant Outdoors', date: planting.transplantDate },
    { label: '🌾 Direct Sow', date: planting.directSowDate },
    { label: '🥕 First Harvest', date: planting.firstHarvestDate },
    { label: '🌸 First Bloom', date: planting.firstBloomDate },
  ].filter((r) => r.date);

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
        <div className="space-y-2 mb-5">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Dates</h4>
          {rows.map(({ label, date }) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-stone-100">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-medium text-gray-900">
                {date ? formatDisplayDateShort(date) : '—'}
              </span>
            </div>
          ))}
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

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors w-full justify-center"
        >
          <Trash2 size={14} />
          Remove from Calendar
        </button>
      </div>

      {showTag && (
        <SeedTagModal planting={planting} onClose={() => setShowTag(false)} />
      )}
    </div>
  );
}
