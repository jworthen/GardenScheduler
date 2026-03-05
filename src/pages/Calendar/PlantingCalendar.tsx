import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, LayoutList, Trash2, Camera, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useGardenStore } from '../../store/useStore';
import { PlantingEntry } from '../../types';
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  formatDisplayDateShort,
  getTaskIcon,
} from '../../utils/dateCalculations';
import PageHeader from '../../components/common/PageHeader';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { uploadPhoto, deletePhotos, MAX_PHOTO_BYTES } from '../../lib/photoUpload';

type CalendarView = 'monthly' | 'timeline';

interface DayEvent {
  plantingId: string;
  plantingName: string;
  color: string;
  type: string;
  label: string;
  date: string;
}

export default function PlantingCalendar() {
  const { plantings, settings, removePlanting, tasks } = useGardenStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('monthly');
  // Store ID only so the detail panel always reflects the latest store state.
  const [selectedPlantingId, setSelectedPlantingId] = useState<string | null>(null);
  const selectedPlanting = plantings.find((p) => p.id === selectedPlantingId) ?? null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build event map: date string -> events
  const eventMap: Record<string, DayEvent[]> = {};

  const addEvent = (date: string | undefined, plantingId: string, name: string, color: string, type: string, label: string) => {
    if (!date) return;
    if (!eventMap[date]) eventMap[date] = [];
    eventMap[date].push({ plantingId, plantingName: name, color, type, label, date });
  };

  plantings.forEach((p) => {
    if (p.indoorStartDate) addEvent(p.indoorStartDate, p.id, p.seedName, p.color, 'start-indoors', '🌱 Start');
    if (p.transplantDate) addEvent(p.transplantDate, p.id, p.seedName, p.color, 'transplant', '🌿 Transplant');
    if (p.directSowDate) addEvent(p.directSowDate, p.id, p.seedName, p.color, 'direct-sow', '🌾 Direct Sow');
    if (p.firstHarvestDate) addEvent(p.firstHarvestDate, p.id, p.seedName, p.color, 'harvest', '🥕 Harvest');
    if (p.firstBloomDate) addEvent(p.firstBloomDate, p.id, p.seedName, p.color, 'bloom', '🌸 Bloom');
  });

  return (
    <div>
      <PageHeader
        title="Planting Calendar"
        subtitle={`${plantings.length} plants scheduled`}
        icon="📅"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-stone-200 overflow-hidden">
              <button
                onClick={() => setView('monthly')}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  view === 'monthly' ? 'bg-garden-600 text-white' : 'bg-white text-gray-600 hover:bg-stone-50'
                )}
              >
                <Calendar size={15} className="inline mr-1" />Month
              </button>
              <button
                onClick={() => setView('timeline')}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium transition-colors border-l border-stone-200',
                  view === 'timeline' ? 'bg-garden-600 text-white' : 'bg-white text-gray-600 hover:bg-stone-50'
                )}
              >
                <LayoutList size={15} className="inline mr-1" />Timeline
              </button>
            </div>
            <Link to="/seeds" className="btn-primary text-sm">
              <Plus size={16} /> Add Plant
            </Link>
          </div>
        }
      />

      <div className="px-4 sm:px-6 py-4">
        {plantings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Calendar className="mx-auto mb-3 opacity-30" size={48} />
            <p className="text-lg font-medium mb-1">No plants scheduled</p>
            <p className="text-sm mb-4">Add plants from the seed database to populate your calendar</p>
            <Link to="/seeds" className="btn-primary mx-auto">
              <Plus size={16} /> Browse Seeds
            </Link>
          </div>
        ) : view === 'monthly' ? (
          <MonthView
            currentDate={currentDate}
            onPrev={() => setCurrentDate(subMonths(currentDate, 1))}
            onNext={() => setCurrentDate(addMonths(currentDate, 1))}
            eventMap={eventMap}
            onSelectPlanting={(p) => setSelectedPlantingId(p.id)}
          />
        ) : (
          <TimelineView
            plantings={plantings}
            onSelectPlanting={(p) => setSelectedPlantingId(p.id)}
          />
        )}
      </div>

      {/* Planting Detail Panel */}
      {selectedPlanting && (
        <PlantingDetailPanel
          planting={selectedPlanting}
          onClose={() => setSelectedPlantingId(null)}
          onRemove={async () => {
            if (window.confirm(`Remove ${selectedPlanting.seedName} from calendar?`)) {
              await deletePhotos(selectedPlanting.photos ?? []);
              removePlanting(selectedPlanting.id);
              setSelectedPlantingId(null);
            }
          }}
        />
      )}
    </div>
  );
}

// ===== MONTH VIEW =====
interface MonthViewProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  eventMap: Record<string, DayEvent[]>;
  onSelectPlanting: (p: PlantingEntry) => void;
}

