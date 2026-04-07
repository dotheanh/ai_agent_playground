import { useState, useEffect } from 'react';
import type { DetailPanelProps } from '../types';
import { 
  MapPin, 
  FileText, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Globe,
  Facebook,
  Home,
  Video,
  ArrowRight
} from 'lucide-react';

const DetailPanel = ({ event, isCurrent, events, onSelectEvent }: DetailPanelProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when event changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [event?.id]);

  // Ensure currentImageIndex is valid for current event
  const safeImageIndex = event ? Math.min(currentImageIndex, event.images.length - 1 || 0) : 0;

  // Format time display
  const formatTime = (start: string, end: string) => {
    if (end === 'TỐI' || end === 'KHUYA') {
      return `${start} → ${end}`;
    }
    return `${start} - ${end}`;
  };

  // Find next event
  const getNextEvent = () => {
    if (!event || !events.length) return null;
    
    // Sort events by date and time
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });
    
    const currentIndex = sortedEvents.findIndex(e => e.id === event.id);
    if (currentIndex === -1 || currentIndex === sortedEvents.length - 1) return null;
    
    return sortedEvents[currentIndex + 1];
  };

  const nextEvent = getNextEvent();

  if (!event) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-cream mb-2">
            Chào mừng đến Phú Quốc!
          </h3>
          <p className="text-cream/60 max-w-md">
            Chọn một hoạt động từ timeline bên trái để xem chi tiết lịch trình của bạn.
          </p>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    if (event.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length);
    }
  };

  const prevImage = () => {
    if (event.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + event.images.length) % event.images.length);
    }
  };

  // Format notes with line breaks
  const formatNotes = (notes: string) => {
    if (!notes || notes === 'nan') return null;
    return notes.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      
      if (trimmed.startsWith('-') || trimmed.startsWith('+')) {
        return (
          <p key={idx} className="text-cream/80 text-sm mb-1 flex items-start gap-2">
            <span className="text-cyan-400 mt-1">•</span>
            <span>{trimmed.replace(/^[-+]+\s*/, '')}</span>
          </p>
        );
      }
      
      return (
        <p key={idx} className="text-cream/80 text-sm mb-1">
          {trimmed}
        </p>
      );
    });
  };

  // Format description
  const formatDescription = (desc: string) => {
    if (!desc || desc === 'nan') return null;
    return desc.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <p key={idx} className="text-cream/80 text-sm mb-1 flex items-start gap-2">
            <span className="text-cyan-400 mt-1">•</span>
            <span>{trimmed.replace(/^[-*]\s*/, '')}</span>
          </p>
        );
      }
      
      if (trimmed.includes('http')) {
        return null;
      }
      
      return (
        <p key={idx} className={`text-cream/90 mb-1 ${trimmed.includes('---') ? 'font-semibold text-cyan-400' : ''}`}>
          {trimmed}
        </p>
      );
    });
  };

  // Extract map links from notes and mapLink
  const getMapLinks = () => {
    const links: string[] = [];
    
    if (event.mapLink && event.mapLink.includes('http')) {
      const urlMatch = event.mapLink.match(/https?:\/\/[^\s]+/);
      if (urlMatch) links.push(urlMatch[0]);
    }
    
    if (event.notes && event.notes.includes('http')) {
      const urlMatches = event.notes.match(/https?:\/\/[^\s]+/g);
      if (urlMatches) links.push(...urlMatches);
    }
    
    if (event.fullDescription && event.fullDescription.includes('http')) {
      const urlMatches = event.fullDescription.match(/https?:\/\/[^\s]+/g);
      if (urlMatches) links.push(...urlMatches);
    }
    
    return [...new Set(links)];
  };

  const mapLinks = getMapLinks();

  return (
    <div className="fade-in">
      {/* Current Event Badge */}
      {isCurrent && (
        <div className="mb-4 flex items-center gap-2">
          <span className="px-3 py-1.5 lg:px-3 lg:py-1 bg-coral text-white text-sm rounded-full font-medium animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            Đang diễn ra
          </span>
        </div>
      )}

      {/* Time and Location */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-4 mb-4 lg:mb-6">
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="text-sm lg:text-base font-medium">
            {formatTime(event.startTime, event.endTime)}
          </span>
        </div>
        {event.mapLink && (
          <a
            href={event.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-cream/70 hover:text-cyan-400 transition-colors group touch-manipulation"
          >
            <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm underline">Xem bản đồ</span>
          </a>
        )}
      </div>

      {/* Image Carousel */}
      {event.images.length > 0 && (
        <div className="carousel-container mb-6 aspect-video bg-ocean-dark/50">
          <img
            src={event.images[safeImageIndex]}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/phuquoc-beach.jpg';
            }}
          />
          
          {/* Navigation arrows */}
          {event.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 lg:left-2 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-10 lg:h-10 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 flex items-center justify-center text-white transition-colors touch-manipulation"
              >
                <ChevronLeft className="w-6 h-6 lg:w-6 lg:h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 lg:right-2 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-10 lg:h-10 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 flex items-center justify-center text-white transition-colors touch-manipulation"
              >
                <ChevronRight className="w-6 h-6 lg:w-6 lg:h-6" />
              </button>
              
              {/* Image indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {event.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-1 h-1 lg:w-2 lg:h-2 rounded-full transition-colors touch-manipulation ${
                      idx === safeImageIndex ? 'bg-cyan-400' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Image caption */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-sm font-medium">
              {event.title}
            </p>
          </div>
        </div>
      )}

      {/* Event Title */}
      <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold text-cream mb-3 lg:mb-4 leading-tight">
        {event.title}
      </h2>

      {/* Description */}
      {event.fullDescription && event.fullDescription !== 'nan' && (
        <div className="glass-card p-4 lg:p-4 mb-4 lg:mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
            <h3 className="text-sm lg:text-base text-cream font-semibold">Mô tả</h3>
          </div>
          <div className="space-y-1">
            {formatDescription(event.fullDescription)}
          </div>
        </div>
      )}

      {/* Notes */}
      {event.notes && event.notes !== 'nan' && (
        <div className="glass-card p-4 lg:p-4 mb-4 lg:mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
            <h3 className="text-sm lg:text-base text-cream font-semibold">Ghi chú</h3>
          </div>
          <div className="space-y-1">
            {formatNotes(event.notes)}
          </div>
        </div>
      )}

      {/* External Links Section */}
      {(event.externalLinks && event.externalLinks.length > 0) || mapLinks.length > 0 ? (
        <div className="glass-card p-4 lg:p-4">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
            <h3 className="text-sm lg:text-base text-cream font-semibold">Liên kết</h3>
          </div>
          <div className="flex flex-col gap-2">
            {/* Map Links */}
            {mapLinks.map((link, idx) => (
              <a
                key={`map-${idx}`}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="map-link touch-manipulation"
              >
                <MapPin className="w-4 h-4" />
                Google Maps {mapLinks.length > 1 ? idx + 1 : ''}
              </a>
            ))}
            
            {/* External Links from event data */}
            {event.externalLinks?.map((link, idx) => {
              if (link.type === 'website') {
                return (
                  <a
                    key={`web-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="website-link touch-manipulation"
                  >
                    <Globe className="w-4 h-4" />
                    {link.label}
                  </a>
                );
              }
              if (link.type === 'facebook') {
                return (
                  <a
                    key={`fb-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="facebook-link touch-manipulation"
                  >
                    <Facebook className="w-4 h-4" />
                    {link.label}
                  </a>
                );
              }
              if (link.type === 'airbnb') {
                return (
                  <a
                    key={`airbnb-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="airbnb-link touch-manipulation"
                  >
                    <Home className="w-4 h-4" />
                    {link.label}
                  </a>
                );
              }
              if (link.type === 'tiktok') {
                return (
                  <a
                    key={`tiktok-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tiktok-link"
                  >
                    <Video className="w-4 h-4" />
                    {link.label}
                  </a>
                );
              }
              return (
                <a
                  key={`ext-${idx}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  <ExternalLink className="w-4 h-4" />
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Next Event Button - Mobile Only */}
      {nextEvent && (
        <div className="lg:hidden mt-6">
          <button
            onClick={() => onSelectEvent(nextEvent)}
            className="w-full glass-card p-4 hover-lift transition-all duration-300 touch-manipulation flex items-center justify-center gap-3 group"
          >
            <span className="text-sm lg:text-base text-cream font-medium">
              Tiếp theo: {nextEvent.title}
            </span>
            <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DetailPanel;
