# Code Standards & Best Practices

## 📋 Overview

This document defines coding standards, conventions, and best practices for the Phú Quốc Trip Guidebook project.

**Core Principles:**
- **YAGNI**: You Aren't Gonna Need It (don't over-engineer)
- **KISS**: Keep It Simple, Stupid (prefer simplicity)
- **DRY**: Don't Repeat Yourself (reuse code)
- **Clean Code**: Readable, maintainable, self-documenting

## 📝 File Structure & Naming

### File Organization

```
src/
├── components/
│   ├── Header.tsx                      # Main layout components
│   ├── Timeline.tsx
│   ├── DetailPanel.tsx
│   ├── sections/                       # Page sections
│   │   ├── Hero.tsx
│   │   ├── CardStack.tsx
│   │   └── ...
│   └── ui/                             # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── hooks/                              # Custom React hooks
│   ├── useMobile.ts
│   ├── useLenis.ts
│   └── useScrollAnimation.ts
├── lib/                                # Utility functions
│   └── utils.ts
├── types/                              # Type definitions
│   └── index.ts
├── sections/                           # Standalone sections
└── App.tsx
```

### Naming Conventions

**Files:**
- Use **kebab-case** for filenames: `my-component.tsx`, `my-hook.ts`
- Descriptive names: `DetailPanel.tsx` not `DPanel.tsx`
- Match export name: Export `DetailPanel` from `DetailPanel.tsx`

**Components:**
- **PascalCase** for component names: `MyComponent`
- **Descriptive**: `EventDetailCard` not `Card1`

**Functions/Variables:**
- **camelCase** for functions: `findCurrentEvent()`, `handleSelectEvent()`
- **camelCase** for variables: `selectedEvent`, `currentTime`
- **UPPERCASE** for constants: `MAX_EVENTS = 50`

**Types/Interfaces:**
- **PascalCase**: `interface Event {}`, `type EventState = {}`
- Prefix with interface: `IProps`, `IState` (optional but recommended)

**CSS Classes:**
- **kebab-case**: `.glass-card`, `.timeline-node`, `.indicator-button`
- **Descriptive**: `.gradient-text` not `.txt1`

## 🧩 Component Standards

### Component Structure Template

```typescript
// 1. Imports (grouped and sorted)
import { useState, useCallback } from 'react';
import type { ComponentProps } from '../types';
import { Button } from './Button';

// 2. Type definitions
interface MyComponentProps {
  data: string;
  onSelect?: (value: string) => void;
}

// 3. Component definition
const MyComponent = ({ data, onSelect }: MyComponentProps) => {
  // 4. State (useState first)
  const [isOpen, setIsOpen] = useState(false);

  // 5. Callbacks (useCallback for optimization)
  const handleClick = useCallback(() => {
    setIsOpen(!isOpen);
    onSelect?.(data);
  }, [data, onSelect]);

  // 6. Derived state (useMemo if expensive)

  // 7. Effects (useEffect last)
  
  // 8. Render
  return (
    <div>
      {/* JSX here */}
    </div>
  );
};

// 9. Export
export default MyComponent;
```

### File Size Guidelines
- **Target**: < 200 lines per component
- **Maximum**: 250 lines (consider splitting if larger)
- **Over 300 lines**: Definitely split

**How to split large files:**
1. Extract render logic to sub-components
2. Extract business logic to custom hooks
3. Extract utility functions to lib/
4. Use composition over inheritance

### Props Best Practices

✅ **GOOD:**
```typescript
interface CardProps {
  title: string;
  description: string;
  onSelect: (id: number) => void;
  variant?: 'default' | 'outlined';
}

const Card = ({ title, description, onSelect, variant = 'default' }: CardProps) => {
  // Component logic
};
```

❌ **BAD:**
```typescript
// Too many props (smell for refactoring)
const Card = (props: any) => {
  // Receives 20+ props - split into sub-components instead
};

// No prop types
const Card = ({ title, description }) => {
  // No type safety
};
```

## 🎨 TypeScript Standards

### Type Definitions

✅ **GOOD:**
```typescript
// Specific, named types
interface Event {
  id: number;
  date: string;
  startTime: string;
  title: string;
}

type TimeMinutes = number;  // Branded types for clarity

// Union types for variants
type ViewMode = 'timeline' | 'detail';
```

❌ **BAD:**
```typescript
// Too generic
type Data = any;

// Unclear purpose
type X = string | number | boolean;

// No structure
interface Thing {
  data: any;
}
```

### Null/Undefined Handling

✅ **GOOD:**
```typescript
// Use optional chaining
const title = event?.title ?? 'Untitled';

// Null safe array operations
const firstImage = images?.[0];

// Guard clauses early
if (!event) return null;
```

