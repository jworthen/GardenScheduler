import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Check, Loader2, Share2, LogOut, Link, Users } from 'lucide-react';
import { useGardenContext } from '../contexts/GardenContext';
import { useGardenStore } from '../store/useStore';

type Panel = 'list' | 'new' | 'share' | 'join';

export default function GardenSwitcher() {
  const {
    gardens, activeGardenId, switching,
    switchGarden, createGarden, deleteGarden,
    shareGarden, joinGarden, leaveGarden,
  } = useGardenContext();
  const gardenName = useGardenStore((s) => s.settings.profile.gardenName);

  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>('list');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  // Share panel state
  const [shareCode, setShareCode] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  // Join panel state
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeDropdown = () => {
    setOpen(false);
    setPanel('list');
    setNewName('');
    setShareCode('');
    setJoinCode('');
    setJoinError('');
    setCopied(false);
  };

  const activeGarden = gardens.find((g) => g.id === activeGardenId);
  const displayName = activeGardenId === activeGarden?.id && gardenName
    ? gardenName
    : activeGarden?.name ?? 'My Garden';

  const handleSwitch = async (id: string) => {
    closeDropdown();
    await switchGarden(id);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createGarden(name);
      closeDropdown();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteGarden(id);
  };

  const handleLeave = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Leave "${name}"? You can rejoin with the invite code.`)) return;
    await leaveGarden(id);
  };

  const handleShare = async () => {
    if (!activeGardenId) return;
    setSharing(true);
    try {
      const code = await shareGarden(activeGardenId);
      setShareCode(code);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not generate invite code');
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    const code = joinCode.trim();
    if (!code) return;
    setJoining(true);
    setJoinError('');
    try {
      await joinGarden(code);
      closeDropdown();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join garden');
    } finally {
      setJoining(false);
    }
  };

  if (gardens.length === 0) return null;

  const isActiveOwned = activeGarden?.role !== 'member';

  return (
    <div ref={containerRef} className="px-3 py-2 border-b border-stone-100 relative">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen((o) => !o); setPanel('list'); }}
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

          {/* ── Garden list panel ── */}
          {panel === 'list' && (
            <>
              <div className="py-1">
                {gardens.map((g) => {
                  const isActive = g.id === activeGardenId;
                  const label = isActive && gardenName ? gardenName : g.name;
                  const isMember = g.role === 'member';
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
                      {isMember && (
                        <span title="Shared garden" className="flex-shrink-0">
                          <Users size={11} className="text-gray-400" />
                        </span>
                      )}
                      {!isActive && (
                        isMember ? (
                          <button
                            onClick={(e) => handleLeave(e, g.id, label)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                            title="Leave shared garden"
                          >
                            <LogOut size={12} />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleDelete(e, g.id, label)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                            title="Delete garden"
                          >
                            <Trash2 size={12} />
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-stone-100" />

              <div className="py-1">
                {/* Share active garden (owner only) */}
                {isActiveOwned && (
                  <button
                    onClick={() => { setPanel('share'); handleShare(); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-stone-50 transition-colors"
                  >
                    <Share2 size={13} className="text-gray-400" />
                    Share this garden…
                  </button>
                )}
                {/* Join a shared garden */}
                <button
                  onClick={() => setPanel('join')}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-stone-50 transition-colors"
                >
                  <Link size={13} className="text-gray-400" />
                  Join with invite code…
                </button>
                {/* New garden */}
                <button
                  onClick={() => setPanel('new')}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-stone-50 transition-colors"
                >
                  <Plus size={13} className="text-gray-400" />
                  New Garden
                </button>
              </div>
            </>
          )}

          {/* ── New garden panel ── */}
          {panel === 'new' && (
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">New Garden</p>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setPanel('list');
                }}
                placeholder="Garden name…"
                className="input text-sm w-full mb-2"
                maxLength={60}
              />
              <div className="flex gap-1.5">
                <button onClick={() => setPanel('list')} className="btn-secondary text-xs flex-1 justify-center py-1.5">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="btn-primary text-xs flex-1 justify-center py-1.5 disabled:opacity-50"
                >
                  {creating ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
                </button>
              </div>
            </div>
          )}

          {/* ── Share panel ── */}
          {panel === 'share' && (
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Invite Code</p>
              {sharing ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={18} className="animate-spin text-gray-400" />
                </div>
              ) : shareCode ? (
                <>
                  <p className="text-xs text-gray-500 mb-2">
                    Share this code with anyone you want to give access to <strong>{displayName}</strong>.
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex-1 text-center font-mono text-xl font-bold tracking-widest text-garden-700 bg-garden-50 rounded-lg py-2">
                      {shareCode}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="btn-secondary text-xs px-2 py-1.5 flex-shrink-0"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">They'll use "Join with invite code" in their app.</p>
                  <button
                    onClick={() => { handleShare(); }}
                    className="text-xs text-garden-600 hover:underline mb-2 block"
                  >
                    Generate new code
                  </button>
                </>
              ) : (
                <p className="text-xs text-red-500 py-2">Failed to generate code.</p>
              )}
              <button onClick={() => setPanel('list')} className="btn-secondary text-xs w-full justify-center py-1.5">
                Done
              </button>
            </div>
          )}

          {/* ── Join panel ── */}
          {panel === 'join' && (
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Join a Garden</p>
              <p className="text-xs text-gray-500 mb-2">Enter the invite code shared with you.</p>
              <input
                autoFocus
                type="text"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJoin();
                  if (e.key === 'Escape') setPanel('list');
                }}
                placeholder="ABC123"
                className="input text-sm w-full mb-1 font-mono tracking-widest text-center uppercase"
                maxLength={6}
              />
              {joinError && <p className="text-xs text-red-500 mb-2">{joinError}</p>}
              <div className="flex gap-1.5 mt-2">
                <button onClick={() => setPanel('list')} className="btn-secondary text-xs flex-1 justify-center py-1.5">
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joinCode.trim().length < 4 || joining}
                  className="btn-primary text-xs flex-1 justify-center py-1.5 disabled:opacity-50"
                >
                  {joining ? <Loader2 size={12} className="animate-spin" /> : 'Join'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
