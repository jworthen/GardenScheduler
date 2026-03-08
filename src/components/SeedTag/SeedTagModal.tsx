import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import type { PlantingEntry } from '../../types';
import {
  TagLayout,
  LAYOUT_LABELS,
  LAYOUT_HINT,
  buildOfflinePayload,
  TagPreview,
} from './tagUtils';

interface Props {
  planting: PlantingEntry;
  onClose: () => void;
}

export default function SeedTagModal({ planting, onClose }: Props) {
  const [layout, setLayout] = useState<TagLayout>('stake');
  const [offlineQr, setOfflineQr] = useState(false);

  const url = `${window.location.origin}/calendar?p=${planting.id}`;
  const qrValue = offlineQr ? buildOfflinePayload(planting) : url;

  const handlePrint = () => {
    document.body.classList.add('printing-seed-tag');
    window.print();
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-seed-tag');
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
      {/* Modal overlay (screen only) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center no-print">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[26rem] flex flex-col items-center gap-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="font-semibold text-gray-900">Seed Tag Preview</h3>
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
                  layout === l
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-stone-50'
                }`}
              >
                {LAYOUT_LABELS[l]}
              </button>
            ))}
          </div>

          {/* Tag preview */}
          <div className="border-2 border-dashed border-stone-200 rounded-lg p-3 flex items-center justify-center bg-stone-50 w-full overflow-auto min-h-[120px]">
            <TagPreview layout={layout} planting={planting} qrValue={qrValue} />
          </div>

          <p className="text-xs text-gray-400 text-center -mt-1">{LAYOUT_HINT[layout]}</p>

          {/* Offline QR toggle */}
          <label className="flex items-start gap-2.5 cursor-pointer w-full">
            <input
              type="checkbox"
              checked={offlineQr}
              onChange={(e) => setOfflineQr(e.target.checked)}
              className="mt-0.5 accent-green-600"
            />
            <span className="text-xs text-gray-600 leading-snug">
              <span className="font-medium text-gray-800">Offline-safe QR</span> — encodes plant data directly in the tag; works without internet
            </span>
          </label>

          <button onClick={handlePrint} className="btn-primary w-full justify-center">
            <Printer size={15} />
            Print Tag
          </button>
        </div>
      </div>

      {/* Print-only portal */}
      {createPortal(
        <div className="seed-tag-print-root">
          <TagPreview layout={layout} planting={planting} qrValue={qrValue} />
        </div>,
        document.body
      )}
    </>
  );
}
