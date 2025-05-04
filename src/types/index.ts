export interface Profile {
  id: string;
  email: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  ratingAvg: number;
  ratingCount: number;
}
