export interface Profile {
  id: string;
  email: string;
  roles: string[];
  createdAt: string;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
}
