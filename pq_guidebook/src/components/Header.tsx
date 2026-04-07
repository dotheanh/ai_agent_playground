import { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock } from 'lucide-react';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <header className="h-16 lg:h-20 glass-card border-b border-cyan-500/20 sticky top-0 z-50">
      <div className="h-full max-w-full px-3 lg:px-8 flex items-center justify-between">
        {/* Left - Clock and Date */}
        <div className="flex items-center gap-2 lg:gap-8">
          {/* Real-time Clock */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
            <span className="clock-display hidden sm:inline text-sm lg:text-base">
              {formatTime(currentTime)}
            </span>
            <span className="text-sm lg:text-lg font-mono font-bold text-cyan-400 sm:hidden">
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          </div>
          
          {/* Current Date */}
          <div className="flex items-center gap-2 text-cream/80">
            <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="text-xs lg:text-sm font-medium">
              {formatDate(currentTime)}
            </span>
          </div>
        </div>

        {/* Center - Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Phú Quốc Trip
          </h1>
          <p className="text-xs text-cream/60 hidden sm:block">09 - 11/04/2026</p>
        </div>

        {/* Right - Location */}
        <div className="flex items-center gap-2 text-cream/70">
          <MapPin className="w-3 h-3 lg:w-4 lg:h-4 text-cyan-400" />
          <span className="text-xs lg:text-sm hidden md:inline">Phú Quốc, Việt Nam</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
