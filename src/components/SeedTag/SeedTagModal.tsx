import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import { X, Printer } from 'lucide-react';
import type { PlantingEntry } from '../../types';

type TagLayout = 'stake' | 'round' | 'packet';

const LAYOUT_LABELS: Record<TagLayout, string> = {
  stake: '1×4″ Stake',
  round: '2.5″ Round',
  packet: '3.5×2″ Packet',
};

const LAYOUT_HINT: Record<TagLayout, string> = {
  stake: '1″ × 4″ stake tag — cut and fold after printing',
  round: '2.5″ round pot label — cut along the dashed border',
  packet: '3.5″ × 2″ seed packet label — print landscape for best results',
};

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

function buildOfflinePayload(planting: PlantingEntry): string {
  const displayName = planting.varietyName || planting.seedName;
  const subName = planting.varietyName ? planting.seedName : null;
  const sowDate = formatTagDate(planting.indoorStartDate) || formatTagDate(planting.directSowDate);
  const transplantDate = formatTagDate(planting.transplantDate);
  const harvestDate = formatTagDate(planting.firstHarvestDate);
  const bloomDate = formatTagDate(planting.firstBloomDate);
  const lines = [displayName];
  if (subName) lines.push(subName);
  if (sowDate) lines.push(`${planting.indoorStartDate ? 'Sow indoors' : 'Direct sow'}: ${sowDate}`);
  if (transplantDate) lines.push(`Transplant: ${transplantDate}`);
  if (harvestDate) lines.push(`Harvest: ${harvestDate}`);
  if (bloomDate) lines.push(`Bloom: ${bloomDate}`);
  lines.push('lastfrost.app');
  return lines.join('\n');
}

function StakeTag({ planting, qrValue }: { planting: PlantingEntry; qrValue: string }) {
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
        <QRCode value={qrValue} size={72} level="M" />
      </div>
      <div className="seed-tag-stake__footer">lastfrost.app</div>
    </div>
  );
}

function RoundLabel({ planting, qrValue }: { planting: PlantingEntry; qrValue: string }) {
  const displayName = planting.varietyName || planting.seedName;
  const subName = planting.varietyName ? planting.seedName : null;
  const sowDate =
    formatTagDate(planting.indoorStartDate) ||
    formatTagDate(planting.directSowDate);
  const transplantDate = formatTagDate(planting.transplantDate);

  return (
    <div className="seed-tag-round">
      <div className="seed-tag-round__name">{displayName}</div>
      {subName && <div className="seed-tag-round__subname">{subName}</div>}
      {sowDate && (
        <div className="seed-tag-round__date-row">
          <span className="seed-tag-round__date-label">
            {planting.indoorStartDate ? 'Sow' : 'Direct sow'}
          </span>
          <span>{sowDate}</span>
        </div>
      )}
      {transplantDate && (
        <div className="seed-tag-round__date-row">
          <span className="seed-tag-round__date-label">Transplant</span>
          <span>{transplantDate}</span>
        </div>
      )}
      <div className="seed-tag-round__qr">
        <QRCode value={qrValue} size={52} level="M" />
      </div>
    </div>
  );
}

function PacketLabel({ planting, qrValue }: { planting: PlantingEntry; qrValue: string }) {
  const displayName = planting.varietyName || planting.seedName;
  const subName = planting.varietyName ? planting.seedName : null;
  const sowDate =
    formatTagDate(planting.indoorStartDate) ||
    formatTagDate(planting.directSowDate);
  const transplantDate = formatTagDate(planting.transplantDate);
  const harvestDate = formatTagDate(planting.firstHarvestDate);
  const bloomDate = formatTagDate(planting.firstBloomDate);

  return (
    <div className="seed-tag-packet">
      <div className="seed-tag-packet__info">
        <div className="seed-tag-packet__name">{displayName}</div>
        {subName && <div className="seed-tag-packet__subname">{subName}</div>}
        <div className="seed-tag-packet__dates">
          {sowDate && (
            <div className="seed-tag-packet__date-row">
              <span className="seed-tag-packet__date-label">
                {planting.indoorStartDate ? 'Sow indoors' : 'Direct sow'}
              </span>
              <span>{sowDate}</span>
            </div>
          )}
          {transplantDate && (
            <div className="seed-tag-packet__date-row">
              <span className="seed-tag-packet__date-label">Transplant</span>
              <span>{transplantDate}</span>
            </div>
          )}
          {harvestDate && (
            <div className="seed-tag-packet__date-row">
              <span className="seed-tag-packet__date-label">Harvest</span>
              <span>{harvestDate}</span>
            </div>
          )}
          {bloomDate && (
            <div className="seed-tag-packet__date-row">
              <span className="seed-tag-packet__date-label">Bloom</span>
              <span>{bloomDate}</span>
            </div>
          )}
        </div>
      </div>
      <div className="seed-tag-packet__qr">
        <QRCode value={qrValue} size={72} level="M" />
        <div className="seed-tag-packet__footer">lastfrost.app</div>
      </div>
    </div>
  );
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

  function renderTag() {
    switch (layout) {
      case 'round': return <RoundLabel planting={planting} qrValue={qrValue} />;
      case 'packet': return <PacketLabel planting={planting} qrValue={qrValue} />;
      default: return <StakeTag planting={planting} qrValue={qrValue} />;
    }
  }

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
            {renderTag()}
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

      {/* Print-only portal — always rendered so @media print can pick it up */}
      {createPortal(
        <div className="seed-tag-print-root">{renderTag()}</div>,
        document.body
      )}
    </>
  );
}
