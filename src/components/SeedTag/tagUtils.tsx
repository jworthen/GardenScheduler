import QRCode from 'react-qr-code';
import type { PlantingEntry } from '../../types';

export type TagLayout = 'stake' | 'round' | 'packet';

export const LAYOUT_LABELS: Record<TagLayout, string> = {
  stake: '1×4″ Stake',
  round: '2.5″ Round',
  packet: '3.5×2″ Packet',
};

export const LAYOUT_HINT: Record<TagLayout, string> = {
  stake: '1″ × 4″ stake tag — cut and fold after printing',
  round: '2.5″ round pot label — cut along the dashed border',
  packet: '3.5″ × 2″ seed packet label — print landscape for best results',
};

export function formatTagDate(iso?: string): string | null {
  if (!iso) return null;
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function buildOfflinePayload(planting: PlantingEntry): string {
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

export function StakeTag({ planting, qrValue }: { planting: PlantingEntry; qrValue: string }) {
  const displayName = planting.varietyName || planting.seedName;
  const subName = planting.varietyName ? planting.seedName : null;
  const sowDate =
    formatTagDate(planting.indoorStartDate) || formatTagDate(planting.directSowDate);
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

export function RoundLabel({ planting, qrValue }: { planting: PlantingEntry; qrValue: string }) {
  const displayName = planting.varietyName || planting.seedName;
  const subName = planting.varietyName ? planting.seedName : null;
  const sowDate =
    formatTagDate(planting.indoorStartDate) || formatTagDate(planting.directSowDate);
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

export function PacketLabel({ planting, qrValue }: { planting: PlantingEntry; qrValue: string }) {
  const displayName = planting.varietyName || planting.seedName;
  const subName = planting.varietyName ? planting.seedName : null;
  const sowDate =
    formatTagDate(planting.indoorStartDate) || formatTagDate(planting.directSowDate);
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

export function TagPreview({
  layout,
  planting,
  qrValue,
}: {
  layout: TagLayout;
  planting: PlantingEntry;
  qrValue: string;
}) {
  switch (layout) {
    case 'round':
      return <RoundLabel planting={planting} qrValue={qrValue} />;
    case 'packet':
      return <PacketLabel planting={planting} qrValue={qrValue} />;
    default:
      return <StakeTag planting={planting} qrValue={qrValue} />;
  }
}
