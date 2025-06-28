"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { Session } from "@prisma/client";
import SessionCalendar from "./SessionCalendar";
import { addMinutes } from "date-fns";
import Image from "next/image";

const GAME_OPTIONS = [
  "D&D 5e",
  "Pathfinder",
  "Call of Cthulhu",
  "Starfinder",
  "Shadowrun",
  "Cyberpunk Red",
  "Vampire: The Masquerade",
  "Other",
];

const GENRE_OPTIONS = [
  "Fantasy",
  "Horror",
  "Sci-Fi",
  "Modern",
  "Historical",
  "Post-Apocalyptic",
  "Superhero",
  "Other",
];

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];

interface CreateSessionFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
  session?: Session & {
    tags: { name: string }[];
  };
}

interface FormData {
  title: string;
  description: string;
  date: Date;
  time: string;
  duration: number;
  game: string;
  genre: string;
  experienceLevel: string;
  maxParticipants: number;
  tags: string[];
  imageUrl: string;
}

interface UploadResponse {
  data: {
    path: string;
  };
  error: Error | null;
}

interface SessionResponse {
  id: string;
  date: string;
  title: string;
  description: string;
  duration: number;
  game: string;
  genre: string;
  experienceLevel: string;
  maxParticipants: number;
  tags: { name: string }[];
  imageUrl: string;
}

interface ApiErrorResponse {
  error: string;
}

type ApiResponse = ApiErrorResponse | Session[];

function isErrorResponse(response: unknown): response is ApiErrorResponse {
  return typeof response === "object" && response !== null && "error" in response;
}

function isSessionsResponse(response: unknown): response is Session[] {
  return Array.isArray(response) && response.every(
    (item) => typeof item === "object" && item !== null && "id" in item && "date" in item && "duration" in item
  );
}

