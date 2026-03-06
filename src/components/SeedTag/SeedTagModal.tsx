import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import { X, Printer } from 'lucide-react';
import type { PlantingEntry } from '../../types';

interface Props {
  planting: PlantingEntry;
  onClose: () => void;
}

function formatTagDate(iso?: string) {
  if (!iso) return null;
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StakeTag({ planting, url }: { planting: PlantingEntry; url: string }) {
  const displayName = planting.varietyName || planting.seedName;
  const subName = planting.varietyName ? planting.seedName : null;

  const sowDate =
    formatTagDate(planting.indoorStartDate) ||
    formatTagDate(planting.directSowDate);
  const transplantDate = formatTagDate(planting.transplantDate);

  return (
    <div className="seed-tag-stake">
      <div className="seed-tag-stake__name">{displayName}</div>
      {subName && <div className="seed-tag-stake__subname">{subName}</div>}
      <div className="seed-tag-stake__dates">
        {sowDate && (
          <div className="seed-tag-stake__date-row">
            <span className="seed-tag-stake__date-label">
              {planting.indoorStartDate ? 'Sow indoors' : 'Direct sow'}
            </span>
            <span>{sowDate}</span>
          </div>
        )}
        {transplantDate && (
          <div className="seed-tag-stake__date-row">
            <span className="seed-tag-stake__date-label">Transplant</span>
            <span>{transplantDate}</span>
          </div>
        )}
      </div>
      <div className="seed-tag-stake__qr">
        <QRCode value={url} size={72} level="M" />
      </div>
      <div className="seed-tag-stake__footer">lastfrost.app</div>
    </div>
  );
}

export default function SeedTagModal({ planting, onClose }: Props) {
  const url = `${window.location.origin}/calendar?p=${planting.id}`;

  const handlePrint = () => {
    document.body.classList.add('printing-seed-tag');
    window.print();
    // Remove after print dialog closes (either printed or cancelled)
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-seed-tag');
    }, { once: true });
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const tagArea = (
    <div className="seed-tag-print-root">
      <StakeTag planting={planting} url={url} />
    </div>
  );

  return (
    <>
      {/* Modal overlay (screen only) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center no-print">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-80 flex flex-col items-center gap-5">
          <div className="flex items-center justify-between w-full">
            <h3 className="font-semibold text-gray-900">Seed Tag Preview</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-stone-100"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tag preview */}
          <div className="border-2 border-dashed border-stone-200 rounded-lg p-3 flex items-center justify-center bg-stone-50">
            <StakeTag planting={planting} url={url} />
          </div>

          <p className="text-xs text-gray-400 text-center -mt-2">
            1&Prime; &times; 4&Prime; stake tag &mdash; cut and fold after printing
          </p>

          <button onClick={handlePrint} className="btn-primary w-full justify-center">
            <Printer size={15} />
            Print Tag
          </button>
        </div>
      </div>

      {/* Print-only portal — always rendered so @media print can pick it up */}
      {createPortal(tagArea, document.body)}
    </>
  );
}
