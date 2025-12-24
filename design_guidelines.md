# Design Guidelines: Bénédictions Partagées Mobile App

## Design Approach

**Reference-Based Approach** drawing from:
- **Calm/Headspace**: Peaceful aesthetics, breathing room, gentle animations
- **Spotify**: Audio player patterns, list organization
- **Bible App (YouVersion)**: Scripture presentation, devotional layouts
- **Instagram**: Clean cards, visual hierarchy for media content

**Core Principles:**
- Serene and contemplative atmosphere
- Generous whitespace for reflection
- Scripture-centered visual hierarchy
- Warm, welcoming feel without overwhelming decoration

---

## Typography

**Primary Font**: Lora or Crimson Text (serif) via Google Fonts
- Headers: 28sp (Bold)
- Subheaders: 20sp (Semibold)
- Body text: 16sp (Regular)
- Captions: 14sp (Regular)

**Secondary Font**: Inter or Source Sans Pro (sans-serif)
- UI elements, buttons, labels: 14-16sp (Medium)
- Navigation: 12sp (Semibold, uppercase)

**Scripture Quotes**: Italic treatment with 18sp for emphasis

---

## Layout & Spacing

**Consistent Spacing Units**: 4, 8, 16, 24, 32, 48
- Screen padding: 16-24
- Card padding: 16
- Section spacing: 32-48
- Element gaps: 8-16

**Safe Area**: Respect device notches and bottom navigation areas

**Cards**: Rounded corners (radius: 12), subtle elevation for depth

---

## Component Library

### Navigation
- Bottom tab bar with 5 icons (Home, Music, Video, Devotion, Prayer)
- Simple icons with labels
- Active state: filled icon + accent underline

### Home Screen
- Hero section with gradient overlay and today's verse (40% screen height)
- Encouragement card with soft background
- Quick action buttons in 2-column grid

### Audio Player
- Album art display (square, centered)
- Prominent play/pause button (64sp)
- Progress bar with timestamp
- Track title + artist (centered below art)
- Playlist below player (scrollable list)

### Video Screen
- Full-width video player (16:9 ratio)
- Category tabs for filtering
- Thumbnail grid (2 columns) with titles overlay

### Daily Verse Card
- Large serif quote text (center-aligned)
- Book/chapter reference (smaller, below)
- Devotional text in readable width (max 90% screen)
- Share icon (top-right corner)

### Prayer Request Form
- Text input with label above
- Multi-line text area (6 rows minimum)
- Submit button (full-width, rounded)
- Success confirmation modal with gentle animation

### Language Switcher
- Dropdown in settings or profile
- Flag icons + language names

---

## Images & Visual Elements

### Hero Image (Home Screen)
- Peaceful nature imagery: sunrise/sunset, calm waters, mountains, open sky
- Gradient overlay (dark to transparent) for text legibility
- Verse text overlaid in white with soft shadow

### Music Screen
- Album artwork placeholders (abstract worship themes, soft gradients)
- Background: subtle texture or light gradient

### Video Thumbnails
- YouTube video thumbnails maintained
- Play icon overlay (centered, semi-transparent white circle)

### Devotional Screen
- Minimal decorative elements: simple line dividers, small cross or dove icons
- Background: very light texture or soft gradient

**Image Placement:**
- Home hero: Top 40% of screen
- Music: Square album art, centered above player controls
- Videos: 16:9 thumbnails in grid
- Daily verse: Optional small decorative element (flourish) below verse

---

## Animations

**Minimal and Purposeful:**
- Smooth page transitions (slide horizontal)
- Audio player controls: gentle scale on press
- Prayer submission: fade-in success message
- Verse change: subtle fade transition daily
- No auto-playing or looping animations

---

## Accessibility

- Minimum touch targets: 44x44 points
- High contrast text on all backgrounds
- Text scaling support
- Screen reader labels for all interactive elements
- Audio controls accessible without vision

---

## Multi-Language Considerations

- All UI text externalized for translation
- Accommodate longer French text (15-20% more space than English)
- Right-to-left not required, but flexible layouts
- Font supports French accents and Creole characters