export default function CreateSessionForm({
  onCancel,
  onSuccess,
  session,
}: CreateSessionFormProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState<FormData>({
    title: session?.title || "",
    description: session?.description || "",
    date: session?.date ? new Date(session.date) : new Date(),
    time: session?.date ? new Date(session.date).toISOString().split("T")[1].slice(0, 5) : "",
    duration: session?.duration || 120,
    game: session?.game || "",
    genre: session?.genre || "",
    experienceLevel: session?.experienceLevel || "",
    maxParticipants: session?.maxParticipants || 5,
    tags: session?.tags?.map((tag) => tag.name) || [],
    imageUrl: session?.imageUrl || "",
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
      if (!user) {
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[CreateSessionForm] Session error:", sessionError);
          throw new Error("Failed to get session");
        }

        if (!session?.access_token) {
          console.error("[CreateSessionForm] No access token in session");
          throw new Error("No access token in session");
        }

        const response = await fetch(`/api/user-sessions/${user.id}`);
        const responseData = await response.json() as ApiResponse;

        if (!response.ok || isErrorResponse(responseData)) {
          console.error("[CreateSessionForm] API error:", responseData);
          throw new Error(isErrorResponse(responseData) ? responseData.error : "Failed to fetch sessions");
        }

        if (!isSessionsResponse(responseData)) {
          throw new Error("Invalid response format");
        }

        setExistingSessions(responseData.map((s) => new Date(s.date)));
      } catch (err) {
        console.error("[CreateSessionForm] Error fetching sessions:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      }
    };

    void fetchExistingSessions();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (session) {
        // Update existing session
        const response = await fetch(`/api/session/${session.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            date: new Date(
              `${formData.date.toISOString().split("T")[0]}T${formData.time}`
            ).toISOString(),
            duration: parseInt(formData.duration.toString()),
            game: formData.game,
            genre: formData.genre,
            experienceLevel: formData.experienceLevel,
            maxParticipants: parseInt(formData.maxParticipants.toString()),
            tags: formData.tags,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update session");
        }

        // If there's a new image, upload it
        if (imageFile) {
          const path = `${user?.id}/session/${session.id}/${Date.now()}-${imageFile.name}`;

          const { data: uploadData, error: uploadError } = (await supabase.storage
            .from("sessions")
            .upload(path, imageFile, { cacheControl: "3600", upsert: false })) as UploadResponse;

          if (uploadError) {
            console.error("Upload error:", uploadError);
            throw new Error("Image upload failed");
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("sessions").getPublicUrl(uploadData.path);

          // Update session with new image URL
          const updateResponse = await fetch(`/api/session/${session.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl: publicUrl }),
          });

          if (!updateResponse.ok) {
            throw new Error("Failed to update session image");
          }
        }
      } else {
        // Create new session
        const sessionResponse = await fetch("/api/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            date: new Date(
              `${formData.date.toISOString().split("T")[0]}T${formData.time}`
            ).toISOString(),
            duration: parseInt(formData.duration.toString()),
            maxParticipants: parseInt(formData.maxParticipants.toString()),
            tags: formData.tags,
            userId: user?.id,
          }),
        });

        if (!sessionResponse.ok) {
          throw new Error("Failed to create session");
        }

        const sessionData = (await sessionResponse.json()) as SessionResponse;

        // If there's an image, upload it
        if (imageFile) {
          const path = `${user?.id}/session/${sessionData.id}/${Date.now()}-${imageFile.name}`;

          const { data: uploadData, error: uploadError } = (await supabase.storage
            .from("sessions")
            .upload(path, imageFile, { cacheControl: "3600", upsert: false })) as UploadResponse;

          if (uploadError) {
            console.error("Upload error:", uploadError);
            throw new Error("Image upload failed");
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("sessions").getPublicUrl(uploadData.path);

          // Update session with image URL
          const updateResponse = await fetch(`/api/session/${sessionData.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl: publicUrl }),
          });

          if (!updateResponse.ok) {
            throw new Error("Failed to update session image");
          }
        }
      }

      // Reset form and close
      setFormData({
        title: "",
        description: "",
        date: new Date(),
        time: "",
        duration: 120,
        game: "",
        genre: "",
        experienceLevel: "",
        maxParticipants: 5,
        tags: [],
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview(null);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Max file size is 2 MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const checkForConflicts = async (
    date: Date,
    time: string,
    duration: number,
    _sessionId?: string
  ): Promise<boolean> => {
    try {
      const sessionDateTime = new Date(`${date.toISOString().split("T")[0]}T${time}`);
      const sessionEndTime = addMinutes(sessionDateTime, duration);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("[CreateSessionForm] Session error:", sessionError);
        throw new Error("Failed to get session");
      }

      if (!session?.access_token) {
        console.error("[CreateSessionForm] No access token in session");
        throw new Error("No access token in session");
      }

      const response = await fetch(
        `/api/sessions?startDate=${date.toISOString()}&endDate=${sessionEndTime.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error("[CreateSessionForm] Conflict check error:", responseData);
        if (isErrorResponse(responseData)) {
          throw new Error(responseData.error);
        }
        throw new Error("Failed to check for conflicts");
      }

      if (!isSessionsResponse(responseData)) {
        throw new Error("Invalid response format");
      }

      const sessions = responseData;
      const hasConflicts = sessions.some((session) => {
        if (typeof session.duration !== "number") return false;
        const sessionDate = new Date(session.date);
        const sessionEndTime = addMinutes(sessionDate, session.duration);

        return (
          (sessionDateTime >= sessionDate && sessionDateTime < sessionEndTime) ||
          (sessionEndTime > sessionDate && sessionEndTime <= sessionEndTime) ||
          (sessionDateTime <= sessionDate && sessionEndTime >= sessionEndTime)
        );
      });

      if (hasConflicts) {
        setConflictWarning(
          "This session time conflicts with another session. Please choose a different time."
        );
      } else {
        setConflictWarning(null);
      }

      return hasConflicts;
    } catch (err) {
      console.error("[CreateSessionForm] Error checking for conflicts:", err);
      setError(err instanceof Error ? err.message : "Failed to check for conflicts");
      return false;
    }
  };

  const handleDateSelect = async (date: Date) => {
    setFormData({ ...formData, date });
    if (formData.time) {
      await checkForConflicts(date, formData.time, formData.duration);
    }
  };

  const handleTimeSelect = async (time: string) => {
    setFormData({ ...formData, time });
    await checkForConflicts(formData.date, time, formData.duration);
  };

  const handleDurationSelect = async (duration: number) => {
    setFormData({ ...formData, duration });
    if (formData.time) {
      await checkForConflicts(formData.date, formData.time, duration);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-secondary">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Session Schedule</label>
        <SessionCalendar
          onDateSelect={(date) => void handleDateSelect(date)}
          onTimeSelect={(time) => void handleTimeSelect(time)}
          onDurationSelect={(duration) => void handleDurationSelect(duration)}
          timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
          existingSessions={existingSessions}
        />
        {conflictWarning && (
          <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded text-warning">
            {conflictWarning}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary">Max Participants</label>
          <input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxParticipants: parseInt(e.target.value),
              })
            }
            min="1"
            max="20"
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary">Game</label>
          <select
            value={formData.game}
            onChange={(e) => setFormData({ ...formData, game: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
          >
            <option value="">Select a game</option>
            {GAME_OPTIONS.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary">Genre</label>
          <select
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
          >
            <option value="">Select a genre</option>
            {GENRE_OPTIONS.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary">Experience Level</label>
        <select
          value={formData.experienceLevel}
          onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
        >
          <option value="">Select experience level</option>
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary">Tags (comma separated)</label>
        <input
          type="text"
          value={formData.tags.join(", ")}
          onChange={(e) =>
            setFormData({
              ...formData,
              tags: e.target.value.split(",").map((tag) => tag.trim()),
            })
          }
          placeholder="e.g. roleplay, combat, exploration"
          className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary">Session Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-ring focus:ring-ring text-primary bg-input"
        />
        {imagePreview && (
          <div className="mt-2 relative w-full h-64 overflow-hidden rounded-lg">
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              quality={100}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-card border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Processing..." : session ? "Update Session" : "Create Session"}
        </button>
      </div>
      {error && (
        <div className="mt-4 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive">
          {error}
        </div>
      )}
    </form>
  );
}
