# System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                  Browser (Vite)                 │
├─────────────────────────────────────────────────┤
│                    React App                    │
│  ┌──────────────────────────────────────────┐  │
│  │           App.tsx (Root)                 │  │
│  │  - State Management                      │  │
│  │  - Event Data Loading                    │  │
│  │  - Current Event Detection               │  │
│  │  - Mobile View Mode                      │  │
│  └──────────────────────────────────────────┘  │
│           │              │              │       │
│      ┌────▼────┐    ┌───▼────┐    ┌──▼──┐    │
│      │ Header  │    │Timeline │    │Detail
│      │         │    │ Panel   │    │Panel │    │
│      └─────────┘    └─────────┘    └──────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │      Global Styles (index.css)          │   │
│  │  - Theme Variables                      │   │
│  │  - Responsive Utilities                 │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│           Static Assets (public/)               │
│  - events-data.json (Event Data)               │
│  - images/ (Event Images)                       │
└─────────────────────────────────────────────────┘
```

## 📦 Component Architecture

### App.tsx (Root Component)
**Responsibilities:**
- Load event data from JSON
- Manage global state (selectedEvent, currentEvent, viewMode)
- Calculate current event based on device time
- Route event selection to Timeline/DetailPanel
- Handle mobile tab navigation

**Key Functions:**
- `findCurrentEvent()` - Detects which event is currently happening
- `timeToMinutes()` - Converts time strings to minutes
- `handleSelectEvent()` - Handles user selection with mobile view switch

**State:**
```typescript
const [events, setEvents] = useState<Event[]>([]);           // All events
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);  // User selection
const [currentEvent, setCurrentEvent] = useState<Event | null>(null);    // Now playing
const [loading, setLoading] = useState(true);                // Loading state
const [viewMode, setViewMode] = useState<'timeline' | 'detail'>('timeline');  // Mobile tab
```

### Header.tsx (Navigation Bar)
**Responsibilities:**
- Display real-time clock and date
- Show trip title and location
- Provide navigation context

**Key Features:**
- Device locale time formatting
- Responsive height (h-16 mobile, h-20 desktop)
- Contains "mlace" branding under location
- Fixed position at top

**Props:** None (uses global context implicitly)

### Timeline.tsx (Event List)
**Responsibilities:**
- Display all events grouped by date
- Highlight past events (opacity-45)
- Show current event with blue background (bg-cyan-500/50)
- Auto-scroll to current event on mount
- Provide event selection interface

**Key Features:**
- Groups events by date
- Auto-selects suitable icons based on event title
- Shows "Đang diễn ra" badge for current event
- Memoized event grouping
- Single auto-scroll on component mount

**Props:**
```typescript
interface TimelineProps {
  events: Event[];
  selectedEvent: Event | null;
  currentEvent: Event | null;
  onSelectEvent: (event: Event) => void;
}
```

**Styling:**
- Current event: RGB(74 100 152 / 50%) blue background
- Past events: opacity-45 (dimmed)
- Selected event: cyan ring and shadow
- Cards: glass-morphism with backdrop blur

### DetailPanel.tsx (Event Details)
**Responsibilities:**
- Display selected event full details
- Show event images with carousel
- Display external links
- Provide navigation to next event (mobile)

**Key Features:**
- Image carousel with navigation arrows
- Indicator dots (small on mobile, larger on desktop)
- Formatted description and notes with bullet points
- Automatic image fallback on load error
- Next event button (mobile-only)

**Props:**
```typescript
interface DetailPanelProps {
  event: Event | null;
  isCurrent: boolean;
  events: Event[];
  onSelectEvent: (event: Event) => void;
}
```

**Styling:**
- Glass cards for sections
- Cyan accent icons
- Coral badges for current event
- Touch-friendly spacing on mobile

## 🔄 Data Flow

### Event Data Loading
```
Mount App.tsx
    ↓
fetch('/events-data.json')
    ↓
Parse JSON
    ↓
setEvents(data)
    ↓
Events available to Timeline & DetailPanel
```

### Current Event Detection
```
Component Mount / Every Minute
    ↓
Get device time (new Date())
    ↓
Find matching event:
  - Same date?
  - startTime ≤ currentTime?
  - currentTime < endTime?
    ↓
setCurrentEvent(matchedEvent)
    ↓
Auto-select if none selected
    ↓
Timeline scrolls to current
```

### User Interaction
```
User clicks event in Timeline
    ↓
onSelectEvent() called
    ↓
setSelectedEvent(event)
    ↓
On mobile: setViewMode('detail')
    ↓
DetailPanel shows selected event
```

## 📊 State Management Strategy

### Prop Drilling vs Context
Current implementation uses **prop drilling** for simplicity:
- App.tsx passes props down to Header, Timeline, DetailPanel
- Keeps data flow explicit and easy to trace
- No Context API overhead
- Small component tree (3-4 levels)

### Future Improvements
For larger apps, consider:
- React Context for global state
- Zustand for lightweight state management
- Redux if complexity increases significantly

## 🎨 Styling Architecture

### Tailwind CSS Organization

**Theme Variables** (in index.css root):
```css
:root {
  --ocean-deep: #0f172a;
  --ocean-dark: #1e3a5f;
  --ocean-cyan: #06b6d4;
  --coral: #ff6b6b;
  --cream: #f0f0e6;
  /* ... more variables */
}
```

**Component Classes:**
- `.glass-card` - Translucent card with blur
- `.time-display` - Time formatting (cyan color)
- `.date-badge` - Date badge styling
- `.indicator-button` - Carousel dot override

**Responsive Design:**
- Mobile-first approach
- Breakpoint: 1024px (lg)
- Tailwind's built-in responsive prefixes (sm:, lg:, xl:)

## 🔗 Data Models

### Event Interface
```typescript
interface Event {
  id: number;
  date: string;              // YYYY-MM-DD format
  startTime: string;         // HH:MM or special values
  endTime: string;           // HH:MM or special values
  title: string;
  fullDescription: string;
  notes: string;
  mapLink: string;
  images: string[];
  externalLinks: ExternalLink[];
}

interface ExternalLink {
  type: 'website' | 'facebook' | 'airbnb' | 'tiktok';
  url: string;
  label: string;
}
```

## 🧮 Time Logic Flow

### Time Conversion Pipeline
```
Input: "19:35"
    ↓
Regex match: /(\d{1,2}):(\d{2})/
    ↓
Parse: hours=19, minutes=35
    ↓
Convert: 19*60 + 35 = 1175 minutes
    ↓
Output: 1175 (comparable with device time)
```

### Event Duration Logic
```
If endTime is defined (normal event):
  endMinutes = parse(endTime)

If endTime is TỐI/KHUYA/HẾT ĐÊM:
  Find the next event in the sorted timeline
  If a next event exists:
    endDateTime = start datetime of next event, even across day boundary
  Else:
    endDateTime = 23:59:59 of this event's date
```

## 🚀 Performance Optimizations

### Rendering Optimizations
- **useMemo** for event grouping in Timeline
- **useCallback** for event handlers to prevent re-renders
- Avoid inline function definitions

### Bundle Optimizations
- Tree-shaking unused Lucide icons
- CSS minification via Tailwind
- Code splitting via Vite
- Lazy loading considered for future

### Runtime Optimizations
- Event time updated every 60 seconds (not every render)
- useRef for scroll target without re-renders
- CSS transitions for smooth animations

## 🔐 Security Considerations

### Data Validation
- Events loaded from local JSON (no external API)
- External links use target="_blank" with rel="noopener noreferrer"
- HTML content formatted, not injected

### No Security Concerns
- No user authentication needed
- No sensitive data stored
- No database connections
- No API keys exposed

## 🔄 Build & Deployment

### Development Build
```bash
npm run dev
# - Hot Module Replacement (HMR)
# - SourceMaps for debugging
# - Vite dev server on :5173
```

### Production Build
```bash
npm run build
# - TypeScript compilation
# - Vite optimization
# - Output to /dist folder
# - ~323 kB total (gzipped: ~87 kB)

npm run preview
# - Preview production build locally
```

### Deployment
- Deploy `/dist` folder to static host
- No API server needed
- No special configuration required
- Works on GitHub Pages, Vercel, Netlify, etc.

## 📈 Scalability Considerations

### Current Limitations
- Maximum ~50 events before noticeable slowdown
- Single JSON file data source
- No caching strategy
- No pagination/virtualization

### Future Enhancements
- **Virtual Scrolling**: For 100+ events
- **Backend API**: Replace JSON with REST/GraphQL
- **Database**: Store events in real database
- **Search & Filter**: Add event search functionality
- **Multi-language**: Support Vietnamese, English, etc.

## 🔍 Debugging & Monitoring

### Development Tools
- Browser DevTools (React, Network, Performance tabs)
- TypeScript compiler errors
- Console logging for time detection
- Network tab for asset loading

### Common Debug Points
- `findCurrentEvent()` - Check time calculation
- Timeline scroll - Check ref attachment
- Event rendering - Check data loading
- Responsive layout - Use device emulation

## 📝 Component Communication Pattern

```
User Input (Timeline)
    ↓
onSelectEvent() callback
    ↓
App.tsx setSelectedEvent()
    ↓
Props passed to DetailPanel
    ↓
DetailPanel re-renders with new event
    ↓
Image carousel resets (useEffect dependency)
```

This unidirectional flow makes debugging easy and prevents circular dependencies.
