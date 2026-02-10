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

### Push Notifications
- **Service Worker**: `client/public/sw.js` — handles push events, shows notifications
- **Client Library**: `client/src/lib/pushNotifications.ts` — subscribe/unsubscribe/check status helpers
- **Server**: `server/pushService.ts` — sends push notifications via web-push library
- **DB Table**: `push_subscriptions` — stores push subscription endpoints with language preference
- **VAPID Keys**: `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` environment variables
- **Auto-trigger**: Push notifications sent automatically after daily content generation

### Social Sharing
- **Endpoint**: `GET /api/share/today?language=en` — returns WhatsApp/Facebook share URLs and caption
- **Components**: WhatsApp and Facebook share buttons on Devotion page
- **Optional Facebook Auto-Post**: Gated by `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` env vars

### Support/Donation System
- **Pages**: `/support` (donation page) and `/support/thank-you` (thank you page)
- **Config Endpoint**: `GET /api/support/config` — returns donation link configuration
- **DB Table**: `support_config` — key-value store for Stripe links, CashApp, PayPal, Zelle handles
- **Stage 2 (pending)**: Stripe payment link integration when user provides links

### Global Audio Player
- **Context**: `client/src/lib/AudioPlayerContext.tsx` — persistent Audio() instance that survives route changes
- **State**: currentTrack, playlist, isPlaying, currentTime, duration, volume — all managed globally
- **Actions**: playTrack, play, pause, toggle, seek, setVolume, next, prev, setPlaylist
- **Media Session API**: Lock screen controls for Android/Chrome (play, pause, next, prev, seekto)
- **MiniPlayer**: `client/src/components/MiniPlayer.tsx` — fixed mini-player above bottom nav with progress bar, track info, and controls
- **Design**: Audio() created programmatically (not DOM element) to guarantee persistence independent of React rendering

### Application Features
- **Home**: Daily verse display with encouragement messages
- **Music**: Full audio player with track listing, playback controls, volume — uses global AudioPlayerContext
- **Videos**: Categorized video content with modal playback
- **Devotion**: Daily devotional with scripture, reflection, prayer, push notification toggle, and social sharing (WhatsApp/Facebook)
- **Prayer**: Prayer request submission form
- **Support**: Donation page with configurable payment links and "coming soon" fallback
- **Navigation**: 5-tab bottom nav (Home, Music, Devotion, Prayer, Support)

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