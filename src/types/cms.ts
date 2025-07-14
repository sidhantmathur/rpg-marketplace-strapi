export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiData<T> {
  id: number;
  attributes: T;
}

export interface StrapiImage {
  id: number;
  name: string;
  alternativeText?: string;
  caption?: string;
  width: number;
  height: number;
  formats?: {
    thumbnail?: {
      url: string;
      width: number;
      height: number;
    };
    small?: {
      url: string;
      width: number;
      height: number;
    };
    medium?: {
      url: string;
      width: number;
      height: number;
    };
    large?: {
      url: string;
      width: number;
      height: number;
    };
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  provider: string;
  provider_metadata?: any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HeroBanner {
  id: number;
  Title: string;
  Subtitle?: string;
  Description?: string;
  ButtonText?: string;
  ButtonLink?: string;
  Image?: StrapiImage;
  IsActive: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface EventBanner {
  id: number;
  Title: string;
  Subtitle?: string;
  Description?: string;
  ButtonText?: string;
  ButtonLink?: string;
  Image?: StrapiImage;
  IsActive: boolean;
  StartDate: string;
  EndDate?: string;
  Location?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface BlogPost {
  id: number;
  Title: string;
  Slug: string;
  Excerpt?: string;
  Content: any;
  Author?: string;
  Image?: StrapiImage;
  Tags?: string[];
  PublishDate?: string;
  IsPublished?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HeroBannerResponse {
  data: HeroBanner;
  meta: any;
}
export interface EventBannerResponse {
  data: EventBanner;
  meta: any;
}
export interface BlogPostResponse {
  data: BlogPost[];
  meta: any;
} 