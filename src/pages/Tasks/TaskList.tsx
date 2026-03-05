import { useState, useMemo } from 'react';
import { CheckSquare, Square, Calendar, AlertTriangle, Filter, Plus } from 'lucide-react';
import clsx from 'clsx';
import { useGardenStore } from '../../store/useStore';
import { Task, TaskType } from '../../types';
import { formatDisplayDate, parseISO, format, isToday, isBefore, getTaskIcon, getTaskLabel } from '../../utils/dateCalculations';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';

type FilterMode = 'all' | 'today' | 'week' | 'overdue' | 'upcoming';

export default function TaskList() {
  const { tasks, completeTask, uncompleteTask, addCustomTask, settings } = useGardenStore();
  const [filter, setFilter] = useState<FilterMode>('week');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => showCompleted || !t.completed);

    switch (filter) {
      case 'today':
        result = result.filter((t) => {
          const d = parseISO(t.dueDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });
        break;
      case 'week':
        result = result.filter((t) => {
          const d = parseISO(t.dueDate);
          return d >= today && d <= weekEnd;
        });
        break;
      case 'overdue':
        result = result.filter((t) => {
          const d = parseISO(t.dueDate);
          d.setHours(0, 0, 0, 0);
          return !t.completed && d < today;
        });
        break;
      case 'upcoming':
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + 30);
        result = result.filter((t) => {
          const d = parseISO(t.dueDate);
          return !t.completed && d > weekEnd && d <= futureDate;
        });
        break;
    }

    return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [tasks, filter, showCompleted, today, weekEnd]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    filteredTasks.forEach((task) => {
      const key = task.dueDate;
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTasks]);

  const overdueCount = tasks.filter((t) => {
    const d = parseISO(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return !t.completed && d < today;
  }).length;

  const todayCount = tasks.filter((t) => {
    const d = parseISO(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return !t.completed && d.getTime() === today.getTime();
  }).length;

  const filters: Array<{ value: FilterMode; label: string; count?: number }> = [
    { value: 'overdue', label: 'Overdue', count: overdueCount },
    { value: 'today', label: 'Today', count: todayCount },
    { value: 'week', label: 'Next 7 Days' },
    { value: 'upcoming', label: 'Next 30 Days' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div>
      <PageHeader
        title="Task List"
        subtitle="Your garden to-do list"
        icon="✅"
        actions={
          <button onClick={() => setShowAddTask(true)} className="btn-primary text-sm">
            <Plus size={16} /> Add Task
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                filter === value
                  ? value === 'overdue' && count && count > 0
                    ? 'bg-red-500 text-white'
                    : 'bg-garden-600 text-white'
                  : value === 'overdue' && count && count > 0
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-white text-gray-600 border border-stone-200 hover:border-stone-300'
              )}
            >
              {value === 'overdue' && count && count > 0 && <AlertTriangle size={12} />}
              {label}
              {count !== undefined && count > 0 && (
                <span className={clsx(
                  'text-xs rounded-full w-5 h-5 flex items-center justify-center',
                  filter === value ? 'bg-white/30 text-white' : 'bg-stone-200 text-gray-700'
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Show completed toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{filteredTasks.length} tasks</p>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded"
            />
            Show completed
          </label>
        </div>

        {/* Task groups */}
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckSquare className="mx-auto mb-3 opacity-30" size={40} />
            <p className="text-lg font-medium">No tasks found</p>
            <p className="text-sm mt-1">
              {filter === 'overdue'
                ? 'You\'re all caught up!'
                : 'Add plants to your calendar to generate tasks'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([dateStr, dateTasks]) => {
              const date = parseISO(dateStr);
              date.setHours(12);
              const isOverdue = isBefore(parseISO(dateStr), today) && !isToday(parseISO(dateStr));
              const isTodayDate = isToday(parseISO(dateStr));

              return (
                <div key={dateStr}>
                  <h3 className={clsx(
                    'text-sm font-bold mb-2 flex items-center gap-2',
                    isOverdue ? 'text-red-600' : isTodayDate ? 'text-garden-700' : 'text-gray-700'
                  )}>
                    {isOverdue && <AlertTriangle size={14} />}
                    {isTodayDate ? '📅 Today — ' : ''}
                    {format(date, 'EEEE, MMMM d, yyyy')}
                    {isOverdue && <span className="font-normal text-red-400">(overdue)</span>}
                  </h3>
                  <div className="space-y-2">
                    {dateTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onComplete={() => completeTask(task.id)}
                        onUncomplete={() => uncompleteTask(task.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddTaskModal isOpen={showAddTask} onClose={() => setShowAddTask(false)} />
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onComplete: () => void;
  onUncomplete: () => void;
}

function TaskItem({ task, onComplete, onUncomplete }: TaskItemProps) {
  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-3 rounded-xl border transition-all',
        task.completed
          ? 'bg-stone-50 border-stone-100 opacity-60'
          : 'bg-white border-stone-200 hover:border-stone-300'
      )}
    >
      <button
        onClick={task.completed ? onUncomplete : onComplete}
        className="flex-shrink-0 mt-0.5 text-garden-600 hover:text-garden-700 transition-colors"
      >
        {task.completed ? (
          <CheckSquare size={20} className="text-garden-500" />
        ) : (
          <Square size={20} className="text-stone-300 hover:text-garden-500" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="text-base flex-shrink-0">{getTaskIcon(task.type)}</span>
          <div className="min-w-0">
            <p className={clsx(
              'text-sm font-medium',
              task.completed ? 'line-through text-gray-400' : 'text-gray-900'
            )}>
              {task.label}
            </p>
            {task.notes && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{task.notes}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={clsx('w-2 h-2 rounded-full', task.color)} />
        <span className="text-xs text-gray-400">
          {getTaskLabel(task.type)}
        </span>
      </div>
    </div>
  );
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddTaskModal({ isOpen, onClose }: AddTaskModalProps) {
  const { addCustomTask, plantings } = useGardenStore();
  const [label, setLabel] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [plantingId, setPlantingId] = useState('');
  const [type, setType] = useState<TaskType>('custom');

  const handleAdd = () => {
    if (!label.trim() || !dueDate) return;

    const linked = plantings.find((p) => p.id === plantingId);
    addCustomTask({
      plantingEntryId: plantingId || 'manual',
      seedId: linked?.seedId || 'manual',
      seedName: linked?.seedName || 'Custom Task',
      category: linked?.category || 'vegetable',
      type,
      label: label.trim(),
      dueDate,
      completed: false,
      notes: notes || undefined,
      color: linked?.color || 'bg-gray-400',
    });
    onClose();
    setLabel('');
    setNotes('');
    setPlantingId('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Custom Task"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleAdd} disabled={!label || !dueDate} className="btn-primary disabled:opacity-50">
            Add Task
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Task Label *</label>
          <input
            type="text"
            className="input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Fertilize tomatoes"
          />
        </div>
        <div>
          <label className="label">Due Date *</label>
          <input
            type="date"
            className="input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Task Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as TaskType)}>
            {(['custom', 'water', 'fertilize', 'deadhead', 'stake', 'transplant', 'direct-sow', 'harvest'] as TaskType[]).map((t) => (
              <option key={t} value={t}>{getTaskLabel(t)}</option>
            ))}
          </select>
        </div>
        {plantings.length > 0 && (
          <div>
            <label className="label">Link to Planting (optional)</label>
            <select className="input" value={plantingId} onChange={(e) => setPlantingId(e.target.value)}>
              <option value="">Not linked</option>
              {plantings.map((p) => (
                <option key={p.id} value={p.id}>{p.varietyName ? `${p.varietyName} (${p.seedName})` : p.seedName}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="input resize-none"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

