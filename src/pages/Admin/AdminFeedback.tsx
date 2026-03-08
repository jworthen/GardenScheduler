import { useState, useEffect } from 'react';
import { Bug, Lightbulb, MessageCircle, CheckCircle2, Eye, Archive } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllFeedback,
  updateFeedbackStatus,
  FeedbackSubmission,
  FeedbackCategory,
  FeedbackStatus,
} from '../../lib/feedback';
import PageHeader from '../../components/common/PageHeader';

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID as string | undefined;

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; icon: React.ElementType; color: string }> = {
  bug: { label: 'Bug', icon: Bug, color: 'bg-red-100 text-red-700' },
  feature: { label: 'Feature', icon: Lightbulb, color: 'bg-amber-100 text-amber-700' },
  general: { label: 'General', icon: MessageCircle, color: 'bg-blue-100 text-blue-700' },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-garden-100 text-garden-700' },
  read: { label: 'Read', color: 'bg-stone-100 text-stone-600' },
  resolved: { label: 'Resolved', color: 'bg-gray-100 text-gray-500' },
};

type FilterStatus = FeedbackStatus | 'all';

const STATUS_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'resolved', label: 'Resolved' },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminFeedback() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('new');
  const [filterCategory, setFilterCategory] = useState<FeedbackCategory | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const isAdmin = user?.uid === ADMIN_UID;

  useEffect(() => {
    if (!isAdmin) return;
    getAllFeedback()
      .then(setSubmissions)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Access denied.</p>
      </div>
    );
  }

  const filtered = submissions.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    return true;
  });

  const newCount = submissions.filter((s) => s.status === 'new').length;

  const handleStatus = async (id: string, status: FeedbackStatus) => {
    setUpdating(id);
    try {
      await updateFeedbackStatus(id, status);
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Feedback Inbox"
        subtitle={newCount > 0 ? `${newCount} new submission${newCount !== 1 ? 's' : ''}` : 'All caught up'}
        icon="💬"
      />

      <div className="px-4 sm:px-6 py-4">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Status tabs */}
          <div className="flex rounded-lg border border-stone-200 overflow-hidden">
            {STATUS_TABS.map(({ value, label }) => {
              const count = value === 'all' ? submissions.length : submissions.filter((s) => s.status === value).length;
              return (
                <button
                  key={value}
                  onClick={() => setFilterStatus(value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterStatus === value
                      ? 'bg-garden-600 text-white'
                      : 'text-gray-600 hover:bg-stone-50'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as FeedbackCategory | 'all')}
            className="input text-sm w-auto"
          >
            <option value="all">All categories</option>
            <option value="bug">Bug Reports</option>
            <option value="feature">Feature Requests</option>
            <option value="general">General</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-garden-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle2 size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nothing here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => {
              const cat = CATEGORY_CONFIG[s.category];
              const CatIcon = cat.icon;
              const statusCfg = STATUS_CONFIG[s.status];
              return (
                <div
                  key={s.id}
                  className={`card p-4 ${s.status === 'new' ? 'border-l-4 border-l-garden-400' : ''}`}
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${cat.color}`}>
                      <CatIcon size={11} />
                      {cat.label}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                    <div className="flex-1" />
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(s.createdAt)}</span>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-3">{s.message}</p>

                  {/* Footer: user + actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">
                        {s.userName && <span className="font-medium text-gray-700">{s.userName} · </span>}
                        {s.userEmail}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {s.status === 'new' && (
                        <button
                          onClick={() => handleStatus(s.id, 'read')}
                          disabled={updating === s.id}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-stone-200 text-gray-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
                        >
                          <Eye size={12} />
                          Mark read
                        </button>
                      )}
                      {s.status !== 'resolved' && (
                        <button
                          onClick={() => handleStatus(s.id, 'resolved')}
                          disabled={updating === s.id}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-stone-200 text-gray-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
                        >
                          <Archive size={12} />
                          Resolve
                        </button>
                      )}
                      {s.status === 'resolved' && (
                        <button
                          onClick={() => handleStatus(s.id, 'new')}
                          disabled={updating === s.id}
                          className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 text-gray-500 hover:bg-stone-50 disabled:opacity-50 transition-colors"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
