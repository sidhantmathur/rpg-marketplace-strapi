'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateSessionForm from './CreateSessionForm';

const GAME_OPTIONS = [
  'D&D 5e',
  'Pathfinder',
  'Call of Cthulhu',
  'Starfinder',
  'Shadowrun',
  'Cyberpunk Red',
  'Vampire: The Masquerade',
  'Other'
];

const GENRE_OPTIONS = [
  'Fantasy',
  'Horror',
  'Sci-Fi',
  'Modern',
  'Historical',
  'Post-Apocalyptic',
  'Superhero',
  'Other'
];

const EXPERIENCE_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'All Levels'
];

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
  imageUrl?: string;
}

export default function SessionSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    game: '',
    genre: '',
    experienceLevel: '',
    dateFrom: '',
    dateTo: '',
    tags: [] as string[],
  });

  const fetchSessions = async () => {
    const params = new URLSearchParams();
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.game) params.append('game', filters.game);
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));

    const response = await fetch(`/api/session/search?${params.toString()}`);
    const data = await response.json();
    setSessions(data);
  };

  useEffect(() => {
    fetchSessions();
  }, [filters]);

  const handleSessionCreated = () => {
    setShowCreateForm(false);
    fetchSessions();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setFilters(prev => ({ ...prev, tags }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Sessions</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {showCreateForm ? 'Cancel' : 'Create New Session'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New Session</h3>
          <CreateSessionForm onCancel={() => setShowCreateForm(false)} onSuccess={handleSessionCreated} />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Search Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              placeholder="Search sessions..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Game</label>
            <select
              name="game"
              value={filters.game}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            >
              <option value="">All Games</option>
              {GAME_OPTIONS.map(game => (
                <option key={game} value={game} className="text-gray-900">{game}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Genre</label>
            <select
              name="genre"
              value={filters.genre}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            >
              <option value="">All Genres</option>
              {GENRE_OPTIONS.map(genre => (
                <option key={genre} value={genre} className="text-gray-900">{genre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Experience Level</label>
            <select
              name="experienceLevel"
              value={filters.experienceLevel}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            >
              <option value="">All Levels</option>
              {EXPERIENCE_LEVELS.map(level => (
                <option key={level} value={level} className="text-gray-900">{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date From</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date To</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <input
              type="text"
              value={filters.tags.join(', ')}
              onChange={handleTagChange}
              placeholder="e.g. roleplay, combat, exploration"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map(session => (
          <div key={session.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              {session.imageUrl ? (
                <img
                  src={session.imageUrl}
                  alt={session.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No image</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{session.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{session.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-4">
                <div>
                  <span className="font-medium">Game:</span> {session.game}
                </div>
                <div>
                  <span className="font-medium">Genre:</span> {session.genre}
                </div>
                <div>
                  <span className="font-medium">Level:</span> {session.experienceLevel}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {new Date(session.date).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {session.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 