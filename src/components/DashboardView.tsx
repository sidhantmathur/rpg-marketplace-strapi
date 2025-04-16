'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';

export default function Home() {
  const { user } = useUser(); // ✅ Moved inside the component

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
  

  const [name, setName] = useState('');
  const [dms, setDms] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [selectedDm, setSelectedDm] = useState('');


  const fetchDMs = async () => {
    const res = await fetch('/api/dm');
    const data = await res.json();
    setDms(data);
  };

  const fetchSessions = async () => {
    const res = await fetch('/api/session');
    const data = await res.json();
    setSessions(data);
  };

  useEffect(() => {
    fetchDMs();
    fetchSessions();
  }, []);

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

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RPG Marketplace</h1>

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

      <section>
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

        <ul className="space-y-2">
          {sessions.map((session: any) => (
            <li key={session.id} className="border p-2 rounded">
              <div className="font-semibold">{session.title}</div>
              <div className="text-sm text-gray-600">
                {new Date(session.date).toLocaleDateString()} — Hosted by {session.dm.name}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
