# Phú Quốc Trip Guidebook - Project Documentation

## 📍 Project Overview

**Phú Quốc Trip Guidebook** is an interactive web application showcasing a 3-day trip itinerary to Phú Quốc, Vietnam. The app provides a timeline-based navigation system with detailed event information, image galleries, external links, and responsive mobile-first design.

### Key Features
- 📅 Interactive timeline with chronological event navigation
- 🎨 Beautiful glass-morphism UI with ocean-inspired color palette
- 📱 Fully responsive mobile-first design
- 🖼️ Image carousel for each event
- 🔗 External links (websites, maps, Facebook, Airbnb)
- ⏰ Device-aware current event detection
- 🌊 Smooth animations and scroll effects
- 🎯 Touch-friendly interface (44px minimum tap targets)

## 🎯 Project Goals

1. **Create an engaging trip itinerary app** with interactive features
2. **Optimize for mobile devices** with thoughtful UX decisions
3. **Support device time simulation** for testing different time periods
4. **Provide comprehensive location and activity information** via external links
5. **Deliver smooth, performant experience** across all devices

## 📊 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Runtime** | Node.js | 20+ |
| **Framework** | React | 19.2.0 |
| **Language** | TypeScript | 5.6.3 |
| **Build Tool** | Vite | 7.3.0 |
| **Styling** | Tailwind CSS | 3.4.19 |
| **UI Library** | shadcn/ui + Radix UI | Latest |
| **Animation** | GSAP + Lenis | Latest |
| **Icons** | Lucide React | Latest |

## 📁 Project Structure

```
pq_guidebook/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx       # Top navigation bar
│   │   ├── Timeline.tsx     # Event list timeline
│   │   ├── DetailPanel.tsx  # Event details view
│   │   ├── sections/        # Page sections
│   │   └── ui/              # Shadcn UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/
│   ├── events-data.json     # Event data source
│   └── images/              # Event images
├── dist/                    # Build output
├── docs/                    # Documentation (this folder)
└── package.json             # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn package manager

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Documentation Index

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and component architecture
2. **[TIME_LOGIC.md](./TIME_LOGIC.md)** - Detailed explanation of event timing logic
3. **[FEATURES.md](./FEATURES.md)** - Feature descriptions and user workflows
4. **[CODE_STANDARDS.md](./CODE_STANDARDS.md)** - Code conventions and best practices
5. **[UI_UX_GUIDE.md](./UI_UX_GUIDE.md)** - Design system and UX decisions
6. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Development environment setup

## 🎨 Design System

### Color Palette (KALEO Theme)
- **Primary Ocean**: Deep blues (#0F172A, #1E3A5F)
- **Cyan Accent**: Bright cyan (#06B6D4, #22D3EE)
- **Coral**: Warm accent (#FF6B6B, #EF4444)
- **Cream**: Light text (#F0F0E6)

### Typography
- **Headers**: Bold, large (text-lg to text-3xl)
- **Body**: Regular, readable (text-sm to text-base)
- **Responsive**: Scales down on mobile devices

### Components
- **Glass Cards**: Translucent cards with blur effect
- **Buttons**: 44px minimum for mobile touch
- **Icons**: Lucide React 20+ icons
- **Animations**: GSAP for complex animations, Tailwind for transitions

## 📝 Event Data Format

Events are stored in `public/events-data.json` with structure:
```json
{
  "id": 0,
  "date": "2026-04-09",
  "startTime": "18:35",
  "endTime": "19:35",
  "title": "Event Title",
  "fullDescription": "Multi-line description...",
  "notes": "Additional notes...",
  "mapLink": "https://maps.google.com/...",
  "images": ["/images/image1.jpg", "/images/image2.jpg"],
  "externalLinks": [
    {"type": "website", "url": "https://...", "label": "Label"}
  ]
}
```

### Supported External Link Types
- `website` - Generic website link
- `facebook` - Facebook page link
- `airbnb` - Airbnb listing
- `tiktok` - TikTok video
- `google_maps` - Google Maps location (auto-extracted from mapLink)

## 🔄 State Management

### App.tsx (Root State)
- `events`: Array of event objects
- `selectedEvent`: Currently selected event
- `currentEvent`: Event currently happening (based on device time)
- `viewMode`: Mobile tab state ('timeline' | 'detail')
- `loading`: Data loading state

### Timeline.tsx
- Displays events grouped by date
- Highlights past events with reduced opacity
- Shows current event with blue background
- Auto-scrolls to current event on mount

### DetailPanel.tsx
- Shows full event details
- Image carousel with dot indicators
- External links section
- "Next Event" button on mobile

## ⏰ Time System

### Key Characteristics
- **Device-aware**: Uses device clock for current time detection
- **Cross-day events**: Events with undefined end time extend to next event
- **Time formatting**: Device locale for display, 24-hour format for logic
- **Update interval**: Checks current event every minute

### Special Time Values
- `TỐI` - Evening (opens time-based duration)
- `KHUYA` - Night (opens time-based duration)
- `HẾT ĐÊM` - End of night (opens time-based duration)

See [TIME_LOGIC.md](./TIME_LOGIC.md) for detailed explanation.

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 1024px (timeline full width, detail hidden)
- **Tablet**: 1024px - 1440px (side-by-side layout)
- **Desktop**: > 1440px (optimized spacing)

### Mobile Optimizations
- Tab navigation (Timeline/Detail toggle)
- Timeline: 100vh height on mobile
- DetailPanel: 100vh height on mobile
- Touch targets: 44px minimum
- Font sizing: Responsive (text-sm to text-base)

## 🔍 Performance Considerations

### Bundle Size
- **JS**: ~226 kB (gzipped: ~70 kB)
- **CSS**: ~97 kB (gzipped: ~17 kB)
- **Total**: ~323 kB (gzipped: ~87 kB)

### Optimizations
- Code splitting via Vite
- CSS minification
- Tree-shaking of unused code
- Image optimization (use jpg/webp)
- Lazy loading of components

## 🧪 Testing & Quality

### Development Tools
- TypeScript for type safety
- ESLint for code quality
- Vite for fast builds
- HMR (Hot Module Replacement)

### Recommended Testing
- Unit tests for utility functions
- Integration tests for components
- E2E tests for user workflows
- Visual testing on mobile devices

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Contributing

When making changes:
1. Follow code standards in [CODE_STANDARDS.md](./CODE_STANDARDS.md)
2. Update relevant documentation
3. Test on mobile devices
4. Keep components under 200 lines
5. Use descriptive commit messages

## 📞 Support & Troubleshooting

### Common Issues

**App not showing current event?**
- Check device time is correct
- Verify event dates match current date
- Check console for time parsing errors

**Images not loading?**
- Verify image files exist in `/public/images/`
- Check file paths in events-data.json
- Ensure image URLs are relative paths

**Mobile layout broken?**
- Clear browser cache
- Check viewport meta tag in HTML
- Test on actual mobile device
- Verify Tailwind CSS classes are applied

## 📄 License

Project created for personal portfolio and demonstration purposes.

## 🎉 Version History

- **v1.0.0** (Initial Release)
  - Basic timeline and event display
  - Mobile-first responsive design
  - Image carousel functionality
  - External links integration
  - Device time awareness
  - Cross-day event handling
