'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [name, setName] = useState('');
  const [dms, setDms] = useState([]);

  const fetchDMs = async () => {
    const res = await fetch('/api/dm');
    const data = await res.json();
    setDms(data);
  };

  useEffect(() => {
    fetchDMs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const res = await fetch('/api/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      setName('');
      fetchDMs();
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RPG Marketplace: Dungeon Masters</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter DM name"
          className="border border-gray-300 p-2 rounded w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {dms.map((dm: any) => (
          <li
            key={dm.id}
            className="border border-gray-300 p-2 rounded shadow-sm"
          >
            {dm.name}
          </li>
        ))}
      </ul>
    </main>
  );
}
