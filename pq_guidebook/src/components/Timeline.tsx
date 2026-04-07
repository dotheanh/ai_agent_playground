import { useMemo, useRef, useEffect } from 'react';
import type { TimelineProps } from '../types';
import { 
  Plane, 
  Home, 
  Sun, 
  Car, 
  Hotel, 
  Sparkles, 
  MapPin, 
  Utensils, 
  Fish,
  Palmtree,
  Gamepad2,
  GlassWater,
  Landmark,
  Star
} from 'lucide-react';

const Timeline = ({ events, selectedEvent, currentEvent, onSelectEvent }: TimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentNodeRef = useRef<HTMLDivElement>(null);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: typeof events } = {};
    events.forEach(event => {
      if (!groups[event.date]) {
        groups[event.date] = [];
      }
      groups[event.date].push(event);
    });
    return groups;
  }, [events]);

  // Get icon based on event title
  const getEventIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('sân bay') || lowerTitle.includes('phú quốc') || lowerTitle.includes('=>')) return <Plane className="w-4 h-4" />;
    if (lowerTitle.includes('chill house') || lowerTitle.includes('homestay') || lowerTitle.includes('nhận phòng')) return <Home className="w-4 h-4" />;
    if (lowerTitle.includes('bình minh') || lowerTitle.includes('rạch vẹm') || lowerTitle.includes('sao biển')) return <Sun className="w-4 h-4" />;
    if (lowerTitle.includes('di chuyển') || lowerTitle.includes('taxi') || lowerTitle.includes('vinbus')) return <Car className="w-4 h-4" />;
    if (lowerTitle.includes('mimosa') || lowerTitle.includes('sunset') || lowerTitle.includes('khách sạn')) return <Hotel className="w-4 h-4" />;
    if (lowerTitle.includes('nghỉ ngơi') || lowerTitle.includes('tắm rửa') || lowerTitle.includes('make up')) return <Sparkles className="w-4 h-4" />;
    if (lowerTitle.includes('bãi khem') || lowerTitle.includes('check in')) return <MapPin className="w-4 h-4" />;
    if (lowerTitle.includes('ăn') || lowerTitle.includes('nhà hàng')) return <Utensils className="w-4 h-4" />;
    if (lowerTitle.includes('show') || lowerTitle.includes('pháo hoa') || lowerTitle.includes('cầu hôn')) return <Star className="w-4 h-4" />;
    if (lowerTitle.includes('vinwonder') || lowerTitle.includes('chơi')) return <Gamepad2 className="w-4 h-4" />;
    if (lowerTitle.includes('thủy cung') || lowerTitle.includes('cá')) return <Fish className="w-4 h-4" />;
    if (lowerTitle.includes('grand world') || lowerTitle.includes('tham quan')) return <Landmark className="w-4 h-4" />;
    if (lowerTitle.includes('biển') || lowerTitle.includes('bãi')) return <Palmtree className="w-4 h-4" />;
    return <GlassWater className="w-4 h-4" />;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return {
      dayName: days[date.getDay()],
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    };
  };

  // Format time display
  const formatTime = (start: string, end: string) => {
    if (end === 'TỐI' || end === 'KHUYA') {
      return `${start} → ${end}`;
    }
    return `${start} - ${end}`;
  };

  // Scroll to current event
  useEffect(() => {
    if (currentNodeRef.current && timelineRef.current) {
      currentNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentEvent]);

  return (
    <div className="p-3 lg:p-6" ref={timelineRef}>
      <h2 className="text-lg lg:text-xl font-bold text-cream mb-4 lg:mb-6 flex items-center gap-2">
        <span className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
          <span className="text-white text-xs lg:text-sm">📅</span>
        </span>
        Lịch Trình
      </h2>

      <div className="timeline-container">
        <div className="timeline-line"></div>

        {Object.entries(groupedEvents).map(([date, dayEvents]) => {
          const dateInfo = formatDate(date);
          
          return (
            <div key={date} className="mb-6">
              {/* Date Header - Breakline on mobile */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3 mb-4 ml-2">
                <span className="date-badge">
                  {dateInfo.dayName}
                </span>
                <span className="text-cream/70 text-sm">
                  {dateInfo.date}
                </span>
              </div>

              {/* Events for this date */}
              {dayEvents.map((event) => {
                const isSelected = selectedEvent?.id === event.id;
                const isCurrent = currentEvent?.id === event.id;
                
                return (
                  <div
                    key={event.id}
                    ref={isCurrent ? currentNodeRef : null}
                    className={`
                      timeline-node 
                      ${isSelected ? 'active' : ''} 
                      ${isCurrent ? 'current' : ''}
                    `}
                    onClick={() => onSelectEvent(event)}
                  >
                    <div className={`
                      glass-card p-4 lg:p-3 hover-lift cursor-pointer transition-all duration-300
                      ${isSelected ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/20' : ''}
                      ${isCurrent ? 'ring-2 ring-coral shadow-lg shadow-coral/20' : ''}
                      min-h-[80px] lg:min-h-[60px] flex flex-col justify-center
                    `}>
                      {/* Time */}
                      <div className="flex items-center gap-2 mb-2 lg:mb-2">
                        <span className="time-display text-sm lg:text-sm">
                          {formatTime(event.startTime, event.endTime)}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-1 lg:px-2 lg:py-0.5 bg-coral text-white text-xs rounded-full font-medium animate-pulse">
                            Đang diễn ra
                          </span>
                        )}
                      </div>

                      {/* Title with icon */}
                      <div className="flex items-start gap-3 lg:gap-2">
                        <span className="mt-0.5 lg:mt-0.5 text-cyan-400 flex-shrink-0">
                          {getEventIcon(event.title)}
                        </span>
                        <h3 className="text-sm lg:text-sm font-medium leading-tight line-clamp-2 flex-1">
                          {event.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Current Time Marker */}
        {currentEvent && (
          <div 
            className="current-time-marker"
            style={{ top: '0' }}
            title="Thời điểm hiện tại"
          >
            NOW
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
