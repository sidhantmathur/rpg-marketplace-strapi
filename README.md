# Adarle 20

A modern platform for connecting Dungeon Masters with players for tabletop role-playing game sessions.

## 🚀 Current Status

The platform is in active development with core features implemented. We're working towards a complete MVP by the end of Month 1.

### ✅ Implemented Features

- Basic marketplace structure
- Session search and filtering
- Categories and tags system
- Basic booking system
- Email notifications
- Basic review system

### 🚧 In Development

- Session scheduling and capacity management
- Payment integration
- User profiles and dashboards
- Mobile responsiveness
- Enhanced DM profiles

## Project Overview

This marketplace allows:

- Players to discover and book RPG sessions
- Game Masters to host and manage sessions
- Community building through reviews and forums
- Session management with scheduling and payment processing

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase
- **Email**: Resend
- **CMS**: Strapi (Headless CMS for content management)
- **Payments**: Coming soon

## Project Structure

```
rpg-marketplace/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication routes
│   ├── (dashboard)/      # User dashboard routes
│   └── (marketplace)/    # Marketplace routes
├── components/            # Reusable React components
├── lib/                   # Utility functions and shared code
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

**Note**: This project uses a separate Strapi CMS repository for content management. See the [Content Management](#-content-management-strapi-cms) section below.

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Set up Strapi CMS integration (see [Content Management](#-content-management-strapi-cms) section)
5. Run the development server:
   ```bash
   npm run dev
   ```

## 📅 Development Timeline

- **Month 1**: MVP Development (Current)
- **Month 2**: Feature Enhancement
- **Month 3**: Polish and Scale

## 📝 Content Management (Strapi CMS)

This project uses [Strapi](https://strapi.io/) as a headless CMS for managing homepage hero banners, event banners, and blog content.

- The Strapi CMS is maintained in a **separate repository**: [`rpg-marketplace-strapi`](https://github.com/sidhantmathur/rpg-marketplace-strapi)
- Content editors and admins can log in to the Strapi Cloud admin panel to manage content
- The Next.js frontend fetches published content from Strapi via its REST API

### Integration

- The frontend uses environment variables to connect to the Strapi API (see `.env.example`)
- Example usage:
  - Hero section, event banners, and blog posts are fetched from Strapi endpoints
- For local development, run Strapi locally or use the Strapi Cloud URL

### Useful Links

- [Strapi Cloud Admin Panel](https://rpg-marketplace-strapi-a61fd07467.strapiapp.com/admin)
- [Strapi API Documentation](https://docs.strapi.io/dev-docs/api/rest)
- [Strapi CMS Repository](https://github.com/sidhantmathur/rpg-marketplace-strapi)

## Key Features

### MVP Features (Month 1)

- Session booking system
- Basic user profiles
- Session management
- Mobile responsiveness
- Essential notifications
- Basic analytics
- Core community features

### 🎯 Upcoming Features

- Community forums
- In-app messaging
- Advanced analytics
- Internationalization support
- Progressive Web App capabilities
- Advanced mobile features
- Enhanced chat functionality
- Multi-language support
- Regional pricing

## 🤝 Contributing

Currently, this is a private project. We'll open up contributions once we reach a stable release.

## Project Status

Currently in Month 1 of development, working towards MVP completion. See TODO.md for detailed progress and upcoming features.

## Support

For support, please open an issue in the repository or contact the development team.

## 📄 License

Private - All rights reserved
