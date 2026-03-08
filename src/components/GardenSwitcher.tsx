import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { useGardenContext } from '../contexts/GardenContext';
import { useGardenStore } from '../store/useStore';

export default function GardenSwitcher() {
  const { gardens, activeGardenId, switching, switchGarden, createGarden, deleteGarden } =
    useGardenContext();
  const gardenName = useGardenStore((s) => s.settings.profile.gardenName);

  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNew(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeGarden = gardens.find((g) => g.id === activeGardenId);
  // Use store's gardenName for the active garden (stays in sync via renameGarden)
  const displayName = activeGardenId === activeGarden?.id && gardenName
    ? gardenName
    : activeGarden?.name ?? 'My Garden';

  const handleSwitch = async (id: string) => {
    setOpen(false);
    await switchGarden(id);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createGarden(name);
      setNewName('');
      setShowNew(false);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteGarden(id);
  };

  if (gardens.length === 0) return null;

  return (
    <div ref={containerRef} className="px-3 py-2 border-b border-stone-100 relative">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen((o) => !o); setShowNew(false); setNewName(''); }}
        disabled={switching}
        className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-stone-50 transition-colors disabled:opacity-60"
      >
        <span className="truncate">{displayName}</span>
        {switching ? (
          <Loader2 size={13} className="text-gray-400 flex-shrink-0 animate-spin" />
        ) : (
          <ChevronDown
            size={13}
            className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && !switching && (
        <div className="absolute left-3 right-3 top-full mt-0.5 z-20 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          {/* Garden list */}
          <div className="py-1">
            {gardens.map((g) => {
              const isActive = g.id === activeGardenId;
              const label = isActive && gardenName ? gardenName : g.name;
              return (
                <div
                  key={g.id}
                  className={`flex items-center gap-2 px-3 py-2 text-sm group ${
                    isActive
                      ? 'bg-garden-50 text-garden-700'
                      : 'text-gray-700 hover:bg-stone-50 cursor-pointer'
                  }`}
                  onClick={() => !isActive && handleSwitch(g.id)}
                >
                  <Check
                    size={13}
                    className={`flex-shrink-0 ${isActive ? 'text-garden-600' : 'invisible'}`}
                  />
                  <span className="flex-1 truncate font-medium">{label}</span>
                  {!isActive && (
                    <button
                      onClick={(e) => handleDelete(e, g.id, label)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                      title="Delete garden"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-stone-100" />

          {/* Add garden */}
          {showNew ? (
            <div className="p-2 flex gap-1.5">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setShowNew(false); setNewName(''); }
                }}
                placeholder="Garden name…"
                className="input text-xs flex-1 py-1"
                maxLength={60}
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="btn-primary text-xs px-2 py-1 disabled:opacity-50"
              >
                {creating ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-stone-50 transition-colors"
            >
              <Plus size={13} className="text-gray-400" />
              New Garden
            </button>
          )}
        </div>
      )}
    </div>
  );
}
