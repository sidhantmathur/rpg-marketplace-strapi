export interface Profile {
  id: string;
  email: string;
  roles: string[];
  createdAt: string;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  description?: string | null;
  bio?: string | null;
  sessionStats?: {
    total: number;
    active: number;
    completed: number;
    upcoming: number;
  };
  preferences?: {
    games: Record<string, number>;
    genres: Record<string, number>;
    experienceLevels: Record<string, number>;
    tags: string[];
  };
}

export type ProfileWithDate = Omit<Profile, 'createdAt'> & {
  createdAt: Date;
};
