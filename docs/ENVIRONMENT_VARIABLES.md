# Environment Variables

This document outlines all the environment variables required for the RPG Marketplace project.

## Required Variables

### Database
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/rpg_marketplace"
```

### Supabase (Authentication)
```bash
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### Email (Resend)
```bash
RESEND_API_KEY="your-resend-api-key"
```

### Strapi CMS
```bash
NEXT_PUBLIC_STRAPI_URL="https://rpg-marketplace-strapi-a61fd07467.strapiapp.com"
STRAPI_API_TOKEN="your-strapi-api-token"
```

### Site URL
```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Optional Variables

### Stripe (for future payments)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
```

## Setup Instructions

1. Copy the required variables to your `.env.local` file
2. Replace the placeholder values with your actual credentials
3. For Strapi CMS:
   - Get the URL from your Strapi Cloud deployment
   - Generate an API token in the Strapi admin panel under Settings > API Tokens

## Strapi CMS Integration

The project uses Strapi as a headless CMS for managing:
- Hero banners
- Event banners  
- Blog posts

To fetch content from Strapi, use the `NEXT_PUBLIC_STRAPI_URL` environment variable in your API calls.

Example usage:
```javascript
const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/heroes`);
const data = await response.json();
``` 