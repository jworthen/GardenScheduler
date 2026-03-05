import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Images, X, ExternalLink } from 'lucide-react';
import { useGardenStore } from '../../store/useStore';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';

interface GalleryItem {
  url: string;
  date: string;
  sourceType: 'journal' | 'planting';
  sourceId: string;
  sourceName: string;
}

export default function GardenGallery() {
  const { journalEntries, plantings } = useGardenStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'journal' | 'planting'>('all');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const items = useMemo<GalleryItem[]>(() => {
    const list: GalleryItem[] = [];

    journalEntries.forEach((entry) => {
      (entry.photos ?? []).forEach((url) => {
        list.push({
          url,
          date: entry.date,
          sourceType: 'journal',
          sourceId: entry.id,
          sourceName: entry.title,
        });
      });
    });

    plantings.forEach((planting) => {
      (planting.photos ?? []).forEach((url) => {
        list.push({
          url,
          date: planting.createdAt.slice(0, 10),
          sourceType: 'planting',
          sourceId: planting.id,
          sourceName: planting.seedName,
        });
      });
    });

    return list
      .filter((item) => filter === 'all' || item.sourceType === filter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [journalEntries, plantings, filter]);

  const totalCount = useMemo(() => {
    let n = 0;
    journalEntries.forEach((e) => (n += e.photos?.length ?? 0));
    plantings.forEach((p) => (n += p.photos?.length ?? 0));
    return n;
  }, [journalEntries, plantings]);

  return (
    <div>
      <PageHeader
        title="Garden Gallery"
        subtitle={`${totalCount} photo${totalCount !== 1 ? 's' : ''}`}
        icon="🖼️"
      />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'journal', 'planting'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-garden-600 text-white'
                  : 'bg-white border border-stone-200 text-gray-600 hover:bg-stone-50'
              }`}
            >
              {f === 'all' ? 'All' : f === 'journal' ? 'Journal' : 'Plantings'}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Images className="mx-auto mb-3 opacity-30" size={48} />
            <p className="text-lg font-medium">
              {totalCount === 0 ? 'No photos yet' : 'No photos match this filter'}
            </p>
            <p className="text-sm mt-1">
              {totalCount === 0
                ? 'Add photos to journal entries or planting records'
                : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {items.map((item, i) => (
              <button
                key={`${item.url}-${i}`}
                onClick={() => setLightbox(item)}
                className="aspect-square overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-garden-500"
              >
                <img
                  src={item.url}
                  alt={item.sourceName}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Modal
          isOpen
          onClose={() => setLightbox(null)}
          title={lightbox.sourceName}
          size="lg"
          footer={
            <>
              <button onClick={() => setLightbox(null)} className="btn-secondary">
                <X size={14} /> Close
              </button>
              <button
                onClick={() => {
                  setLightbox(null);
                  navigate(lightbox.sourceType === 'journal' ? '/journal' : '/calendar');
                }}
                className="btn-primary"
              >
                <ExternalLink size={14} />
                {lightbox.sourceType === 'journal' ? 'Open Journal' : 'Open Calendar'}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <img
              src={lightbox.url}
              alt={lightbox.sourceName}
              className="w-full rounded-xl object-contain max-h-[60vh]"
            />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="badge bg-stone-100 text-gray-600">
                {lightbox.sourceType === 'journal' ? '📔 Journal' : '🌱 Planting'}
              </span>
              <span>{lightbox.date}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
