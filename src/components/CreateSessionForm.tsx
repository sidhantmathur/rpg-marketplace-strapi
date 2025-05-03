'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/hooks/useUser';
import { Session } from '@prisma/client';
import SessionCalendar from './SessionCalendar';
import { addMinutes } from 'date-fns';

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

interface CreateSessionFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
  session?: Session & {
    tags: { name: string }[];
  };
}

export default function CreateSessionForm({ onCancel, onSuccess, session }: CreateSessionFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: session?.title || '',
    description: session?.description || '',
    date: session?.date ? new Date(session.date) : new Date(),
    time: session?.date ? new Date(session.date).toISOString().split('T')[1].slice(0, 5) : '',
    duration: session?.duration || 120,
    game: session?.game || '',
    genre: session?.genre || '',
    experienceLevel: session?.experienceLevel || '',
    maxParticipants: session?.maxParticipants || 5,
    tags: session?.tags?.map(tag => tag.name) || [] as string[],
    imageUrl: session?.imageUrl || '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(session?.imageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSessions, setExistingSessions] = useState<Date[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Fetch existing sessions for the DM
  useEffect(() => {
    const fetchExistingSessions = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/session/search?dmId=${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch sessions');
        
        const sessions = await response.json();
        setExistingSessions(sessions.map((s: any) => new Date(s.date)));
      } catch (err) {
        console.error('Error fetching sessions:', err);
      }
    };

    fetchExistingSessions();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (session) {
        // Update existing session
        const response = await fetch(`/api/session/${session.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            date: new Date(`${formData.date.toISOString().split('T')[0]}T${formData.time}`).toISOString(),
            duration: parseInt(formData.duration.toString()),
            game: formData.game,
            genre: formData.genre,
            experienceLevel: formData.experienceLevel,
            maxParticipants: parseInt(formData.maxParticipants.toString()),
            tags: formData.tags,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update session');
        }

        // If there's a new image, upload it
        if (imageFile) {
          const path = `${user?.id}/session/${session.id}/${Date.now()}-${imageFile.name}`;

          const { data: uploadData, error } = await supabase
            .storage
            .from('sessions')
            .upload(path, imageFile, { cacheControl: '3600', upsert: false });

          if (error) {
            console.error('Upload error:', error);
            throw new Error('Image upload failed');
          }

          // Get public URL
          const { data: { publicUrl } } = supabase
            .storage
            .from('sessions')
            .getPublicUrl(uploadData.path);

          // Update session with new image URL
          await fetch(`/api/session/${session.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: publicUrl }),
          });
        }
      } else {
        // Create new session
        const sessionResponse = await fetch('/api/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            date: new Date(`${formData.date.toISOString().split('T')[0]}T${formData.time}`).toISOString(),
            duration: parseInt(formData.duration.toString()),
            maxParticipants: parseInt(formData.maxParticipants.toString()),
            tags: formData.tags,
            userId: user?.id,
          }),
        });

        if (!sessionResponse.ok) {
          throw new Error('Failed to create session');
        }

        const sessionData = await sessionResponse.json();

        // If there's an image, upload it
        if (imageFile) {
          const path = `${user?.id}/session/${sessionData.id}/${Date.now()}-${imageFile.name}`;

          const { data: uploadData, error } = await supabase
            .storage
            .from('sessions')
            .upload(path, imageFile, { cacheControl: '3600', upsert: false });

          if (error) {
            console.error('Upload error:', error);
            throw new Error('Image upload failed');
          }

          // Get public URL
          const { data: { publicUrl } } = supabase
            .storage
            .from('sessions')
            .getPublicUrl(uploadData.path);

          // Update session with image URL
          await fetch(`/api/session/${sessionData.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: publicUrl }),
          });
        }
      }

      // Reset form and close
      setFormData({
        title: '',
        description: '',
        date: new Date(),
        time: '',
        duration: 120,
        game: '',
        genre: '',
        experienceLevel: '',
        maxParticipants: 5,
        tags: [] as string[],
        imageUrl: '',
      });
      setImageFile(null);
      setImagePreview(null);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Max file size is 2 MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const checkForConflicts = async (date: Date, time: string, duration: number) => {
    if (!user?.id) return;

    try {
      const [hours, minutes] = time.split(':').map(Number);
      const sessionDate = new Date(date);
      sessionDate.setHours(hours, minutes, 0, 0);
      const sessionEnd = addMinutes(sessionDate, duration);

      const response = await fetch(`/api/session/search?dmId=${user.id}`);
      if (!response.ok) return;
      
      const sessions = await response.json();
      const conflicts = sessions.filter((s: any) => {
        const sessionStart = new Date(s.date);
        const sessionEndTime = s.duration 
          ? addMinutes(sessionStart, s.duration)
          : addMinutes(sessionStart, 120);

        return (
          (sessionStart <= sessionDate && sessionEndTime > sessionDate) ||
          (sessionStart < sessionEnd && sessionEndTime >= sessionEnd) ||
          (sessionDate <= sessionStart && sessionEnd >= sessionEndTime)
        );
      });

      if (conflicts.length > 0) {
        setConflictWarning(`Warning: This time slot overlaps with ${conflicts.length} existing session${conflicts.length > 1 ? 's' : ''}.`);
      } else {
        setConflictWarning(null);
      }
    } catch (err) {
      console.error('Error checking for conflicts:', err);
    }
  };

  const handleDateSelect = (date: Date) => {
    setFormData({ ...formData, date });
    if (formData.time) {
      checkForConflicts(date, formData.time, formData.duration);
    }
  };

  const handleTimeSelect = (time: string) => {
    setFormData({ ...formData, time });
    checkForConflicts(formData.date, time, formData.duration);
  };

  const handleDurationSelect = (duration: number) => {
    setFormData({ ...formData, duration });
    if (formData.time) {
      checkForConflicts(formData.date, formData.time, duration);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Session Schedule</label>
        <SessionCalendar
          onDateSelect={handleDateSelect}
          onTimeSelect={handleTimeSelect}
          onDurationSelect={handleDurationSelect}
          timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
          existingSessions={existingSessions}
        />
        {conflictWarning && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            {conflictWarning}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">Max Participants</label>
          <input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
            min="1"
            max="20"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">Game</label>
          <select
            value={formData.game}
            onChange={(e) => setFormData({ ...formData, game: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="">Select a game</option>
            {GAME_OPTIONS.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900">Genre</label>
          <select
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="">Select a genre</option>
            {GENRE_OPTIONS.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Experience Level</label>
        <select
          value={formData.experienceLevel}
          onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
        >
          <option value="">Select experience level</option>
          {EXPERIENCE_LEVELS.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Tags (comma separated)</label>
        <input
          type="text"
          value={formData.tags.join(', ')}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()) })}
          placeholder="e.g. roleplay, combat, exploration"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Session Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900"
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="mt-2 w-32 h-32 object-cover rounded"
          />
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create Session
        </button>
      </div>
    </form>
  );
} 