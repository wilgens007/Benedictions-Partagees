# Bénédictions Partagées

## Overview

Bénédictions Partagées is a Christian gospel podcast mobile web application designed to offer worship music, gospel teachings, daily Bible verses, and prayer requests. It supports multiple languages (English, French, Haitian Creole) and features a serene, faith-centered design inspired by applications like Calm, Spotify, and YouVersion. The project aims to provide a rich spiritual experience through a modern, accessible digital platform, reaching a broad audience with its multi-language support and comprehensive content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite)
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with CSS variables for themable light/dark modes
- **UI Components**: shadcn/ui on Radix UI primitives
- **Form Handling**: React Hook Form with Zod
- **Error Handling**: Global `ErrorBoundary` and `window.onerror`/`onunhandledrejection` handlers.

### Backend
- **Runtime**: Node.js with Express.js
- **API**: RESTful endpoints
- **Build**: esbuild for server, Vite for client
- **Development**: tsx for TypeScript with HMR

### Data Layer
- **ORM**: Drizzle ORM (PostgreSQL)
- **Schema**: `shared/schema.ts` for database tables and Zod validation.
- **Daily Content**: Idempotent persistence of daily verses, devotionals, prayers, and encouragement per language.
- **In-Memory Storage**: Used for prayer requests and user data.

### Daily Content Generation
- Automated generation of daily content (verse, devotional, etc.) based on day-of-year.
- **Scheduling**: GitHub Actions cron, node-cron (6 AM ET), and server startup fallback ensure content availability.
- **Push Notification Dedup**: Uses a `_ps` sentinel row in `daily_content` table (keyed by day) to prevent duplicate push notifications across server restarts. Both the 6 AM cron and startup fallback check this marker before sending.
- **Security**: `X-CRON-SECRET` for endpoint protection.

### Premium Subscriptions (Stripe & Google Play)
- **Features**: `isPremium` status, `premiumSource`, expiry, and integration with Stripe and Google Play Billing.
- **Stripe**: `stripe-replit-sync` for schema management, secure client, webhook handling, and product seeding.
- **Google Play**: Verification of purchase tokens via Google Play Developer API.
- **User Interface**: Pricing page dynamically displays Stripe or Google Play options; Dashboard shows subscription status.

### User Authentication
- **Methods**: Registration, login, logout, user profile.
- **Security**: bcrypt for password hashing, session tokens via `user_sessions` table, httpOnly cookie-based auth.
- **Access Control**: `requireUser`, `optionalUser`, `requirePremium` middlewares.

### Saved Verses System
- **Functionality**: Users can save verses with a limit for free users (20) and unlimited for premium users.
- **Persistence**: `saved_verses` table with unique constraint.
- **API**: CRUD operations for saved verses, enforcing limits.

### Media Storage
- **Images**: Cover images stored as base64 in PostgreSQL (`media` table).
- **Audio**: Audio files stored on disk (`uploads/`) as they are often referenced by external URLs (e.g., Suno AI CDN).
- **Serving**: `GET /api/media/:id` for stored media.

### Music & Featured Song
- **Features**: Early access music gating for premium users, `release_date`, `playsCount`, `isFeatured`, `featuredRank`.
- **Content Sources**: Combines database-managed songs with in-memory static songs.
- **Featured**: Dedicated endpoint for featured songs.

### Netflix-Style Music Browsing
- **Categorization**: Genres and moods (e.g., Kompa Gospel, Peace/Lapè) with junction tables (`song_genres`, `song_moods`).
- **Discovery**: Endpoints for genres, moods, trending music, and play tracking.
- **Filtering**: `GET /api/music` supports filtering by genre, mood, search query, sort order, and limit.
- **UI**: Horizontal scroll rows for curated content (Featured Today, New Releases, Trending), chip bars for genres/moods, search, and sort.

### Key Design Patterns
- **Shared Code**: TypeScript types and schemas used by both client and server.
- **Path Aliases**: `@/`, `@shared/`, `@assets/`.
- **Context Providers**: Theme, Language, Auth for global state.
- **Internationalization**: Support for English, French, Haitian Creole.
- **Code Splitting**: React.lazy() + Suspense for improved loading.

### Startup Performance
- **Database Pooling**: Limited connections for PostgreSQL and Stripe sync.
- **Deferred Initialization**: StripeSync and other non-critical services initialized after core startup to avoid memory spikes.

### Push Notifications
- **Technology**: Service Worker for handling push events.
- **Management**: Client-side library for subscription, server-side for sending (`sendPushToAll`, `sendNotificationByType`).
- **Persistence**: `push_subscriptions` table stores endpoints and language preferences.
- **Automation**: Automatic notifications for daily content and new songs.
- **Admin**: Interface for composing and sending custom notifications.
- **Localization**: Notifications sent in the user's preferred language.

### Social Sharing
- **Functionality**: Generates WhatsApp/Facebook share URLs and captions for daily devotionals.
- **Integration**: Share buttons on the Devotion page.
- **Optional Feature**: Gated Facebook auto-posting for daily content.

### Support/Donation System
- **Pages**: `/support` for donations, `/support/thank-you`.
- **Configuration**: `support_config` table stores links for various payment platforms (Stripe, CashApp, PayPal, Zelle).

### Custom Playlists (Premium)
- **Functionality**: Premium users can create, manage, and share public playlists.
- **Limits**: Max 20 playlists per user, 100 songs per playlist.
- **Access Control**: `requirePremium` middleware for CRUD operations; public playlists are viewable by all.
- **UI**: Integrated playlist management within the Music section.

### Global Audio Player
- **Persistence**: `AudioPlayerContext` manages a persistent Audio() instance across route changes.
- **State**: Centralized control of `currentTrack`, `playlist`, `isPlaying`, `volume`, etc.
- **Controls**: `playTrack`, `pause`, `seek`, `next`, `prev` actions.
- **Media Session API**: Integration for lock screen controls on mobile.
- **MiniPlayer**: Fixed mini-player UI component.

### Static/Legal Pages
- **Content**: About, Privacy Policy, and Terms of Use pages.
- **Accessibility**: Linked in the Home page footer.

### Application Features
- **Core Tabs**: Home (daily verse), Music (audio player), Videos, Devotion (daily content, sharing), Prayer (request form), Support (donations).
- **Navigation**: 6-tab bottom navigation for primary features.

## External Dependencies

### Database
- PostgreSQL

### UI Framework Dependencies
- Radix UI
- Embla Carousel
- Vaul
- React Day Picker

### Development Tools
- Replit-specific Vite plugins (cartographer, dev-banner, runtime-error-modal)

### Fonts
- Google Fonts: DM Sans, Lora, Geist Mono, Fira Code, Architects Daughter