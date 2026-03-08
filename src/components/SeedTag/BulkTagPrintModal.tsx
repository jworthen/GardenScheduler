import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Tag } from 'lucide-react';
import type { PlantingEntry } from '../../types';
import {
  TagLayout,
  LAYOUT_LABELS,
  LAYOUT_HINT,
  buildOfflinePayload,
  TagPreview,
} from './tagUtils';

interface Props {
  plantings: PlantingEntry[];
  onClose: () => void;
}

export default function BulkTagPrintModal({ plantings, onClose }: Props) {
  const [layout, setLayout] = useState<TagLayout>('stake');
  const [offlineQr, setOfflineQr] = useState(false);

  const totalTags = plantings.reduce((sum, p) => sum + Math.max(1, p.quantity || 1), 0);

  // Each planting repeated by its quantity
  const tagInstances = plantings.flatMap((p) =>
    Array.from({ length: Math.max(1, p.quantity || 1) }, (_, i) => ({
      planting: p,
      key: `${p.id}-${i}`,
    }))
  );

  const getQrValue = (planting: PlantingEntry) =>
    offlineQr
      ? buildOfflinePayload(planting)
      : `${window.location.origin}/calendar?p=${planting.id}`;

  const handlePrint = () => {
    document.body.classList.add('printing-seed-tag', 'printing-bulk');
    window.print();
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-seed-tag', 'printing-bulk');
    }, { once: true });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center no-print">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[26rem] flex flex-col gap-4 max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Bulk Print Tags</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {totalTags} tag{totalTags !== 1 ? 's' : ''} &middot; {plantings.length} planting{plantings.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-stone-100"
            >
              <X size={16} />
            </button>
          </div>

          {/* Layout selector */}
          <div className="flex w-full rounded-xl border border-stone-200 overflow-hidden">
            {(Object.keys(LAYOUT_LABELS) as TagLayout[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayout(l)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  layout === l ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-stone-50'
                }`}
              >
                {LAYOUT_LABELS[l]}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 -mt-1">{LAYOUT_HINT[layout]}</p>

          {/* Planting list — scrollable */}
          <div className="overflow-y-auto flex-1 min-h-0 rounded-xl border border-stone-100 divide-y divide-stone-100">
            {plantings.map((p) => {
              const displayName = p.varietyName || p.seedName;
              const subName = p.varietyName ? p.seedName : null;
              const qty = Math.max(1, p.quantity || 1);
              return (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                    {subName && <p className="text-xs text-gray-400 truncate">{subName}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 bg-stone-100 px-2 py-0.5 rounded-full">
                    <Tag size={10} />
                    <span className="font-medium">{qty}×</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Offline QR toggle */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={offlineQr}
              onChange={(e) => setOfflineQr(e.target.checked)}
              className="mt-0.5 accent-green-600"
            />
            <span className="text-xs text-gray-600 leading-snug">
              <span className="font-medium text-gray-800">Offline-safe QR</span> — encodes plant data directly in each tag; works without internet
            </span>
          </label>

          <button onClick={handlePrint} className="btn-primary w-full justify-center">
            <Printer size={15} />
            Print {totalTags} Tag{totalTags !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {/* Print portal — full sheet of tags */}
      {createPortal(
        <div className="seed-tag-print-root">
          <div className="seed-tag-bulk-sheet">
            {tagInstances.map(({ planting, key }) => (
              <div key={key} className="seed-tag-bulk-cell">
                <TagPreview layout={layout} planting={planting} qrValue={getQrValue(planting)} />
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
