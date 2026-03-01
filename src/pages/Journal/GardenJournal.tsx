import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Edit2, Tag, Calendar, Camera, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import { useGardenStore } from '../../store/useStore';
import { JournalEntry } from '../../types';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { format, parseISO } from '../../utils/dateCalculations';

export default function GardenJournal() {
  const { journalEntries, addJournalEntry, updateJournalEntry, removeJournalEntry } = useGardenStore();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    journalEntries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [journalEntries]);

  const filtered = useMemo(() => {
    return journalEntries.filter((entry) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !entry.title.toLowerCase().includes(q) &&
          !entry.content.toLowerCase().includes(q) &&
          !entry.tags.some((t) => t.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      if (selectedTag && !entry.tags.includes(selectedTag)) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [journalEntries, search, selectedTag]);

  return (
    <div>
      <PageHeader
        title="Garden Journal"
        subtitle="Track your garden's story"
        icon="📔"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            <Plus size={16} /> New Entry
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTag('')}
              className={clsx(
                'badge border cursor-pointer transition-colors',
                !selectedTag ? 'bg-garden-600 text-white border-garden-600' : 'bg-white text-gray-600 border-stone-200 hover:border-stone-300'
              )}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={clsx(
                  'badge border cursor-pointer transition-colors',
                  selectedTag === tag ? 'bg-garden-600 text-white border-garden-600' : 'bg-white text-gray-600 border-stone-200 hover:border-stone-300'
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Entry list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="mx-auto mb-3 opacity-30" size={40} />
            <p className="text-lg font-medium">
              {journalEntries.length === 0 ? 'No journal entries yet' : 'No entries match'}
            </p>
            <p className="text-sm mt-1">
              {journalEntries.length === 0
                ? 'Start recording your garden journey'
                : 'Try a different search'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                onView={setViewEntry}
                onEdit={setEditEntry}
                onDelete={() => {
                  if (window.confirm('Delete this journal entry?')) {
                    removeJournalEntry(entry.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <JournalFormModal
        isOpen={showAdd || !!editEntry}
        entry={editEntry}
        onClose={() => {
          setShowAdd(false);
          setEditEntry(null);
        }}
        onSave={(data) => {
          if (editEntry) {
            updateJournalEntry(editEntry.id, data);
            setEditEntry(null);
          } else {
            addJournalEntry(data);
            setShowAdd(false);
          }
        }}
      />

      {/* View modal */}
      {viewEntry && (
        <Modal
          isOpen={!!viewEntry}
          onClose={() => setViewEntry(null)}
          title={viewEntry.title}
          size="lg"
          footer={
            <>
              <button onClick={() => { setViewEntry(null); setEditEntry(viewEntry); }} className="btn-secondary">
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={() => setViewEntry(null)} className="btn-primary">Close</button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>📅 {format(parseISO(viewEntry.date), 'EEEE, MMMM d, yyyy')}</span>
              {viewEntry.weather && <span>🌤️ {viewEntry.weather}</span>}
              {(viewEntry.temperatureHigh || viewEntry.temperatureLow) && (
                <span>🌡️ {viewEntry.temperatureHigh && `${viewEntry.temperatureHigh}°`}{viewEntry.temperatureLow && `/${viewEntry.temperatureLow}°`}</span>
              )}
            </div>
            {viewEntry.bedLocation && (
              <p className="text-sm text-gray-500">📍 {viewEntry.bedLocation}</p>
            )}
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{viewEntry.content}</p>
            </div>
            {viewEntry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewEntry.tags.map((tag) => (
                  <span key={tag} className="badge bg-stone-100 text-gray-600">#{tag}</span>
                ))}
              </div>
            )}
            {viewEntry.photos && viewEntry.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {viewEntry.photos.map((photo, i) => (
                  <img key={i} src={photo} alt={`Photo ${i + 1}`} className="w-full h-40 object-cover rounded-xl" />
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

interface JournalCardProps {
  entry: JournalEntry;
  onView: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: () => void;
}

function JournalCard({ entry, onView, onEdit, onDelete }: JournalCardProps) {
  return (
    <div
      className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onView(entry)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">
              {format(parseISO(entry.date), 'MMM d, yyyy')}
            </span>
            {entry.weather && (
              <span className="text-xs text-gray-400">· {entry.weather}</span>
            )}
            {entry.bedLocation && (
              <span className="text-xs text-gray-400">· 📍 {entry.bedLocation}</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{entry.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{entry.content}</p>
          {entry.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {entry.tags.map((tag) => (
                <span key={tag} className="badge bg-stone-100 text-gray-500 text-xs">#{tag}</span>
              ))}
            </div>
          )}
          {entry.photos && entry.photos.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <Camera size={12} />
              {entry.photos.length} photo{entry.photos.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-stone-100 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface JournalFormModalProps {
  isOpen: boolean;
  entry: JournalEntry | null;
  onClose: () => void;
  onSave: (data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

function JournalFormModal({ isOpen, entry, onClose, onSave }: JournalFormModalProps) {
  const [form, setForm] = useState({
    date: entry?.date || format(new Date(), 'yyyy-MM-dd'),
    title: entry?.title || '',
    content: entry?.content || '',
    tagInput: '',
    tags: entry?.tags || [] as string[],
    bedLocation: entry?.bedLocation || '',
    weather: entry?.weather || '',
    temperatureHigh: entry?.temperatureHigh?.toString() || '',
    temperatureLow: entry?.temperatureLow?.toString() || '',
  });

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const addTag = () => {
    const tag = form.tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    set('tagInput', '');
  };

  const removeTag = (tag: string) => {
    set('tags', form.tags.filter((t) => t !== tag));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        // Store photo as base64
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    onSave({
      date: form.date,
      title: form.title,
      content: form.content,
      tags: form.tags,
      bedLocation: form.bedLocation || undefined,
      weather: form.weather || undefined,
      temperatureHigh: form.temperatureHigh ? Number(form.temperatureHigh) : undefined,
      temperatureLow: form.temperatureLow ? Number(form.temperatureLow) : undefined,
      photos: entry?.photos || [],
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? 'Edit Journal Entry' : 'New Journal Entry'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim() || !form.content.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {entry ? 'Save Changes' : 'Save Entry'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Garden Bed / Location</label>
            <input type="text" className="input" value={form.bedLocation} onChange={(e) => set('bedLocation', e.target.value)} placeholder="e.g. North Bed" />
          </div>
        </div>
        <div>
          <label className="label">Title *</label>
          <input type="text" className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. First seedlings sprouted!" />
        </div>
        <div>
          <label className="label">Journal Entry *</label>
          <textarea
            className="input resize-none"
            rows={5}
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            placeholder="What happened in the garden today? What did you observe, plant, or harvest?"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Weather</label>
            <input type="text" className="input" value={form.weather} onChange={(e) => set('weather', e.target.value)} placeholder="Sunny, cloudy..." />
          </div>
          <div>
            <label className="label">High °F</label>
            <input type="number" className="input" value={form.temperatureHigh} onChange={(e) => set('temperatureHigh', e.target.value)} placeholder="75" />
          </div>
          <div>
            <label className="label">Low °F</label>
            <input type="number" className="input" value={form.temperatureLow} onChange={(e) => set('temperatureLow', e.target.value)} placeholder="55" />
          </div>
        </div>

        <div>
          <label className="label">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="input flex-1"
              value={form.tagInput}
              onChange={(e) => set('tagInput', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Add a tag and press Enter..."
            />
            <button onClick={addTag} className="btn-secondary text-sm">Add</button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((tag) => (
                <span key={tag} className="badge bg-garden-50 text-garden-700 border border-garden-200 flex items-center gap-1">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
