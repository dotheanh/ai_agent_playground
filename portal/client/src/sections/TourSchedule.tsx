import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Ticket, ExternalLink, Sparkles } from 'lucide-react';
import { tourScheduleConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

const TourSchedule = () => {
  // Null check: if config is empty, do not render
  if (tourScheduleConfig.tourDates.length === 0 && !tourScheduleConfig.sectionTitle) {
    return null;
  }

  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
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

    // Parallax background
    const bgST = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        if (bgRef.current) {
          gsap.set(bgRef.current, {
            y: self.progress * 50,
          });
        }
      },
    });

    return () => {
      st.kill();
      bgST.kill();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current?.querySelectorAll('.tour-item') || [],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [isVisible]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on-sale':
        return { text: tourScheduleConfig.statusLabels.onSale, color: 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30' };
      case 'sold-out':
        return { text: tourScheduleConfig.statusLabels.soldOut, color: 'text-crimson bg-crimson/20 border-crimson/30' };
      case 'coming-soon':
        return { text: tourScheduleConfig.statusLabels.comingSoon, color: 'text-amber-400 bg-amber-400/20 border-amber-400/30' };
      default:
        return { text: tourScheduleConfig.statusLabels.default, color: 'text-gray-400 bg-gray-400/20 border-gray-400/30' };
    }
  };

  const TOUR_DATES = tourScheduleConfig.tourDates;

  return (
    <section
      id="tour"
      ref={sectionRef}
      className="relative w-full min-h-screen bg-[#0a0505] py-20 overflow-hidden"
    >
      {/* Animated background */}
      <div ref={bgRef} className="absolute inset-0 z-0 will-change-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-crimson/5 via-transparent to-crimson-blood/10" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-crimson/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-crimson/10 rounded-full blur-3xl" />
      </div>

      {/* Rotating spinner disc */}
      {tourScheduleConfig.vinylImage && (
        <div className="absolute top-20 right-20 w-64 h-64 md:w-80 md:h-80 z-10 opacity-60">
          <img
            src={tourScheduleConfig.vinylImage}
            alt="AI Core"
            className="w-full h-full animate-spin-slow"
          />
        </div>
      )}

      {/* Content container */}
      <div ref={contentRef} className="relative z-20 max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="mb-16">
          <p className="font-mono-custom text-xs text-crimson/60 uppercase tracking-wider mb-2">
            {tourScheduleConfig.sectionLabel}
          </p>
          <h2 className="font-display text-5xl md:text-7xl text-white">
            {tourScheduleConfig.sectionTitle}
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Venue preview */}
          {TOUR_DATES.length > 0 && (
            <div className="hidden lg:flex lg:items-center">
              <div className="sticky top-32 w-full aspect-[4/3] rounded-2xl overflow-hidden bg-void-black/50 border border-crimson/20">
                <img
                  src={TOUR_DATES[activeVenue]?.image}
                  alt={TOUR_DATES[activeVenue]?.venue}
                  className="w-full h-full object-cover transition-opacity duration-500"
                />

                {/* Venue info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-void-black to-transparent">
                  <p className="font-display text-2xl text-white">
                    {TOUR_DATES[activeVenue]?.venue}
                  </p>
                  <p className="font-mono-custom text-sm text-crimson-light/70">
                    {TOUR_DATES[activeVenue]?.city}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Right: Tour list */}
          <div className="space-y-4">
            {TOUR_DATES.map((tour, index) => {
              const status = getStatusLabel(tour.status);

              return (
                <div
                  key={tour.id}
                  className="tour-item group relative p-6 rounded-xl bg-void-black/50 backdrop-blur-sm border border-crimson/10 hover:border-crimson/30 hover:bg-void-black/80 transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveVenue(index)}
                  onMouseLeave={() => setActiveVenue(0)}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Date */}
                    <div className="flex-shrink-0 w-28">
                      <p className="font-mono-custom text-2xl font-bold text-white">
                        {tour.date}
                      </p>
                      <p className="font-mono-custom text-xs text-crimson/50">
                        {tour.time}
                      </p>
                    </div>

                    {/* Venue info */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-crimson/50" />
                        <span className="font-display text-lg text-white">
                          {tour.city}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 ml-6">
                        {tour.venue}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                        {status.text}
                      </span>
                    </div>

                    {/* Action button */}
                    <div className="flex-shrink-0">
                      {tour.status === 'on-sale' ? (
                        <button className="flex items-center gap-2 px-4 py-2 bg-crimson text-white rounded-full text-sm font-medium hover:bg-crimson-light transition-colors hover:shadow-glow-red">
                          <Ticket className="w-4 h-4" />
                          <span>{tourScheduleConfig.buyButtonText}</span>
                        </button>
                      ) : (
                        <button className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white/60 rounded-full text-sm hover:border-crimson/40 hover:text-crimson transition-colors">
                          <ExternalLink className="w-4 h-4" />
                          <span>{tourScheduleConfig.detailsButtonText}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-crimson rounded-full group-hover:h-12 transition-all duration-300 shadow-glow" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="font-mono-custom text-sm text-white/60 mb-4">
            {tourScheduleConfig.bottomNote}
          </p>
          <button className="px-8 py-4 bg-crimson text-white font-display text-sm uppercase tracking-wider rounded-full hover:bg-crimson-light transition-colors hover:shadow-glow-red">
            {tourScheduleConfig.bottomCtaText}
          </button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-crimson/30 to-transparent" />
    </section>
  );
};

export default TourSchedule;
