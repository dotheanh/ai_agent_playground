# Time Logic & Event Duration System

## ⏰ Overview

The application uses a **device-aware time system** that:
- Detects current event based on device clock
- Supports special time values (TỐI, KHUYA, HẾT ĐÊM)
- Extends events with undefined end times to the next event
- Updates every 60 seconds

This design allows users to **simulate different times** by changing device time, making the app responsive to testing scenarios without modifying code.

## 🔢 Time Representation

### Time to Minutes Conversion

All time calculations use **minutes since midnight** (0-1440):

```typescript
const timeToMinutes = (timeStr: string): number | null => {
  // Special values return null (undefined duration)
  if (!timeStr || timeStr === 'TỐI' || timeStr === 'KHUYA' || timeStr === 'HẾT ĐÊM')
    return null;
  
  // Parse HH:MM format
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    return hours * 60 + minutes;  // Convert to minutes
  }
  return null;
};
```

### Examples

| Time String | Result (minutes) | Notes |
|-------------|-----------------|-------|
| "05:00" | 300 | 5 hours × 60 + 0 minutes |
| "19:35" | 1175 | 19 hours × 60 + 35 minutes |
| "22:00" | 1320 | 22 hours × 60 + 0 minutes |
| "TỐI" | null | Evening (undefined duration) |
| "KHUYA" | null | Night (undefined duration) |
| "HẾT ĐÊM" | null | End of night (undefined duration) |

## 🎯 Current Event Detection

### Detection Algorithm

```
1. Get current device time
   now = new Date()
   currentDate = now.toISOString().split('T')[0]

2. Consider the full sorted timeline across dates
   do not filter events by currentDate before matching

3. For each event, determine duration:
   a) If endTime is parseable:
      duration = parse(endTime)
   
   b) If endTime is special (TỐI/KHUYA/HẾT ĐÊM):
      - Find the next event in the sorted timeline
      - If a next event exists:
          duration = startTime of next event, even if it is on a later date
      - If no next event exists:
          duration = 23:59:59 of this event's date

4. Check if current time falls in this event interval:
   return now >= startDateTime && now < endDateTime
```

### Code Implementation

```typescript
const findCurrentEvent = useCallback(() => {
  const now = new Date();

  const sortedEvents = [...events].sort((a, b) => {
    return new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime();
  });

  const event = events.find((eventItem) => {
    const startDateTime = parseDateTime(eventItem.date, eventItem.startTime);
    if (!startDateTime) return false;

    let endDateTime = parseDateTime(eventItem.date, eventItem.endTime);
    if (!endDateTime) {
      const currentEventIndex = sortedEvents.findIndex(ev => ev.id === eventItem.id);
      const nextEvent = sortedEvents[currentEventIndex + 1];
      if (nextEvent) {
        endDateTime = parseDateTime(nextEvent.date, nextEvent.startTime);
      }
    }

    if (!endDateTime) {
      endDateTime = new Date(`${eventItem.date}T23:59:59`);
    }

    return now >= startDateTime && now < endDateTime;
  });

  setCurrentEvent(event || null);
}, [events, selectedEvent]);
```

## 📅 Special Time Values