❌ **BAD:**
```typescript
// Dangerous assertion
const title = event!.title;  // Crashes if null

// Chained optional without default
event?.details.title  // Returns undefined, not safe
```

## 🔤 Naming Conventions Reference

### React Hooks
```typescript
// Use `use` prefix
const useCurrentEvent = () => { /* ... */ };
const useMobileDetection = () => { /* ... */ };
const useEventSorting = () => { /* ... */ };
```

### Event Handlers
```typescript
// Use `handle` or `on` prefix
const handleSelectEvent = (event: Event) => { };
const handleClickButton = () => { };
const onSelectEvent = (event: Event) => { };
```

### Async Functions
```typescript
// Use async verb as prefix
const fetchEvents = async () => { };
const loadImageAsync = (url: string) => { };
```

### Boolean Variables
```typescript
// Use `is`, `has`, `should` prefix
const isLoading = true;
const hasError = false;
const shouldAutoScroll = true;
```

## 🧵 React Hooks Standards

### Hook Usage Rules

✅ **GOOD:**
```typescript
// Hooks only at component top level
const MyComponent = () => {
  const [count, setCount] = useState(0);        // ✓ Top level
  const memoized = useMemo(() => {}, []);       // ✓ Top level
  
  return <div>{count}</div>;
};
```

❌ **BAD:**
```typescript
// Conditional hook (FORBIDDEN)
const MyComponent = ({ enabled }) => {
  if (enabled) {
    const [count, setCount] = useState(0);  // ✗ Conditional!
  }
  return <div/>;
};

// Hook in loop (FORBIDDEN)
const items = [];
for (let i = 0; i < 3; i++) {
  useState(i);  // ✗ In loop!
}
```

### Hook Dependencies

✅ **GOOD:**
```typescript
// Include all dependencies
useEffect(() => {
  console.log(count, isOpen);
}, [count, isOpen]);  // Both included

// useCallback dependencies
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);  // Value included
```

❌ **BAD:**
```typescript
// Missing dependencies (causes stale closures)
useEffect(() => {
  console.log(count);
}, []);  // Should include count

// Unnecessary dependencies
const handleClick = useCallback(() => {
  console.log('clicked');
}, [count, isOpen, theme]);  // Not used, should be []
```

## 📦 Import Organization

**Order matters for readability:**

```typescript
// 1. React and external libraries
import { useState, useCallback } from 'react';
import { format } from 'date-fns';

// 2. Internal components (relative imports, components before hooks)
import Header from './Header';
import { useCurrentEvent } from '../hooks/useCurrentEvent';

// 3. Type imports (separate for clarity)
import type { Event } from '../types';

// 4. Styles (last)
import './MyComponent.css';
```

## 🎨 Code Formatting

### Comments

✅ **GOOD:**
```typescript
// Check if event is currently happening
const isCurrent = now >= event.start && now < event.end;

/**
 * Converts time string to minutes since midnight
 * @param timeStr - Time in HH:MM format or special values
 * @returns Minutes since midnight, or null for special values
 */
const timeToMinutes = (timeStr: string): number | null => {
  // Implementation
};
```

❌ **BAD:**
```typescript
// FIXME: broken
const isCurrent = now > event.start;  // Vague

// calculate
let x = y * 60 + z;  // What does x represent?

/***/  // Empty doc block
```

### Code Spacing

✅ **GOOD:**
```typescript
// Space around operators
const total = x + y * 2;
const isValid = a === b && c > d;

// Space after keywords
if (condition) {
  doSomething();
}

// Space in object literals
const obj = { name: 'John', age: 30 };

// Logical grouping
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);

const handleClick = () => { };
```

❌ **BAD:**
```typescript
const total=x+y*2;  // No spaces
if(condition){doSomething();}  // Cramped
const obj={name:'John',age:30};  // Hard to read
```

## 🔍 Code Review Checklist

When submitting for review, ensure:

- ✅ No TypeScript errors (`npm run build` passes)
- ✅ Component under 200 lines (or good reason)
- ✅ Props are typed with interfaces
- ✅ Comments explain WHY, not WHAT
- ✅ No `any` types (prefer unions)
- ✅ Hook dependencies correct and complete
- ✅ No console.logs in production
- ✅ Responsive design tested (mobile + desktop)
- ✅ Touch targets ≥ 44px
- ✅ No accessibility violations (color contrast, etc.)

## 🚀 Performance Best Practices

### Memoization

✅ **Use when:**
```typescript
// Expensive calculations
const sorted = useMemo(() => {
  return [...items].sort((a, b) => b.value - a.value);
}, [items]);

// Callbacks passed to children
const handleSelect = useCallback((item) => {
  setSelected(item);
}, []);
```

