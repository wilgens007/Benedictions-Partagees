# Bénédictions Partagées

## Overview

A Christian gospel podcast mobile web application offering worship music, gospel teachings, daily Bible verses, and prayer requests. The app supports multiple languages (English, French, and Haitian Creole) and features a serene, faith-centered design inspired by apps like Calm, Spotify, and YouVersion Bible App.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and data fetching
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Build System**: esbuild for server bundling, Vite for client bundling
- **Development**: tsx for TypeScript execution with hot module replacement via Vite

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains database tables and Zod validation schemas
- **Current Storage**: In-memory storage implementation in `server/storage.ts` with interface ready for database migration

### Key Design Patterns
- **Shared Types**: TypeScript types and schemas in `shared/` directory are used by both client and server
- **Path Aliases**: `@/` for client source, `@shared/` for shared code, `@assets/` for attached assets
- **Context Providers**: Theme and Language contexts wrap the application for global state
- **Internationalization**: Translation system with support for English, French, and Haitian Creole

### Application Features
- **Home**: Daily verse display with encouragement messages
- **Music**: Audio player with track listing and playback controls
- **Videos**: Categorized video content with modal playback
- **Devotion**: Daily devotional content with scripture, reflection, and prayer
- **Prayer**: Prayer request submission form

## External Dependencies

### Database
- PostgreSQL (configured via `DATABASE_URL` environment variable)
- Drizzle Kit for migrations (`npm run db:push`)

### UI Framework Dependencies
- Radix UI primitives for accessible component foundations
- Embla Carousel for carousel functionality
- Vaul for drawer components
- React Day Picker for calendar components

### Development Tools
- Replit-specific Vite plugins for development experience (cartographer, dev-banner, runtime-error-modal)

### Fonts
- Google Fonts: DM Sans, Lora, Geist Mono, Fira Code, Architects Daughter