### TỐI (Evening)
- **Meaning:** Event duration not strictly defined
- **Expected usage:** Evening activities (dinner, free exploration)
- **Behavior:** Extends to the start of the next timeline event, even if that event is on the next day
- **Example:** Event from 19:35 - TỐI → Extends to 05:00 (next day's first event)

### KHUYA (Night)
- **Meaning:** Late night, duration uncertain
- **Expected usage:** Late-night transportation, arrival times
- **Behavior:** Extends to the start of the next timeline event, even if that event is on the next day
- **Example:** Event from 22:00 - KHUYA → Extends to 05:00 next day

### HẾT ĐÊM (End of Night)
- **Meaning:** Activity that ends late/early morning
- **Expected usage:** Overnight events, late-night parties
- **Behavior:** Extends to the start of the next timeline event if one exists, otherwise 23:59:59 of the event date
- **Example:** Event from 18:00 - HẾT ĐÊM (no next event) → Extends to 23:59

## 🔄 Cross-Day Event Handling

### Scenario 1: Event Extends to Next Day's First Event

**Data:**
```json
{
  "id": 1,
  "date": "2026-04-09",
  "startTime": "19:35",
  "endTime": "TỐI",
  "title": "CHILL HOUSE"
}
{
  "id": 2,
  "date": "2026-04-10",
  "startTime": "05:00",
  "endTime": "09:00",
  "title": "KHÁM PHÁ BÌNH MINH"
}
```

**Logic:**
1. Event id=1 has undefined end time (TỐI)
2. Next event in timeline is id=2 (05:00, next day)
3. Duration is calculated as:
   - start = 2026-04-09 19:35
   - end = 2026-04-10 05:00 (start of next event)
4. Event matches if current time is between 19:35 on April 9 and 05:00 on April 10

**Result:** Event spans from April 9 evening into early April 10 morning

### Scenario 2: Multiple Events Same Day

**Data:**
```json
{
  "id": 11,
  "date": "2026-04-10",
  "startTime": "19:30",
  "endTime": "19:50"
}
{
  "id": 12,
  "date": "2026-04-10",
  "startTime": "19:30",
  "endTime": "21:30"
}
{
  "id": 13,
  "date": "2026-04-10",
  "startTime": "21:30",
  "endTime": "22:00"
}
{
  "id": 14,
  "date": "2026-04-10",
  "startTime": "22:00",
  "endTime": "KHUYA"
}
```

**Logic for id=14 (22:00 - KHUYA):**
1. endTime is KHUYA (undefined)
2. Find next event: id=15 (2026-04-11 05:00)
3. Duration is now:
   - start = 2026-04-10 22:00
   - end = 2026-04-11 05:00
4. Event matches for late night on April 10 and early morning on April 11

**Result:** Event extends across midnight into the next day until 05:00 next morning

### Scenario 3: Last Event (No Next Event)

**Data:**
```json
{
  "id": 23,
  "date": "2026-04-11",
  "startTime": "18:00",
  "endTime": "HẾT ĐÊM"
}
```

**Logic:**
1. endTime is HẾT ĐÊM (undefined)
2. No next event in timeline
3. Duration: 18:00 (1080 min) → 23:59 (1440 min)

**Result:** Event occupies from 18:00 to end of day

## ⏲️ Update Frequency

### Polling Strategy
```typescript
useEffect(() => {
  if (events.length === 0) return;
  
  findCurrentEvent();  // Run immediately
  
  // Update every 60 seconds (1 minute)
  const interval = setInterval(findCurrentEvent, 60000);
  
  return () => clearInterval(interval);
}, [events, findCurrentEvent]);
```

**Rationale:**
- 60-second interval balances **responsiveness** vs **performance**
- No need for sub-second precision (users won't see the difference)
- Matches typical UI refresh rates
- Prevents excessive DOM updates

## 🧪 Testing Time Logic

### Device Time Simulation

To test different times **without redeploying**:

1. **Open Browser DevTools** (F12)
2. **Emulate Clock**:
   - Some browsers: Settings → Override device time
   - Or use system clock: Change OS time
   
3. **Observe Changes**:
   - Current event badge appears/disappears
   - Timeline auto-scroll triggers
   - DetailPanel updates
   - Header clock shows new time

### Test Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Device time = 18:35 on 2026-04-09 | Event id=0 is current |
| Device time = 20:00 on 2026-04-09 | Event id=1 is current |
| Device time = 04:59 on 2026-04-10 | Event id=1 still current (TỐI extended) |
| Device time = 05:00 on 2026-04-10 | Event id=2 becomes current |
| Device time = 22:00 on 2026-04-10 | Event id=14 is current |
| Device time = 23:59 on 2026-04-10 | Event id=14 still current |
| Device time = 00:00 on 2026-04-11 | No event current (gap) |
| Device time = 18:00 on 2026-04-11 | Event id=23 is current |

## 🔍 Debugging Tips

### Check Current Time Calculation

Open browser console:
```javascript
// Current time in minutes
const now = new Date();
const minutes = now.getHours() * 60 + now.getMinutes();
console.log(`Current time: ${now.toLocaleTimeString()}`);
console.log(`Minutes since midnight: ${minutes}`);
```

### Check Event Duration

```javascript
// In App.tsx, add temporary log in findCurrentEvent():
const startMinutes = timeToMinutes(e.startTime);
const endMinutes = timeToMinutes(e.endTime);
console.log(`Event ${e.id}: ${startMinutes} - ${endMinutes}`);
console.log(`Current: ${currentTime}, Match: ${currentTime >= startMinutes && currentTime < endMinutes}`);
```

### Check Timeline Sorting

```javascript
// Verify events are sorted
const sorted = [...events].sort((a, b) => {
  const dateA = new Date(`${a.date}T${a.startTime}`);
  const dateB = new Date(`${b.date}T${b.startTime}`);
  return dateA - dateB;
});
sorted.forEach(e => console.log(`${e.id}: ${e.date} ${e.startTime}`));
```

## 🚀 Future Enhancements

### Potential Improvements
1. **Timezone support**: Handle cross-timezone events
2. **Recurring events**: Support repeating daily/weekly activities
3. **Event overlap detection**: Warn if events overlap
4. **Duration validation**: Check event logic in editor
5. **Prettier time display**: Show "in 2 hours" instead of absolute times
6. **Event reminders**: Notify user before event starts
7. **Analytics**: Track which events users view most

### Breaking Changes to Avoid
- Don't change time format (must support 24-hour HH:MM)
- Don't add timezone without migration strategy
- Don't change date format (ISO 8601 YYYY-MM-DD recommended)
- Don't remove special time value support

## 📊 Time System Statistics

From the actual dataset:

| Metric | Value |
|--------|-------|
| Total events | 24 |
| Events with special end times | 3 (id=1, 14, 23) |
| Cross-day events | 1 (id=1 extends to id=2) |
| Same-day special time events | 2 (id=14, 23) |
| Total trip duration | 3 days |
| Earliest start time | 05:00 (April 10) |
| Latest end time | HẾT ĐÊM / 23:59 (April 11) |
