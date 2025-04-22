'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Session {
  id: number;
  title: string;
  description: string | null;
  date: string;
  duration: number | null;
  game: string | null;
  genre: string | null;
  experienceLevel: string | null;
  maxParticipants: number;
  dm: {
    name: string;
  };
  bookings: Array<{
    userId: string;
    user: {
      email: string;
    };
  }>;
  tags: Array<{
    id: number;
    name: string;
  }>;
}

export default function SessionSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    game: searchParams.get('game') || '',
    genre: searchParams.get('genre') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    searchTerm: searchParams.get('searchTerm') || '',
    availableOnly: searchParams.get('availableOnly') === 'true',
  });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });

        const response = await fetch(`/api/session/search?${params.toString()}`);
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [filters]);

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  if (loading) return <div className="p-4">Loading sessions...</div>;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700">Game</label>
          <select
            value={filters.game}
            onChange={(e) => handleFilterChange('game', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Games</option>
            <option value="D&D 5e">D&D 5e</option>
            <option value="Pathfinder">Pathfinder</option>
            <option value="Call of Cthulhu">Call of Cthulhu</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Genre</label>
          <select
            value={filters.genre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Genres</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Horror">Horror</option>
            <option value="Sci-Fi">Sci-Fi</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Experience Level</label>
          <select
            value={filters.experienceLevel}
            onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            placeholder="Search sessions..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="availableOnly"
            checked={filters.availableOnly}
            onChange={(e) => handleFilterChange('availableOnly', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="availableOnly" className="ml-2 block text-sm text-gray-700">
            Show only available sessions
          </label>
        </div>
      </div>

      {/* Session List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">{session.title}</h3>
            <div className="text-sm text-gray-600 mb-2">
              DM: {session.dm.name}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Date: {new Date(session.date).toLocaleDateString()}
            </div>
            {session.game && (
              <div className="text-sm text-gray-600 mb-2">
                Game: {session.game}
              </div>
            )}
            {session.genre && (
              <div className="text-sm text-gray-600 mb-2">
                Genre: {session.genre}
              </div>
            )}
            {session.experienceLevel && (
              <div className="text-sm text-gray-600 mb-2">
                Level: {session.experienceLevel}
              </div>
            )}
            <div className="text-sm text-gray-600 mb-2">
              Players: {session.bookings.length}/{session.maxParticipants}
            </div>
            {session.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {session.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            {session.description && (
              <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                {session.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 