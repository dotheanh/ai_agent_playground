import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Timeline from './components/Timeline';
import DetailPanel from './components/DetailPanel';
import type { Event } from './types';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'detail'>('timeline');

  // Load events data
  useEffect(() => {
    fetch('/events-data.json')
      .then(res => res.json())
      .then((data: Event[]) => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load events:', err);
        setLoading(false);
      });
  }, []);

  // Custom event selection handler for mobile
  const handleSelectEvent = useCallback((event: Event) => {
    setSelectedEvent(event);
    // On mobile, switch to detail view when selecting an event
    if (window.innerWidth < 1024) {
      setViewMode('detail');
    }
  }, []);
  const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    const hour = match[1].padStart(2, '0');
    const minute = match[2];
    return new Date(`${dateStr}T${hour}:${minute}`);
  };

  const findCurrentEvent = useCallback(() => {
    const now = new Date();

    // Sort events by date + time
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`).getTime();
      const dateB = new Date(`${b.date}T${b.startTime}`).getTime();
      return dateA - dateB;
    });

    const getEventInterval = (event: Event) => {
      const startDateTime = parseDateTime(event.date, event.startTime);
      if (!startDateTime) return null;

      let endDateTime = parseDateTime(event.date, event.endTime);

      if (!endDateTime) {
        const currentEventIndex = sortedEvents.findIndex(ev => ev.id === event.id);
        if (currentEventIndex !== -1 && currentEventIndex < sortedEvents.length - 1) {
          const nextEvent = sortedEvents[currentEventIndex + 1];
          const nextStart = parseDateTime(nextEvent.date, nextEvent.startTime);
          if (nextStart) {
            endDateTime = nextStart;
          }
        }
      }

      if (!endDateTime) {
        endDateTime = new Date(`${event.date}T23:59:59`);
      }

      return { startDateTime, endDateTime };
    };

    const event = events.find(e => {
      const interval = getEventInterval(e);
      if (!interval) return false;
      return now >= interval.startDateTime && now < interval.endDateTime;
    });

    setCurrentEvent(event || null);

    if (event && !selectedEvent) {
      setSelectedEvent(event);
    }
  }, [events, selectedEvent]);

  // Update current event every 5 seconds for better responsiveness
  useEffect(() => {
    if (events.length === 0) return;

    findCurrentEvent();
    const interval = setInterval(findCurrentEvent, 5000); // 5000ms = 5 seconds

    return () => clearInterval(interval);
  }, [events, findCurrentEvent]);

  // Also update when window becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        findCurrentEvent(); // Update immediately when user returns to tab
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [findCurrentEvent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-400">Đang tải lịch trình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Ocean Wave Background */}
      <div className="ocean-bg">
        <div className="light-rays"></div>
        <div className="bubbles">
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
        </div>
        <div className="ocean-wave"></div>
        <div className="ocean-wave"></div>
        <div className="ocean-wave"></div>
      </div>

      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
        {/* Mobile: Tab-based navigation */}
        <div className="lg:hidden">
          <div className="flex border-b border-cyan-500/20 bg-ocean-dark/80 backdrop-blur-sm">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex-1 py-3 px-4 text-center transition-colors ${
                viewMode === 'timeline' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-cream/60'
              }`}
            >
              <span className="text-sm font-medium">Lịch trình</span>
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`flex-1 py-3 px-4 text-center transition-colors ${
                viewMode === 'detail' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-cream/60'
              }`}
            >
              <span className="text-sm font-medium">Chi tiết</span>
            </button>
          </div>
        </div>

        {/* Left Column - Timeline */}
        <div className={`w-full lg:w-5/12 xl:w-1/3 h-[100vh] lg:h-[calc(100vh-80px)] overflow-y-auto ${
          viewMode === 'detail' ? 'hidden lg:block' : 'block'
        }`}>
          <Timeline
            events={events}
            selectedEvent={selectedEvent}
            currentEvent={currentEvent}
            onSelectEvent={handleSelectEvent}
          />
        </div>

        {/* Right Column - Detail Panel */}
        <div className={`w-full lg:w-7/12 xl:w-2/3 h-[100vh] lg:h-[calc(100vh-80px)] overflow-y-auto p-4 lg:p-6 ${
          viewMode === 'timeline' ? 'hidden lg:block' : 'block'
        }`}>
          <DetailPanel
            event={selectedEvent}
            isCurrent={selectedEvent?.id === currentEvent?.id}
            events={events}
            onSelectEvent={handleSelectEvent}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
