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

  // Find current event based on real time
  const findCurrentEvent = useCallback(() => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const event = events.find(e => {
      if (e.date !== currentDate) return false;
      
      const startMinutes = timeToMinutes(e.startTime);
      const endMinutes = timeToMinutes(e.endTime);
      
      if (startMinutes === null) return false;
      if (endMinutes === null) return currentTime >= startMinutes;
      
      return currentTime >= startMinutes && currentTime < endMinutes;
    });

    setCurrentEvent(event || null);
    
    // Auto-select current event if none selected
    if (event && !selectedEvent) {
      setSelectedEvent(event);
    }
  }, [events, selectedEvent]);

  // Convert time string to minutes
  const timeToMinutes = (timeStr: string): number | null => {
    if (!timeStr || timeStr === 'TỐI' || timeStr === 'KHUYA') return null;
    
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return null;
  };

  // Update current event every minute
  useEffect(() => {
    if (events.length === 0) return;
    
    findCurrentEvent();
    const interval = setInterval(findCurrentEvent, 60000);
    
    return () => clearInterval(interval);
  }, [events, findCurrentEvent]);

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
        {/* Left Column - Timeline */}
        <div className="w-full lg:w-5/12 xl:w-1/3 h-[50vh] lg:h-[calc(100vh-80px)] overflow-y-auto">
          <Timeline 
            events={events}
            selectedEvent={selectedEvent}
            currentEvent={currentEvent}
            onSelectEvent={setSelectedEvent}
          />
        </div>
        
        {/* Right Column - Detail Panel */}
        <div className="w-full lg:w-7/12 xl:w-2/3 h-[50vh] lg:h-[calc(100vh-80px)] overflow-y-auto p-4 lg:p-6">
          <DetailPanel 
            event={selectedEvent}
            isCurrent={selectedEvent?.id === currentEvent?.id}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
