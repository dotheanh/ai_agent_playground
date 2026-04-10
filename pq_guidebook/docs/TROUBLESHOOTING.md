# Troubleshooting Guide

## 📋 Overview

Common issues and solutions when developing or using the Phú Quốc Trip Guidebook.

**Quick Navigation:**
- [Development & Build Issues](#-development--build-issues)
- [Runtime Issues](#-runtime-issues)
- [Time Logic Issues](#-time-logic-issues)
- [Responsive Design Issues](#-responsive-design-issues)
- [Deployment Issues](#-deployment-issues)

---

## 🔧 Development & Build Issues

### Issue: "Module not found" error

**Symptoms:**
```
Error: Cannot find module '@/components/Button'
```

**Causes:**
- Typo in import path
- File doesn't exist
- Wrong capitalization (case-sensitive on Linux/Mac)

**Solutions:**

1. **Check file exists**
   ```bash
   # Verify file path
   ls src/components/Button.tsx
   ```

2. **Verify case sensitivity**
   ```typescript
   // ❌ WRONG (case mismatch)
   import Button from './button.tsx';
   
   // ✅ CORRECT
   import Button from './Button.tsx';
   ```

3. **Use correct paths**
   ```typescript
   // Relative imports
   import { Button } from './components/Button';
   import { useEvent } from '../hooks/useEvent';
   
   // Absolute imports (if configured in tsconfig)
   import { Button } from '@/components/Button';
   ```

4. **Reinstall dependencies**
   ```bash
   rm -rf node_modules
   npm install
   npm run dev
   ```

---

### Issue: TypeScript compilation errors

**Symptoms:**
```
Type 'string' is not assignable to type 'number'
Property 'title' does not exist on type 'Event'
```

**Solutions:**

1. **Check type definitions**
   ```typescript
   // Ensure interface matches usage
   interface Event {
     id: number;
     title: string;  // Must be string
     // ...
   }
   
   // Type-safe usage
   const event: Event = {
     id: 1,
     title: "Event Name",  // ✓ String type
   };
   ```

2. **Use proper type imports**
   ```typescript
   import type { Event } from '../types';  // ✓ Correct
   import { Event } from '../types';        // ❌ May fail
   ```

3. **Run type check**
   ```bash
   npx tsc --noEmit
   # Review errors without outputting files
   ```

4. **Strict null checks**
   ```typescript
   // ❌ May be null
   const title = event.title;
   
   // ✅ Safe null handling
   const title = event?.title ?? 'Untitled';
   ```

---

### Issue: Build fails with webpack errors

**Symptoms:**
```
✗ [vite] Internal server error: SyntaxError: Unexpected token
```

**Solutions:**

1. **Check for syntax errors**
   ```bash
   # Look for common issues:
   # - Missing semicolons
   # - Unclosed brackets
   # - Invalid JSX
   
   npm run dev
   # Check terminal output for exact line
   ```

2. **Clear cache and rebuild**
   ```bash
   rm -rf node_modules/.vite dist
   npm run build
   ```

3. **Check recent changes**
   ```bash
   git diff HEAD~1 HEAD
   # Review what changed
   ```

4. **Validate JSX syntax**
   ```typescript
   // ❌ WRONG (missing closing tag)
   return <div className="container">
     <h1>Title</h1>
   
   // ✅ CORRECT
   return (
     <div className="container">
       <h1>Title</h1>
     </div>
   );
   ```

---

### Issue: Hot Module Replacement (HMR) not working

**Symptoms:**
- Changes don't reflect in browser
- Must manually refresh page
- Dev server seems hung

**Solutions:**

1. **Restart dev server**
   ```bash
   # Stop with Ctrl+C
   npm run dev
   ```

2. **Check file is saved**
   - VS Code: File should not have dot before name
   - Sometimes editor doesn't auto-save

3. **Hard refresh browser**
   ```
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

4. **Update Vite config**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     server: {
       hmr: {
         host: 'localhost',
         port: 5173,
       },
     },
   });
   ```

---

## 🏃 Runtime Issues

### Issue: App crashes with "Cannot read property X of undefined"

**Symptoms:**
```
TypeError: Cannot read property 'title' of undefined
at EventCard (/src/components/EventCard.tsx:45:12)
```

**Causes:**
- Missing null checks
- Destructuring undefined object
- Async data not loaded yet

**Solutions:**

1. **Add null checks**
   ```typescript
   // ❌ WRONG (crashes if event is undefined)
   const EventCard = ({ event }) => {
     return <div>{event.title}</div>;
   };
   
   // ✅ CORRECT (guard clause)
   const EventCard = ({ event }) => {
     if (!event) return null;
     return <div>{event.title}</div>;
   };
   
   // ✅ ALSO GOOD (optional chaining)
   const EventCard = ({ event }) => {
     return <div>{event?.title ?? 'Untitled'}</div>;
   };
   ```

2. **Destructure safely**
   ```typescript
   // ❌ WRONG
   const { title, description } = event;
   
   // ✅ CORRECT
   const { title = 'Untitled', description = '' } = event || {};
   ```

3. **Wait for async data**
   ```typescript
   const [events, setEvents] = useState<Event[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   
   if (isLoading) return <Spinner/>;
   
   return (
     <div>
       {events.map(event => (
         <EventCard key={event.id} event={event} />
       ))}
     </div>
   );
   ```

---

### Issue: Images not loading

**Symptoms:**
- Broken image icons in timeline/detail
- Image carousel shows placeholder
- Console shows 404 errors

**Solutions:**

1. **Check file exists**
   ```bash
   # Verify image files in public folder
   ls public/images/
   ```

2. **Verify image paths**
   ```typescript
   // In events-data.json, use absolute paths from public root
   {
     "images": [
       "/images/phuquoc-beach.jpg",  // ✓ Correct
       "./images/event.jpg",         // ❌ Wrong
       "images/event.jpg",           // ❌ Wrong
     ]
   }
   ```

3. **Check file extensions**
   ```
   CorrectFileName.jpg  ✓
   correctfilename.jpg  ❌ (case mismatch)
   ```

4. **Handle image load errors**
   ```typescript
   const [imageSrc, setImageSrc] = useState(imageUrl);
   
   const handleImageError = () => {
     setImageSrc('/images/phuquoc-beach.jpg');  // Fallback
   };
   
   <img 
     src={imageSrc} 
     onError={handleImageError}
     alt="Event"
   />
   ```

---

### Issue: External links not working

**Symptoms:**
- Links in detail panel don't open
- Website links return 404
- Facebook links invalid

**Solutions:**

1. **Verify URL format**
   ```typescript
   // ✓ Valid URLs
   "https://www.example.com"
   "https://facebook.com/page"
   "https://maps.google.com/?..."
   
   // ❌ Invalid
   "example.com"               // Missing protocol
   "www.example.com"           // Missing protocol
   "http://example.com"        // Use https
   ```

2. **Test in new tab**
   - Right-click link → "Open in new tab"
   - Verify URL is accessible

3. **Check events-data.json**
   ```javascript
   // Validate JSON syntax
   const data = JSON.parse(fs.readFileSync('public/events-data.json'));
   ```

4. **Verify externalLinks format**
   ```typescript
   {
     "externalLinks": [
       {
         "type": "website",
         "url": "https://example.com",
         "label": "Official Website"
       }
     ]
   }
   ```

---

### Issue: Console shows warnings about React keys

**Symptoms:**
```
Warning: Each child in a list should have a unique "key" prop
```

**Causes:**
- Using array index as key
- Non-unique keys in loops

**Solution:**

```typescript
// ❌ WRONG (index-based key)
{events.map((event, index) => (
  <div key={index}>{event.title}</div>
))}

// ✅ CORRECT (unique, stable key)
{events.map(event => (
  <div key={event.id}>{event.title}</div>
))}
```

---

## ⏰ Time Logic Issues

### Issue: Current event detection not working

**Symptoms:**
- Wrong event marked as current
- Current badge doesn't appear
- Current event doesn't have blue background

**Diagnostics:**

```typescript
// Check current event detection
console.log({
  currentTime: new Date().toLocaleTimeString(),
  currentEvent: currentEvent?.title,
  currentEventStartTime: currentEvent?.startTime,
  currentEventEndTime: currentEvent?.endTime,
});
```

**Solutions:**

1. **Check device time**
   ```typescript
   // Verify device time is correct
   console.log('Device time:', new Date().toLocaleTimeString());
   
   // If testing cross-day events, device time must be in that day/time range
   ```

2. **Verify time format**
   ```typescript
   // Times must be in HH:MM format (24-hour)
   "startTime": "05:00",   // ✓ Correct
   "startTime": "5:00",    // ❌ Wrong
   "startTime": "05:00 AM" // ❌ Wrong
   ```

3. **Check special time values**
   ```typescript
   // These are special markers for end times
   "endTime": "TỐI"        // Evening (ends at the next event start)
   "endTime": "KHUYA"      // Late night (ends at the next event start)
   "endTime": "HẾT ĐÊM"    // End of night (ends at the next event start or 23:59 if final)
   
   // See TIME_LOGIC.md for complete explanation
   ```

4. **Test time parsing**
   ```typescript
   // Manually test timeToMinutes function
   const timeToMinutes = (timeStr: string) => {
     if (['TỐI', 'KHUYA', 'HẾT ĐÊM'].includes(timeStr)) {
       return null;
     }
     const [hours, minutes] = timeStr.split(':').map(Number);
     return hours * 60 + minutes;
   };
   
   console.log(timeToMinutes('14:30'));    // Should be 870
   console.log(timeToMinutes('TỐI'));     // Should be null
   ```

### Issue: Auto-scroll not working on load

**Symptoms:**
- Timeline doesn't scroll to current event
- Stays at top of event list

**Solutions:**

1. **Check hasScrolledRef flag**
   ```typescript
   // Should only scroll once
   const hasScrolledRef = useRef(false);
   
   useEffect(() => {
     if (currentEvent && currentNodeRef.current && !hasScrolledRef.current) {
       hasScrolledRef.current = true;
       currentNodeRef.current.scrollIntoView({ behavior: 'smooth' });
     }
   }, [currentEvent]);
   ```

2. **Verify ref is attached**
   ```typescript
   // Must attach ref to timeline node
   {currentEvent && (
     <div ref={currentNodeRef} className="timeline-node">
       {currentEvent.title}
     </div>
   )}
   ```

3. **Check scroll container**
   ```typescript
   // Timeline must have overflow-y: auto or overflow-y: scroll
   <div className="h-[100vh] overflow-y-auto">
     {/* Timeline events */}
   </div>
   ```

---

## 📱 Responsive Design Issues

### Issue: Layout breaks on mobile

**Symptoms:**
- Content overlaps on small screens
- Horizontal scroll appears
- Touch targets smaller than 44px

**Solutions:**

1. **Verify media queries**
   ```typescript
   // Check responsive Tailwind classes
   className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4"
   
   // sm = 640px
   // md = 768px
   // lg = 1024px
   // xl = 1280px
   ```

2. **Test on actual mobile size**
   ```
   DevTools → Device toolbar
   → Select device (iPhone 12, etc.)
   → Test landscape and portrait
   ```

3. **Check touch targets**
   ```typescript
   // All clickable elements must be ≥ 44px × 44px
   <button className="p-3 min-h-[44px] min-w-[44px]">
     Click me
   </button>
   ```

4. **Prevent horizontal scroll**
   ```css
   /* In index.css */
   body {
     overflow-x: hidden;
     max-width: 100vw;
   }
   ```

### Issue: Images distorted on mobile

**Symptoms:**
- Images stretched or squeezed
- Aspect ratio wrong
- Carousel looks odd

**Solutions:**

1. **Use proper aspect ratio**
   ```typescript
   <img 
     src={imageUrl}
     alt="Event"
     className="w-full h-auto aspect-video"  // Maintains ratio
   />
   ```

2. **Set image constraints**
   ```typescript
   <img 
     className="w-full max-h-[300px] md:max-h-[400px] object-cover"
     src={imageUrl}
     alt="Event"
   />
   ```

3. **Check Tailwind aspect classes**
   ```typescript
   aspectVideo     // 16:9
   aspectSquare    // 1:1
   aspect-[4/3]    // Custom ratio
   ```

---

### Issue: Text too small on mobile

**Symptoms:**
- Can't read text on phone
- Need to pinch to zoom
- Font appears tiny

**Solutions:**

1. **Set responsive text sizes**
   ```typescript
   // Smaller on mobile, larger on desktop
   <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
     Title
   </h1>
   
   <p className="text-sm sm:text-base md:text-lg">
     Description
   </p>
   ```

2. **Check minimum font size**
   ```
   Mobile: 16px minimum (prevents auto-zoom)
   Desktop: 14px or larger
   ```

3. **Verify line height**
   ```typescript
   // Poor readability
   <p className="leading-none text-sm">Bad</p>
   
   // Better
   <p className="leading-relaxed text-sm">Good</p>
   ```

---

## 🌐 Deployment Issues

### Issue: App works locally but not after deployment

**Symptoms:**
- Blank white page
- JavaScript errors in console
- 404 errors for assets

**Solutions:**

1. **Check network requests**
   ```
   DevTools → Network tab
   - Look for failed requests (red)
   - Check response status codes
   ```

2. **Review console errors**
   ```
   F12 → Console tab
   - JavaScript errors shown there
   - Check for "Cannot find module" errors
   ```

3. **Verify build output**
   ```bash
   npm run build
   npm run preview
   # Test locally before deploying
   ```

4. **Check public folder**
   ```bash
   # Verify files are in dist folder after build
   ls dist/
   ls dist/images/
   ```

---

### Issue: Images 404 after deployment

**Symptoms:**
- Images fine locally (npm run dev)
- Images broken after deploy
- Console shows 404 for /images/

**Causes:**
- Images missing from build
- Wrong base path on GitHub Pages

**Solutions:**

1. **Verify images in dist/**
   ```bash
   npm run build
   ls dist/images/
   # Should show images after build
   ```

2. **Check base path (GitHub Pages)**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     base: '/<REPO_NAME>/',  // For GitHub Pages project site
     // base: '/',            // For custom domain
   });
   
   // Rebuild after changing
   npm run build
   ```

3. **Ensure images in public folder**
   ```bash
   # Images must be in src/public/images/
   # They're automatically copied to dist/images/
   ```

---

## 🔗 When Stuck

### Debug Process

1. **Isolate the problem**
   - Does it happen on dev server? (`npm run dev`)
   - Does it happen in preview? (`npm run preview`)
   - Does it happen after deploy?

2. **Check the logs**
   - Terminal output
   - Browser console (F12)
   - Build logs (Vercel/Netlify)

3. **Review recent changes**
   ```bash
   git log --oneline -5
   git diff HEAD~1 HEAD
   ```

4. **Create minimal reproduction**
   ```typescript
   // Simplify to find problematic code
   // Remove features one by one
   ```

5. **Search documentation**
   - TIME_LOGIC.md for time-related issues
   - ARCHITECTURE.md for structure questions
   - CODE_STANDARDS.md for style/pattern issues

### Getting Help

**Documentation:**
- [README.md](./README.md) - Quick start
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [TIME_LOGIC.md](./TIME_LOGIC.md) - Time behavior
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production
- [CODE_STANDARDS.md](./CODE_STANDARDS.md) - Code practices

**Tools:**
- VS Code Debugger: F5 to launch
- Chrome DevTools: F12
- Console errors usually point to exact issue

**When All Else Fails:**
```bash
# Nuclear option - clean everything
rm -rf node_modules dist
npm install
npm run build
npm run preview
# Test thoroughly before deploying
```

---

## ✅ Reference Checklist

**Before reporting an issue:**

- [ ] Restarted dev server
- [ ] Cleared browser cache
- [ ] Checked browser console for errors
- [ ] Tried `npm install` again
- [ ] Reviewed recent git changes
- [ ] Tested with `npm run preview`
- [ ] Checked file spelling/casing
- [ ] Verified JSON syntax in data files
- [ ] Looked at relevant documentation

**When deploying:**

- [ ] Ran `npm run build` successfully
- [ ] Ran `npm run preview` and tested
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All responsive breakpoints work
- [ ] Images load correctly
- [ ] External links work
- [ ] Mobile tested on actual device
- [ ] Lighthouse score acceptable

---

## 🔗 Related Documents

- [README.md](./README.md) - Quick start guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [TIME_LOGIC.md](./TIME_LOGIC.md) - Time system
- [CODE_STANDARDS.md](./CODE_STANDARDS.md) - Code practices
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment
