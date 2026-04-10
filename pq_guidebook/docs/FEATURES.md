# Features & User Workflows

## 🎯 Core Features

### 1. Timeline Navigation
**Description:** Interactive event timeline organized by date

**Features:**
- Events grouped by date with day-of-week and date display
- Chronological ordering (earliest to latest)
- Visual icons for event types (plane, hotel, food, etc.)
- Click to select and view details
- Scrollable (100vh height on mobile, constrained on desktop)

**User Interaction:**
```
1. User opens app
2. Timeline loads automatically
3. User scrolls to find event
4. User clicks event card
5. Details appear in DetailPanel or separate tab (mobile)
```

**Visual Indicators:**
- **Current event**: Blue background (cyan-500/50)
- **Past events**: Dimmed (opacity-45)
- **Selected event**: Cyan ring and shadow
- **Title, time, icon**: Clear text hierarchy

### 2. Event Details View
**Description:** Comprehensive event information with multimedia

**Components:**
- **Title**: Large, bold event name
- **Time**: Start and end time in format HH:MM - HH:MM or HH:MM → EVENING
- **Status Badge**: "Đang diễn ra" (currently happening) for current event
- **Location**: MapPin icon with "Xem bản đồ" (View Map) link
- **Images**: Carousel with multiple images if available
- **Description**: Full description with bullet points
- **Notes**: Additional notes formatted with bullets
- **External Links**: Website, Maps, Facebook, Airbnb, TikTok links
- **Next Event Button**: Mobile-only button to navigate to next event

**User Interaction:**
```
1. User selects event from timeline
2. Details panel updates with new event
3. Images carousel appears (if any images)
4. User can:
   - Browse multiple images
   - Click links to external sites
   - Navigate to next event (mobile)
   - Return to timeline (mobile tab)
```

**Key UX Elements:**
- Image carousel with arrow buttons (left/right)
- Dot indicators showing current image
- Auto-reset to first image when event changes
- Fallback image if remote image fails to load

### 3. Image Carousel
**Description:** Browse event photos with navigation

**Features:**
- Previous/Next arrow buttons (44px min for mobile touch)
- Indicator dots (small on mobile: 1x1, larger on desktop: 2x2)
- Current image counter in caption
- Auto-fallback to default image on error
- Smooth transitions between images

**Controls:**
- **Left Arrow**: Shows previous image
- **Right Arrow**: Shows next image
- **Dots**: Click any dot to jump to that image
- **Behavior**: Circular (last image → first image)

**Example Interaction:**
```
Event has 3 images:
1. Click right arrow → Shows image 2
2. Click right arrow → Shows image 3
3. Click right arrow → Wraps to image 1
4. Click middle dot → Jumps to image 2
```

### 4. Mobile Tab Navigation
**Description:** Switch between Timeline and Details on small screens

**Features:**
- Horizontal tabs at top (below header)
- "Lịch trình" (Timeline) and "Chi tiết" (Details) tabs
- Active tab highlighted in cyan
- Smooth transition between views
- Full-height content areas (100vh)

**States:**
- **Timeline tab active**: Shows timeline, hides details
- **Details tab active**: Shows details, hides timeline
- **Desktop (≥1024px)**: Both visible side-by-side, no tabs

**User Interaction:**
```
1. On mobile, user opens app
2. Sees timeline tab active
3. Selects event from timeline
4. Details tab automatically becomes active
5. User can switch back to timeline tab to select different event
```

### 5. External Links Integration
**Description:** Connect to third-party services for more information

**Supported Link Types:**

| Type | Icon | Usage |
|------|------|-------|
| `website` | Globe | Official websites, booking sites |
| `facebook` | Facebook logo | Social media pages |
| `airbnb` | Home | Accommodation listings |
| `tiktok` | Video | TikTok videos, demonstrations |
| `google_maps` | MapPin | Auto-extracted from mapLink field |

**Display:**
- Each link shows as clickable card
- Icon + label visible
- `target="_blank"` for external sites
- Proper security attributes (noopener, noreferrer)

**User Interaction:**
```
1. User views event details
2. Sees "Liên kết" (Links) section at bottom
3. Clicks any link
4. Opens in new browser tab
5. Can research event details independently
```

### 6. Current Event Detection
**Description:** Automatically identifies what event is happening now

**Features:**
- Updates every 60 seconds
- Based on device time
- Shows "Đang diễn ra" badge in Timeline and Details
- Auto-scrolls Timeline to current event on load
- Auto-selects current event if none selected

**Display:**
- Timeline: Blue background + "Đang diễn ra" badge
- Details: Status badge showing event is current
- Header: Clock shows current time

**Testing:**
- Change device time to see different event marked as current
- No code changes needed for testing

### 7. Responsive Design
**Description:** Optimized experience across all device sizes

**Breakpoints:**
- **Mobile** (<1024px): Single-column, tab navigation
- **Tablet** (1024-1440px): Side-by-side, adjusted spacing
- **Desktop** (>1440px): Full-width, optimized spacing

**Mobile Optimizations:**
- Timeline: Full height (100vh)
- Details: Full height (100vh)
- Tab navigation at top
- Larger touch targets (44px minimum)
- Responsive font sizes
- Stack layout for descriptions

**Desktop Optimizations:**
- Timeline: Left column (1/3 width)
- Details: Right column (2/3 width)
- Side-by-side scrollable areas
- Smaller, more detailed text
- Optimized spacing and padding

**Touch-Friendly Elements:**
- 44px × 44px minimum button size
- Large clickable areas
- Clear visual feedback on hover/active
- No hover-dependent information (mobile)

## 📱 User Workflows

### Workflow 1: Explore Timeline
**Goal:** Browse all events in chronological order

```
1. Launch app
2. Timeline automatically shows all events
3. Events grouped by date
4. User scrolls through timeline
5. Sees event icons and titles
6. Identifies points of interest
```

**Best For:** Quick overview, planning

---

### Workflow 2: Get Event Details
**Goal:** View complete information for a specific event

```
1. Find event in timeline
2. Click event card
3. On mobile: Details tab becomes active
4. See:
   - Full description
   - Multiple images
   - Notes and tips
   - Location and links
5. Can click links to external resources
6. Can navigate to next event (mobile button)
```

**Best For:** Detailed planning, booking, research

---

### Workflow 3: View Images
**Goal:** Browse photos for a specific event

```
1. Select event with images
2. See image carousel
3. First image shown automatically
4. Use arrows to browse or click dots
5. Image has caption showing event title
6. Fallback to default if image fails
```

**Best For:** Visual planning, anticipation building

---

### Workflow 4: Find Event Locations (Desktop)
**Goal:** Get map and directions to event location

```
1. View event details
2. See MapPin icon with "Xem bản đồ"
3. Or scroll to Links section
4. Click "Google Maps" link
5. Opens Google Maps in new tab
6. Shows event location
7. Can get directions
```

**Best For:** Navigation, planning routes

---

### Workflow 5: Check What's Happening Now
**Goal:** Know what's currently happening on the trip

```
1. Open app at any time
2. Current event marked with "Đang diễn ra" badge
3. Timeline automatically scrolls to current event
4. Header shows current time
5. Details panel shows full current event info
6. Use for: "What are we doing now?" "When's next activity?"
```

**Best For:** Real-time trip management

---

### Workflow 6: Plan Next Activity (Mobile)
**Goal:** Navigate to next upcoming event

```
1. View current or specific event details
2. On mobile, see "Tiếp theo" button at bottom
3. Shows next event title with arrow
4. Click button
5. Details immediately update to next event
6. Can continue clicking through all events
```

**Best For:** Mobile navigation, sequential planning

## 🎨 Visual Hierarchy

### Color Scheme
| Color | RGB | Usage |
|-------|-----|-------|
| Ocean Deep | (15, 23, 42) | Background |
| Ocean Cyan | (6, 182, 212) | Accents, active states |
| Coral Red | (255, 107, 107) | Highlights, badges |
| Cream | (240, 240, 230) | Text |
| Blue Current | (74, 100, 152) | Current event background |

### Typography Hierarchy
1. **Event Title**: text-xl to text-3xl, bold
2. **Section Headers**: text-sm to text-base, semibold
3. **Body Text**: text-sm to text-base, regular
4. **Time Display**: text-sm to text-base, cyan color
5. **Captions**: text-xs to text-sm, muted

### Component States

| State | Appearance |
|-------|-----------|
| Default Event Card | Neutral glass card |
| Hover Event Card | Shadow increase, brightness increase |
| Selected Event Card | Cyan ring, shadow glow |
| Current Event Card | Blue background, red glow |
| Past Event | Opacity 45% (dimmed) |
| Image Carousel | Full width, aspect-video |
| Loading | Spinner in center |

## 🌐 Accessibility Features

### Implemented
- Semantic HTML (buttons, links, headings)
- Proper color contrast (WCAG AA compliant)
- 44px minimum touch targets
- Keyboard navigation support (Tab, Enter)
- Responsive text sizing
- Icon + label combination for buttons
- Alt text for critical images (via fallback)

### Recommendations
- Add ARIA labels to custom controls
- Test with screen readers
- Verify focus management
- Add skip-to-content link
- Include captions for video content

## 🔄 State Changes & Animations

### Page Load Animation
```
1. Fade in header
2. Timeline data loads
3. Fade in timeline
4. Auto-scroll to current event
5. Fade in details panel
```

### Event Selection
```
1. User clicks timeline event
2. Selected state animates (ring appears)
3. Details panel updates (fade transition)
4. Image carousel resets to first image
5. Scroll smoothly to details
```

### Button Interactions
```
1. Hover: Shadow increases, background slightly brighter
2. Active: Shadow decreases slightly (press effect)
3. Focus: Outline visible (keyboard navigation)
4. Disabled: Opacity 50%
```

## 🎯 Key Performance Indicators

### User Experience Metrics
- **First Load Time**: < 2 seconds
- **Event Selection Time**: < 100ms (CSS animation)
- **Image Load Time**: < 1 second
- **Scroll Smoothness**: 60fps on modern devices
- **Time Update Frequency**: 1 update per 60 seconds

### User Satisfaction Goals
- 100% of events accessible within 2 taps (mobile)
- All event information visible without searching
- External links working and helpful
- No dead-end states (can always navigate back)

## 🚀 Feature Roadmap

### Phase 1 (Current)
✅ Timeline navigation
✅ Event details display
✅ Image carousel
✅ External links
✅ Mobile responsiveness
✅ Current event detection

### Phase 2 (Future)
- Event filtering (by category, date)
- Event search functionality
- Trip timeline export (PDF)
- Event reminders/notifications
- Social sharing (WhatsApp, Facebook)
- Multi-language support (Vietnamese, English)

### Phase 3 (Advanced)
- User ratings/reviews for events
- Collaborative planning (multiple users)
- Booking integration (hotels, activities)
- Offline mode (service worker)
- Native mobile app (React Native)

## 📊 Feature Usage Patterns

### Expected Usage
1. **First Visit**: Browse timeline (80% of time)
2. **Planning Stage**: Alternate timeline/details (50/50)
3. **During Trip**: Use current event detection (90%)
4. **Return Visit**: Search for specific events (20%)

### Device-Specific Patterns
- **Mobile**: Tab navigation heavy, next event button frequent
- **Tablet**: Mix of timeline scrolling and details viewing
- **Desktop**: Simultaneous timeline and details reference