❌ **Don't use when:**
```typescript
// Simple calculations
const doubled = useMemo(() => count * 2, [count]);  // Overkill

// No dependencies
const data = useMemo(() => fetchData(), []);  // Missing deps
```

### Key Props in Lists

✅ **GOOD:**
```typescript
// Unique, stable keys
{events.map((event) => (
  <EventCard key={event.id} event={event} />
))}
```

❌ **BAD:**
```typescript
// Array index as key (anti-pattern)
{events.map((event, index) => (
  <EventCard key={index} event={event} />
))}

// Non-unique keys
{events.map((event) => (
  <EventCard key={event.title} event={event} />
))}
```

## 🐛 Debugging Standards

### Debug Logging

✅ **GOOD:**
```typescript
// Temporary debug logs with context
if (DEBUG_MODE) {
  console.log('Event found:', { id: event.id, title: event.title });
}

// Structured error logging
console.error('Failed to load events:', { status, error });
```

❌ **BAD:**
```typescript
// Left in production
console.log('test');
console.log('x =', x, 'y =', y, 'z =', z);

// No context
console.log(event);
```

### Error Handling

✅ **GOOD:**
```typescript
try {
  const data = await fetch('/events.json');
  if (!data.ok) throw new Error(`HTTP ${data.status}`);
  return await data.json();
} catch (error) {
  console.error('Failed to load events', error);
  return [];  // Safe fallback
}
```

❌ **BAD:**
```typescript
// Swallowing errors silently
try {
  return await fetch('/events.json').then(r => r.json());
} catch {}  // Silent failure

// Unsafe fallback
try {
  // ...
} catch (error) {
  return error.data;  // Crash if error.data undefined
}
```

## 📖 Documentation Standards

### Inline Comments

Use for:
- ✅ WHY (reasoning behind code)
- ✅ Complex algorithm explanations
- ✅ Non-obvious workarounds
- ❌ NOT WHAT (code explains itself)

```typescript
// ✅ GOOD - explains WHY
// Extend event to next event's start time to handle
// undefined durations (TỐI, KHUYA, HẾT ĐÊM)
if (endMinutes === null) {
  const nextEvent = sortedEvents[currentEventIndex + 1];
  endMinutes = timeToMinutes(nextEvent.startTime) ?? 1440;
}

// ❌ BAD - just restates code
// Set end minutes to next event start time
endMinutes = timeToMinutes(nextEvent.startTime);
```

## 🧪 Testing Standards

### Unit Test Naming

```typescript
describe('timeToMinutes', () => {
  it('should convert "05:00" to 300 minutes', () => {
    expect(timeToMinutes('05:00')).toBe(300);
  });

  it('should return null for "TỐI"', () => {
    expect(timeToMinutes('TỐI')).toBeNull();
  });

  it('should handle single-digit hours', () => {
    expect(timeToMinutes('5:30')).toBe(330);
  });
});
```

### Component Test Structure

```typescript
describe('EventCard', () => {
  describe('rendering', () => {
    it('should display event title');
    it('should show current badge when active');
  });

  describe('user interaction', () => {
    it('should call onSelect when clicked');
  });

  describe('responsive', () => {
    it('should stack vertically on mobile');
  });
});
```

## 🔄 Git Standards

### Commit Messages

✅ **GOOD:**
```
feat: add auto-scroll to current event on load

- Timeline scrolls to current event when component mounts
- Only scrolls once using hasScrolledRef
- Uses smooth scroll behavior for better UX

- Add hasScrolledRef to prevent re-scrolling
- Update Timeline useEffect with proper dependencies
- Test on mobile and desktop viewports

Fixes #42
```

❌ **BAD:**
```
fixed bug
updated code
WIP: changes
feat ai: improved with claude
```

### Branch Naming

```
feature/user-auth              ✓ New feature
bugfix/carousel-crash          ✓ Bug fix
chore/update-dependencies      ✓ Maintenance
docs/add-api-docs              ✓ Documentation
refactor/simplify-timeline     ✓ Code refactoring
```

## 📊 Code Quality Metrics

### Target Metrics
- **TypeScript strict mode**: 100% compliance
- **Unused variables**: 0 allowed
- **Console logs**: 0 in production code
- **Code duplication**: < 5%
- **Function complexity**: < 10 cyclomatic complexity
- **Test coverage**: > 70% for critical functions

## 🔗 Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [FEATURES.md](./FEATURES.md) - Feature descriptions
- [TIME_LOGIC.md](./TIME_LOGIC.md) - Time system explanation
