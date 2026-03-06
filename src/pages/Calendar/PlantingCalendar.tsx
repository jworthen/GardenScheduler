import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, LayoutList } from 'lucide-react';
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
import { Link, useSearchParams } from 'react-router-dom';
import { deletePhotos } from '../../lib/photoUpload';
import PlantingDetailPanel from '../../components/PlantingDetail/PlantingDetailPanel';

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
  const [searchParams] = useSearchParams();

  // Deep-link: /calendar?p={plantingId} opens the detail panel
  useEffect(() => {
    const pid = searchParams.get('p');
    if (pid) setSelectedPlantingId(pid);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    const displayName = p.varietyName || p.seedName;
    if (p.indoorStartDate) addEvent(p.indoorStartDate, p.id, displayName, p.color, 'start-indoors', '🌱 Start');
    if (p.transplantDate) addEvent(p.transplantDate, p.id, displayName, p.color, 'transplant', '🌿 Transplant');
    if (p.directSowDate) addEvent(p.directSowDate, p.id, displayName, p.color, 'direct-sow', '🌾 Direct Sow');
    if (p.firstHarvestDate) addEvent(p.firstHarvestDate, p.id, displayName, p.color, 'harvest', '🥕 Harvest');
    if (p.firstBloomDate) addEvent(p.firstBloomDate, p.id, displayName, p.color, 'bloom', '🌸 Bloom');
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
            if (window.confirm(`Remove ${selectedPlanting.varietyName || selectedPlanting.seedName} from calendar?`)) {
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
            <div>
              <span className="font-semibold text-gray-900 text-sm">{planting.varietyName || planting.seedName}</span>
              {planting.varietyName && (
                <span className="text-xs text-gray-400 ml-1.5">({planting.seedName})</span>
              )}
            </div>
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