function MonthView({ currentDate, onPrev, onNext, eventMap, onSelectPlanting }: MonthViewProps) {
  const { plantings } = useGardenStore();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button onClick={onNext} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t border-stone-200">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const events = eventMap[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const todayClass = isToday(day);

          return (
            <div
              key={dateStr}
              className={clsx(
                'border-r border-b border-stone-200 min-h-[80px] p-1 sm:p-1.5',
                !isCurrentMonth && 'bg-stone-50',
                todayClass && 'bg-garden-50'
              )}
            >
              <div
                className={clsx(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                  todayClass
                    ? 'bg-garden-600 text-white'
                    : isCurrentMonth
                    ? 'text-gray-700'
                    : 'text-gray-300'
                )}
              >
                {format(day, 'd')}
              </div>

              <div className="space-y-0.5">
                {events.slice(0, 3).map((event, i) => (
                  <button
                    key={`${event.plantingId}-${i}`}
                    onClick={() => {
                      const p = plantings.find((p) => p.id === event.plantingId);
                      if (p) onSelectPlanting(p);
                    }}
                    className={clsx(
                      'w-full text-left px-1 py-0.5 rounded text-xs truncate text-white leading-tight',
                      event.color
                    )}
                    title={`${event.label}: ${event.plantingName}`}
                  >
                    <span className="hidden sm:inline">{event.label.split(' ')[0]} </span>
                    <span className="truncate">{event.plantingName}</span>
                  </button>
                ))}
                {events.length > 3 && (
                  <div className="text-xs text-gray-400 pl-1">+{events.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
        {[
          { color: 'bg-green-500', label: '🌱 Start Indoors' },
          { color: 'bg-blue-500', label: '🌿 Transplant' },
          { color: 'bg-amber-500', label: '🌾 Direct Sow' },
          { color: 'bg-red-400', label: '🥕 Harvest' },
          { color: 'bg-pink-400', label: '🌸 First Bloom' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={clsx('w-3 h-3 rounded-sm flex-shrink-0', color)} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== TIMELINE VIEW =====
interface TimelineViewProps {
  plantings: PlantingEntry[];
  onSelectPlanting: (p: PlantingEntry) => void;
}

function TimelineView({ plantings, onSelectPlanting }: TimelineViewProps) {
  const DATE_TYPES = [
    { key: 'indoorStartDate', label: '🌱 Start', color: 'bg-green-500 text-white' },
    { key: 'directSowDate', label: '🌾 Sow', color: 'bg-amber-500 text-white' },
    { key: 'transplantDate', label: '🌿 Plant', color: 'bg-blue-500 text-white' },
    { key: 'firstHarvestDate', label: '🥕 Harvest', color: 'bg-red-400 text-white' },
    { key: 'firstBloomDate', label: '🌸 Bloom', color: 'bg-pink-400 text-white' },
  ] as const;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Showing all {plantings.length} scheduled plants with their key dates.
      </p>
      {plantings.map((planting) => (
        <div
          key={planting.id}
          className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectPlanting(planting)}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={clsx('w-3 h-3 rounded-full flex-shrink-0', planting.color)} />
            <span className="font-semibold text-gray-900 text-sm">{planting.seedName}</span>
            {planting.bedLocation && (
              <span className="text-xs text-gray-400">📍 {planting.bedLocation}</span>
            )}
            {planting.successionIndex !== undefined && (
              <span className="badge bg-stone-100 text-gray-600 text-xs">#{planting.successionIndex + 1}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {DATE_TYPES.map(({ key, label, color }) => {
              const dateStr = planting[key as keyof PlantingEntry] as string | undefined;
              if (!dateStr) return null;
              return (
                <div key={key} className={clsx('text-xs px-2 py-1 rounded-full font-medium', color)}>
                  {label} {formatDisplayDateShort(dateStr)}
                </div>
              );
            })}
          </div>

          {planting.notes && (
            <p className="text-xs text-gray-400 mt-2 truncate">{planting.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ===== PLANTING DETAIL PANEL =====
interface PlantingDetailPanelProps {
  planting: PlantingEntry;
  onClose: () => void;
  onRemove: () => void;
}

function PlantingDetailPanel({ planting, onClose, onRemove }: PlantingDetailPanelProps) {
  const { addSuccessionPlanting, updatePlanting } = useGardenStore();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successionDays, setSuccessionDays] = useState(14);
  const [uploadingCount, setUploadingCount] = useState(0);

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
              <h3 className="font-bold text-gray-900">{planting.seedName}</h3>
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

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors w-full justify-center"
        >
          <Trash2 size={14} />
          Remove from Calendar
        </button>
      </div>
    </div>
  );
}

