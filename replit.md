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
- **DB Connection**: `server/db.ts` — Drizzle + pg pool using `DATABASE_URL`
- **Daily Content Persistence**: `daily_content` table with composite unique index on `(day_key, language)` — stores daily verse, devotional, prayer, and encouragement per language per day
- **In-Memory**: Prayer requests and user data still use in-memory storage in `server/storage.ts`

### Daily Content Generation System
- **Generator**: `server/dailyContentGenerator.ts` — computes Eastern Time dayKey (YYYY-MM-DD), selects verse/encouragement by day-of-year index from static data arrays, inserts to DB (idempotent via unique constraint)
- **Secure Endpoint**: `POST /api/devotion/generate` — protected by `X-CRON-SECRET` header, returns `created` or `already_exists`
- **Primary Scheduler**: GitHub Actions external cron (`.github/workflows/daily-devotion-cron.yml`) — runs at both 10:00 UTC and 11:00 UTC to cover EST/EDT, idempotent
- **Backup Scheduler**: node-cron in `server/index.ts` — runs at 6:00 AM America/New_York daily
- **Startup Fallback**: On server boot, checks if today's content exists in DB; generates if missing
- **Environment Variable**: `CRON_SECRET` — shared secret for authenticating the generation endpoint

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