import { useState } from 'react';
import { useAuth, friendlyAuthError } from '../../contexts/AuthContext';

const FEATURES = [
  {
    icon: '🗓️',
    title: 'Smart planting calendar',
    desc: 'Know exactly when to start seeds indoors, direct-sow, and transplant — calculated from your local frost dates.',
  },
  {
    icon: '📦',
    title: 'Seed inventory tracker',
    desc: 'Track every packet in your collection, flag what\'s running low, and link varieties to full growing data.',
  },
  {
    icon: '🌱',
    title: 'Curated seed database',
    desc: 'Hundreds of vegetables, herbs, flowers, and fruits — with spacing, light, germination times, and more.',
  },
  {
    icon: '📓',
    title: 'Garden journal',
    desc: 'Log observations, milestones, and harvests as the season unfolds. Your garden\'s memory, always with you.',
  },
];

const DECORATIONS = [
  { emoji: '🥕', top: '8%',  left: '4%',  rotate: '-15deg', size: '2rem',  opacity: 0.18 },
  { emoji: '🍅', top: '15%', left: '88%', rotate: '10deg',  size: '2.4rem', opacity: 0.18 },
  { emoji: '🌻', top: '65%', left: '6%',  rotate: '8deg',   size: '2.2rem', opacity: 0.18 },
  { emoji: '🥦', top: '78%', left: '90%', rotate: '-12deg', size: '2rem',   opacity: 0.18 },
  { emoji: '🌿', top: '42%', left: '2%',  rotate: '20deg',  size: '1.8rem', opacity: 0.14 },
  { emoji: '🌿', top: '35%', left: '93%', rotate: '-20deg', size: '1.8rem', opacity: 0.14 },
  { emoji: '🫛', top: '88%', left: '30%', rotate: '-8deg',  size: '1.8rem', opacity: 0.14 },
  { emoji: '🌸', top: '5%',  left: '55%', rotate: '5deg',   size: '1.6rem', opacity: 0.14 },
];

type Mode = 'signin' | 'signup' | 'reset';

export default function SignInPage() {
  const { signIn, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setResetSent(false);
    setPassword('');
    setConfirmPassword('');
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn();
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password);
      } else {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {DECORATIONS.map((d, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            fontSize: d.size,
            transform: `rotate(${d.rotate})`,
            opacity: d.opacity,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {d.emoji}
        </span>
      ))}

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-6xl drop-shadow-sm">🌱</div>
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-green-900 tracking-tight">Last Frost</h1>
            <p className="text-green-700 font-medium text-sm mt-0.5 tracking-wide uppercase">Garden Planner</p>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center space-y-2 max-w-lg">
          <p className="text-2xl font-bold text-gray-800 leading-snug">
            Plan your garden.<br />
            <span className="text-green-700">Never miss a planting window.</span>
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            Last Frost keeps your seeds, schedule, and journal in one place — tailored to your climate, saved to the cloud.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-sm flex gap-3 items-start"
            >
              <span className="text-2xl flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Auth card */}
        <div className="bg-white rounded-2xl shadow-md border border-stone-100 p-6 w-full max-w-sm flex flex-col gap-4">

          <div className="text-center">
            <p className="font-semibold text-gray-800">
              {mode === 'signin' && 'Ready to start growing?'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'reset' && 'Reset your password'}
            </p>
            {mode === 'signin' && (
              <p className="text-xs text-gray-400 mt-0.5">Free to use — sign in to sync across devices.</p>
            )}
          </div>

          {/* Password reset success */}
          {mode === 'reset' && resetSent ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                Check your inbox — a reset link is on its way.
              </p>
              <button onClick={() => switchMode('signin')} className="text-sm text-green-700 hover:underline">
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input text-sm"
                />

                {mode !== 'reset' && (
                  <input
                    type="password"
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input text-sm"
                  />
                )}

                {mode === 'signup' && (
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input text-sm"
                  />
                )}

                {error && <p className="text-xs text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-700 hover:bg-green-800 active:bg-green-900 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Please wait…'
                    : mode === 'signin'
                      ? 'Sign in'
                      : mode === 'signup'
                        ? 'Create account'
                        : 'Send reset link'}
                </button>
              </form>

              {mode === 'signin' && (
                <button
                  onClick={() => switchMode('reset')}
                  className="text-xs text-gray-400 hover:text-gray-600 text-center -mt-1"
                >
                  Forgot password?
                </button>
              )}

              {mode !== 'reset' && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-stone-200" />
                    <span className="text-xs text-gray-400">or</span>
                    <div className="flex-1 h-px bg-stone-200" />
                  </div>

                  <button
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 border border-stone-200 hover:bg-stone-50 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                </>
              )}

              <p className="text-xs text-gray-400 text-center">
                {mode === 'signin' ? (
                  <>New here?{' '}
                    <button onClick={() => switchMode('signup')} className="text-green-700 hover:underline font-medium">
                      Create an account
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button onClick={() => switchMode('signin')} className="text-green-700 hover:underline font-medium">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          By signing in you agree to use this app for growing things, not mischief.
        </p>

      </div>
    </div>
  );
}
