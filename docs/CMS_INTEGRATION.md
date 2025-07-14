# CMS Integration Guide

This document explains how to set up and use the Strapi CMS integration for managing hero banners, event banners, and blog content.

## Overview

The RPG Marketplace uses Strapi as a headless CMS to manage:
- **Hero Banners**: Featured content displayed at the top of the homepage
- **Event Banners**: Upcoming events and announcements
- **Blog Posts**: Community content and articles

## Setup

### Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Strapi CMS Configuration
NEXT_PUBLIC_STRAPI_URL="https://rpg-marketplace-strapi-a61fd07467.strapiapp.com"
STRAPI_API_TOKEN="your-strapi-api-token"
```

### Getting Your API Token

1. Log in to your Strapi admin panel
2. Go to Settings → API Tokens
3. Create a new token with appropriate permissions
4. Copy the token to your environment variables

## Content Types

### Hero Banner

**Fields:**
- `title` (Text): Main headline
- `subtitle` (Text, optional): Secondary headline
- `description` (Text, optional): Description text
- `ctaText` (Text, optional): Call-to-action button text
- `ctaLink` (Text, optional): Call-to-action button URL
- `image` (Media, optional): Hero background image
- `active` (Boolean): Whether to display this banner

**Usage:**
- Only one active hero banner will be displayed
- If no active banner exists, the hero section will be hidden

### Event Banner

**Fields:**
- `title` (Text): Event title
- `description` (Text, optional): Event description
- `startDate` (Date): Event start date
- `endDate` (Date, optional): Event end date
- `location` (Text, optional): Event location
- `ctaText` (Text, optional): Call-to-action button text
- `ctaLink` (Text, optional): Call-to-action button URL
- `image` (Media, optional): Event image
- `active` (Boolean): Whether to display this event

**Usage:**
- Up to 3 active events will be displayed on the homepage
- Events are sorted by creation date (newest first)

### Blog Post

**Fields:**
- `title` (Text): Post title
- `slug` (Text): URL-friendly identifier (auto-generated from title)
- `excerpt` (Text, optional): Short description
- `content` (Rich Text): Main content
- `author` (Text, optional): Author name
- `featuredImage` (Media, optional): Featured image
- `tags` (JSON, optional): Array of tags
- `publishedAt` (Date): Publication date

**Usage:**
- Blog posts are displayed on `/blog` page
- Individual posts are accessible at `/blog/[slug]`
- Latest 3 posts are shown on the homepage

## API Endpoints

### Hero Banner
```
GET /api/cms/hero
```

### Events
```
GET /api/cms/events
```

### Blog Posts
```
GET /api/cms/blog?page=1&limit=6
GET /api/cms/blog?slug=post-slug
```

## Components

### HeroBanner
Displays the active hero banner on the homepage.

```tsx
import HeroBanner from "@/components/cms/HeroBanner";

<HeroBanner />
```

### EventBanner
Displays up to 3 active events on the homepage.

```tsx
import EventBanner from "@/components/cms/EventBanner";

<EventBanner />
```

### BlogPreview
Displays the latest 3 blog posts on the homepage.

```tsx
import BlogPreview from "@/components/cms/BlogPreview";

<BlogPreview />
```

## Pages

### Blog Listing Page
- **Route**: `/blog`
- **File**: `src/app/blog/page.tsx`
- **Features**: Pagination, responsive grid layout

### Individual Blog Post
- **Route**: `/blog/[slug]`
- **File**: `src/app/blog/[slug]/page.tsx`
- **Features**: Full post display, back navigation

## Styling

All CMS components use the existing fantasy theme CSS variables:
- `--parchment`: Background color
- `--ink`: Text color
- `--forest`: Primary accent color
- `--amber`: Secondary accent color

## Error Handling

Components gracefully handle:
- Missing CMS configuration
- Network errors
- Empty content
- Invalid data

If content fails to load, components will not render anything rather than showing error states.

## Caching

API routes include 5-minute caching to improve performance:
```typescript
next: { revalidate: 300 }
```

## Image Optimization

Images from Strapi are optimized using Next.js Image component:
- Automatic format optimization
- Responsive sizing
- Lazy loading
- Proper alt text support

## Troubleshooting

### Common Issues

1. **Images not loading**
   - Check that `NEXT_PUBLIC_STRAPI_URL` is correct
   - Verify image domains are added to `next.config.ts`

2. **Content not appearing**
   - Ensure content is published in Strapi
   - Check that `active` field is set to true
   - Verify API token has correct permissions

3. **API errors**
   - Check environment variables are set
   - Verify Strapi URL is accessible
   - Ensure API token is valid

### Debug Mode

Enable debug logging by checking browser console for:
- `[CMS] Successfully fetched hero data`
- `[CMS] Successfully fetched events data`
- `[CMS] Successfully fetched blog data`

## Future Enhancements

- Content scheduling
- Multi-language support
- Advanced filtering and search
- Content versioning
- SEO optimization
- Social media integration 