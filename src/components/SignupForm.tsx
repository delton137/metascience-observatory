'use client';

import { useState } from 'react';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const valid = /^\S+@\S+\.\S+$/.test(email);
    if (!valid) {
      setStatus('error');
      setMessage('Please enter a valid email.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data?.error || data?.detail || 'Subscription failed. Try again.');
        return;
      }
      setStatus('success');
      setMessage('Thanks! Please check your inbox to confirm. If you don\'t see an email, check spam');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={onSubmit} className="w-full flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 h-12 px-4 rounded-md border border-black/[.08] dark:border-white/[.145] bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/20"
          aria-label="Email address"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-12 px-5 rounded-md bg-black text-white hover:bg-black/85 disabled:opacity-60"
        >
          {status === 'loading' ? 'Subscribing…' : 'Notify me'}
        </button>
      </form>
      {message ? (
        <p className={`mt-2 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}


