import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart, Sparkles, Gift, MessageCircle, Send } from 'lucide-react';
import { tourScheduleConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

const TourSchedule = () => {
  // Null check: if config is empty, do not render
  if (tourScheduleConfig.tourDates.length === 0 && !tourScheduleConfig.sectionTitle) {
    return null;
  }

  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeVenue, setActiveVenue] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      onEnter: () => setIsVisible(true),
    });

    scrollTriggerRef.current = st;

    return () => {
      st.kill();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current?.querySelectorAll('.tour-item') || [],
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [isVisible]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on-sale':
        return { text: tourScheduleConfig.statusLabels.onSale, color: 'text-pink-600 bg-pink-100' };
      case 'sold-out':
        return { text: tourScheduleConfig.statusLabels.soldOut, color: 'text-rose-600 bg-rose-100' };
      case 'coming-soon':
        return { text: tourScheduleConfig.statusLabels.comingSoon, color: 'text-amber-600 bg-amber-100' };
      default:
        return { text: tourScheduleConfig.statusLabels.default, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const TOUR_DATES = tourScheduleConfig.tourDates;

  return (
    <section
      id="wishes"
      ref={sectionRef}
      className="relative w-full min-h-screen bg-gradient-to-br from-pink-200 via-pink-100 to-pink-50 py-20 overflow-hidden"
    >
      {/* Floating hearts background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Heart className="absolute top-20 left-[10%] w-12 h-12 text-pink-300/40 fill-pink-300/40 animate-heart-float" />
        <Heart className="absolute top-40 right-[15%] w-8 h-8 text-pink-400/30 fill-pink-400/30 animate-heart-float" style={{ animationDelay: '0.5s' }} />
        <Heart className="absolute bottom-40 left-[20%] w-10 h-10 text-pink-300/40 fill-pink-300/40 animate-heart-float" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute top-1/3 right-[8%] w-10 h-10 text-pink-400/30 animate-sparkle" />
        <Heart className="absolute bottom-1/4 right-[25%] w-14 h-14 text-pink-300/30 fill-pink-300/30 animate-heart-float" style={{ animationDelay: '0.8s' }} />
      </div>

      {/* Rotating heart disc */}
      {tourScheduleConfig.vinylImage && (
        <div className="absolute top-20 right-20 w-48 h-48 md:w-64 md:h-64 z-10 opacity-60">
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl shadow-pink-300/30 animate-spin-slow">
            <img
              src={tourScheduleConfig.vinylImage}
              alt="Heart Disc"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-pink-500/20">
              <Heart className="w-16 h-16 text-white fill-white/80" />
            </div>
          </div>
        </div>
      )}

      {/* Content container */}
      <div ref={contentRef} className="relative z-20 max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400 animate-pulse-heart" />
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500 animate-pulse-heart" style={{ animationDelay: '0.2s' }} />
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400 animate-pulse-heart" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="font-cute text-xs text-pink-500 uppercase tracking-wider mb-2">
            {tourScheduleConfig.sectionLabel}
          </p>
          <h2 className="font-display text-5xl md:text-7xl text-pink-500 gradient-text">
            {tourScheduleConfig.sectionTitle}
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Wish preview */}
          {TOUR_DATES.length > 0 && (
            <div className="hidden lg:flex lg:items-center">
              <div className="sticky top-32 w-full aspect-[4/3] rounded-3xl overflow-hidden bg-white/50 border-4 border-white shadow-xl shadow-pink-200/50">
                <img
                  src={TOUR_DATES[activeVenue]?.image}
                  alt={TOUR_DATES[activeVenue]?.venue}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />

                {/* Wish info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-pink-500/80 to-transparent">
                  <p className="font-display text-2xl text-white flex items-center gap-2">
                    <Heart className="w-6 h-6 fill-white" />
                    {TOUR_DATES[activeVenue]?.venue}
                  </p>
                  <p className="font-cute text-sm text-white/90 ml-8">
                    {TOUR_DATES[activeVenue]?.city}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Right: Wishes list */}
          <div className="space-y-4">
            {TOUR_DATES.map((tour, index) => {
              const status = getStatusLabel(tour.status);

              return (
                <div
                  key={tour.id}
                  className="tour-item group relative p-6 rounded-2xl bg-white/70 backdrop-blur-sm border-2 border-pink-200 hover:border-pink-400 hover:bg-white/90 transition-all duration-300 cursor-pointer shadow-lg shadow-pink-100/50 hover:shadow-xl hover:shadow-pink-200/50"
                  onMouseEnter={() => setActiveVenue(index)}
                  onMouseLeave={() => setActiveVenue(0)}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Date */}
                    <div className="flex-shrink-0 w-28">
                      <p className="font-cute text-2xl font-bold text-pink-500">
                        {tour.date.split('.').slice(1).join('.')}
                      </p>
                      <p className="font-cute text-xs text-pink-400/70">
                        {tour.date.split('.')[0]}
                      </p>
                    </div>

                    {/* Wish info */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className="w-4 h-4 text-pink-400" />
                        <span className="font-display text-lg text-pink-600">
                          {tour.city}
                        </span>
                      </div>
                      <p className="text-sm text-pink-500/70 ml-6">
                        {tour.venue}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-pink-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-cute text-sm">{tour.time}</span>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                        <Heart className="w-3 h-3" />
                        {status.text}
                      </span>
                    </div>

                    {/* Action button */}
                    <div className="flex-shrink-0">
                      {tour.status === 'on-sale' ? (
                        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-full text-sm font-medium hover:from-pink-500 hover:to-pink-600 transition-all shadow-md shadow-pink-300/50 hover:shadow-lg hover:shadow-pink-400/50">
                          <MessageCircle className="w-4 h-4" />
                          <span>{tourScheduleConfig.buyButtonText}</span>
                        </button>
                      ) : (
                        <button className="flex items-center gap-2 px-4 py-2 border-2 border-pink-300 text-pink-500 rounded-full text-sm hover:border-pink-400 hover:bg-pink-50 transition-colors">
                          <Send className="w-4 h-4" />
                          <span>{tourScheduleConfig.detailsButtonText}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-0 bg-gradient-to-b from-pink-400 to-pink-500 rounded-full group-hover:h-12 transition-all duration-300" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="font-cute text-sm text-pink-500/70 mb-4">
            {tourScheduleConfig.bottomNote}
          </p>
          <button className="btn-cute flex items-center gap-2 mx-auto">
            <Heart className="w-5 h-5" />
            {tourScheduleConfig.bottomCtaText}
          </button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />
    </section>
  );
};

export default TourSchedule;
