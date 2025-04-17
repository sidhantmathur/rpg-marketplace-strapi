'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useProfile } from '@/hooks/useProfile';


export default function Home() {
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading } = useProfile();

  const [name, setName] = useState('');
  const [dms, setDms] = useState([]);
  type Session = {
    id: number;
    title: string;
    date: string;
    dm: { name: string };
  };
  
  const [sessions, setSessions] = useState<Session[]>([]);

  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [selectedDm, setSelectedDm] = useState('');
  const [joinedSessionIds, setJoinedSessionIds] = useState<number[]>([]);

  const fetchDMs = async () => {
    const res = await fetch('/api/dm');
    const data = await res.json();
    setDms(data);
  };

  const fetchSessions = async () => {
    const res = await fetch('/api/session');
    const data: Session[] = await res.json();
    setSessions(data);
  };
  

  useEffect(() => {
    fetchDMs();
    fetchSessions();
  }, []);

  const fetchJoinedSessions = async () => {
    if (!user) return;
  
    const res = await fetch(`/api/user-joined-sessions/${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setJoinedSessionIds(data.map((b: any) => b.sessionId));
    }
  };

  useEffect(() => {
    if (user) {
      fetchJoinedSessions();
    }
  }, [user]);

  const leaveSession = async (sessionId: number) => {
    if (!user) return;
  
    const res = await fetch('/api/bookings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId: user.id }),
    });
  
    if (res.ok) {
      setJoinedSessionIds((prev) => prev.filter((id) => id !== sessionId));
    }
  };
  

  if (userLoading || profileLoading) {
    return <p className="p-6">Loading...</p>;
  }

  if (!user) {
    return (
      <main className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">RPG Marketplace</h1>
        <p className="text-gray-700">
          Please log in to create or view sessions.
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">RPG Marketplace</h1>
        <p className="text-gray-700">
          Please log in to create or view sessions.
        </p>
      </main>
    );
  }
  
  const handleDmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const res = await fetch('/api/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        userId: user?.id,
      }),
    });

    if (res.ok) {
      setName('');
      fetchDMs();
    }
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle || !sessionDate || !selectedDm) return;

    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: sessionTitle,
        date: sessionDate,
        dmId: selectedDm,
        userId: user?.id,
      }),
    });

    if (res.ok) {
      setSessionTitle('');
      setSessionDate('');
      setSelectedDm('');
      fetchSessions();
    }
  };

  const joinSession = async (sessionId: number) => {
    if (!user) return;
  
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId: user.id }),
    });
  
    if (res.ok) {
      setJoinedSessionIds(prev => [...prev, sessionId]);
    }
  };
  

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RPG Marketplace</h1>
      {profile ? (
        <p className="text-sm text-gray-600 mb-4">
          You are logged in as: <strong>{profile.roles.join(', ')}</strong>
        </p>
      ) : (
        <p className="text-sm text-red-600 mb-4">
          Profile not found — try refreshing or contact support.
        </p>
      )}
      {profile?.roles.includes('dm') && (
        <section className="mb-8">
          <h2 className="font-semibold mb-2">Add Dungeon Master</h2>
          <form onSubmit={handleDmSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter DM name"
              className="border p-2 rounded w-full"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Add
            </button>
          </form>
          <ul className="space-y-1">
            {dms.map((dm: any) => (
              <li key={dm.id} className="border p-2 rounded">
                {dm.name}
              </li>
            ))}
          </ul>
        </section>
      )}
      {profile?.roles.includes('dm') && (
        <section className="mb-8">
          <h2 className="font-semibold mb-2">Create Session</h2>
          <form onSubmit={handleSessionSubmit} className="grid gap-2 mb-4">
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Session title"
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="border p-2 rounded"
            />
            <select
              value={selectedDm}
              onChange={(e) => setSelectedDm(e.target.value)}
              className="border p-2 rounded bg-white text-black appearance-none"
            >
              <option value="">Select a DM</option>
              {dms.map((dm: any) => (
                <option key={dm.id} value={dm.id} className="text-black">
                  {dm.name}
                </option>
              ))}
            </select>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
              Create Session
            </button>
          </form>
        </section>
      )}
      <section>
        <h2 className="font-semibold mb-2">Available Sessions</h2>
        <ul className="space-y-2">
          {sessions.map((session: any) => (
            <li key={session.id} className="border p-2 rounded">
              <div className="font-semibold">{session.title}</div>
              <div className="text-sm text-gray-600">
                {new Date(session.date).toLocaleDateString()} — Hosted by {session.dm.name}
              </div>

              {profile?.roles.includes('user') && !joinedSessionIds.includes(session.id) && (
                <button
                  onClick={() => joinSession(session.id)}
                  className="mt-2 inline-block text-sm text-blue-600 underline"
                >
                  Join Session
                </button>
              )}

              {profile?.roles.includes('user') && joinedSessionIds.includes(session.id) && (
                <div className="mt-2 text-sm text-green-600">✓ You’ve joined this session</div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {profile?.roles.includes('user') && joinedSessionIds.length > 0 && (
      <section className="mt-10">
        <h2 className="font-semibold mb-2">My Joined Sessions</h2>
        <ul className="space-y-2">
        {sessions
          .filter((session) => joinedSessionIds.includes(session.id))
          .map((session) => (
            <li key={session.id} className="border p-2 rounded">
              <div className="font-semibold">{session.title}</div>
              <div className="text-sm text-gray-600">
                {new Date(session.date).toLocaleDateString()} — Hosted by {session.dm.name}
              </div>
              <button
                onClick={() => leaveSession(session.id)}
                className="mt-2 text-sm text-red-600 underline"
              >
                Leave Session
              </button>
            </li>
          ))}
      </ul>
      </section>
      )}
    </main>
  );
}
