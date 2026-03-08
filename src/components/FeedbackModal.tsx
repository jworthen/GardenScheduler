import { useState, useEffect } from 'react';
import { X, Bug, Lightbulb, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { submitFeedback, FeedbackCategory } from '../lib/feedback';

const MAX_LENGTH = 500;

const CATEGORIES: { value: FeedbackCategory; label: string; icon: React.ElementType; hint: string }[] = [
  { value: 'bug', label: 'Bug Report', icon: Bug, hint: 'Something is broken or behaving unexpectedly' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, hint: 'An idea or improvement you would like to see' },
  { value: 'general', label: 'General', icon: MessageCircle, hint: 'Anything else — questions, praise, concerns' },
];

interface Props {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: Props) {
  const { user } = useAuth();
  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!user || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitFeedback(
        user.uid,
        user.email ?? '',
        user.displayName ?? undefined,
        category,
        message,
      );
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <div>
            <h2 className="font-semibold text-gray-900">Send Feedback</h2>
            <p className="text-xs text-gray-500 mt-0.5">Help us improve Last Frost</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-stone-100"
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          /* Success state */
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <CheckCircle2 size={40} className="text-garden-500" />
            <p className="font-semibold text-gray-900">Thanks for your feedback!</p>
            <p className="text-sm text-gray-500">We read every submission and use them to shape what gets built next.</p>
            <button onClick={onClose} className="mt-2 btn-primary">
              Close
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Category selector */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Category</p>
              <div className="flex gap-2">
                {CATEGORIES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-medium transition-colors ${
                      category === value
                        ? 'border-garden-400 bg-garden-50 text-garden-700'
                        : 'border-stone-200 text-gray-500 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {CATEGORIES.find((c) => c.value === category)?.hint}
              </p>
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-gray-600">Message</p>
                <span className={`text-xs ${message.length > MAX_LENGTH * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {message.length}/{MAX_LENGTH}
                </span>
              </div>
              <textarea
                className="input w-full resize-none text-sm leading-relaxed"
                rows={5}
                placeholder="Describe the bug, idea, or question…"
                maxLength={MAX_LENGTH}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || submitting}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send Feedback'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
