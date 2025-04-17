'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDm, setIsDm] = useState(false);


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
  
    if (error) {
      setError(error.message);
      return;
    }
  
    const userId = data.user?.id;
    const userEmail = data.user?.email;
  
    if (!userId || !userEmail) {
      setError('Failed to get user info after sign up.');
      return;
    }
  
    const roles = isDm ? ['dm'] : ['user'];
  
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userId,
        email: userEmail,
        roles,
      }),
    });
  
    if (!res.ok) {
      setError('Error creating profile.');
      return;
    }
  
    router.push('/');
  };
  

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Sign Up</h1>
      <form onSubmit={handleSignUp} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border p-2 rounded"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border p-2 rounded"
        />
        <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isDm}
          onChange={(e) => setIsDm(e.target.checked)}
        />
        Sign up as a Dungeon Master
        </label>
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">
          Sign Up
        </button>
        <p className="text-sm mt-2">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 underline">Log in</Link>
        </p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </main>
  );
}
