'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useUser(); // ✅ detect if already signed in

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDm, setIsDm] = useState(false);

  // ✅ Redirect signed-in users away from signup page
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    // Step 1: Sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
  
    if (error) {
      setError(error.message);
      return;
    }
  
    // Step 2: Try to use returned user info immediately (if available)
    let userId = data.user?.id;
    let userEmail = data.user?.email;
  
    // Step 3: If not available, attempt to get current session after confirmation
    if (!userId || !userEmail) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
  
      userId = session?.user?.id;
      userEmail = session?.user?.email;
  
      if (!userId || !userEmail) {
        setError('Please check your email to confirm your account, then log in.');
        return;
      }
    }
  
    const roles = isDm ? ['dm'] : ['user'];
  
    console.log('Creating profile with:', { userId, userEmail, roles });
    // Step 4: Check if profile already exists
    const existingRes = await fetch(`/api/profile/${userId}`);
    if (existingRes.ok) {
      router.push('/');
      return;
    }
  
    // Step 5: Create profile
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

    const errorData = await res.json();
    console.error('Profile creation failed:', errorData);
  
    router.push('/');
  };  

  // ✅ Optionally block the form while user state is loading
  if (loading || user) return null;

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
