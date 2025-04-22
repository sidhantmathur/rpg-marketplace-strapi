'use client';

import { useUser } from '@/hooks/useUser';
import { SignOutButton } from '@/components/SignOutButton';
import SessionSearch from '@/components/SessionSearch';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useUser();

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">RPG Marketplace</h1>
        {user ? (
          <SignOutButton />
        ) : (
          <Link href="/login" className="text-blue-600 underline">
            Log in
          </Link>
        )}
      </div>

      {user ? (
        <>
          <p className="mb-4 text-sm text-gray-600">Welcome, {user.email}</p>
          <SessionSearch />
        </>
      ) : (
        <p className="text-gray-700">
          Please <Link href="/login" className="text-blue-600 underline">log in</Link> to create or view sessions.
        </p>
      )}
    </main>
  );
}
