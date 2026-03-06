import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart, ArrowRight, Sparkles } from 'lucide-react';
import { parallaxGalleryConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

const ParallaxGallery = () => {
  // Null check: if config is empty, do not render
  if (
    parallaxGalleryConfig.parallaxImagesTop.length === 0 &&
    parallaxGalleryConfig.galleryImages.length === 0 &&
    !parallaxGalleryConfig.sectionTitle
  ) {
    return null;
  }

  const sectionRef = useRef<HTMLDivElement>(null);
  const parallaxContainerRef = useRef<HTMLDivElement>(null);
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRefs = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax strips animation
      if (topRowRef.current && bottomRowRef.current) {
        const st1 = ScrollTrigger.create({
          trigger: parallaxContainerRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          onUpdate: (self) => {
            const progress = self.progress;
            if (topRowRef.current) {
              gsap.set(topRowRef.current, {
                x: -progress * 300,
              });
            }
            if (bottomRowRef.current) {
              gsap.set(bottomRowRef.current, {
                x: progress * 300 - 150,
              });
            }
          },
        });
        scrollTriggerRefs.current.push(st1);
      }

      // Horizontal gallery scroll
      if (galleryRef.current && galleryTrackRef.current) {
        const trackWidth = galleryTrackRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;

        const st2 = ScrollTrigger.create({
          trigger: galleryRef.current,
          start: 'top top',
          end: () => `+=${trackWidth - viewportWidth}`,
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            if (galleryTrackRef.current) {
              const x = -self.progress * (trackWidth - viewportWidth);
              gsap.set(galleryTrackRef.current, { x });
            }
          },
        });
        scrollTriggerRefs.current.push(st2);
      }
    }, sectionRef);

    return () => {
      ctx.revert();
      scrollTriggerRefs.current.forEach(st => st.kill());
      scrollTriggerRefs.current = [];
    };
  }, []);

  const scrollToTour = () => {
    const tourSection = document.getElementById('wishes');
    if (tourSection) {
      tourSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative w-full bg-gradient-to-b from-pink-50 via-white to-pink-100"
    >
      {/* Parallax Strips Section */}
      <div
        ref={parallaxContainerRef}
        className="relative py-20 overflow-hidden"
      >
        {/* Section header */}
        <div className="px-12 mb-12 text-center">
          <p className="font-cute text-xs text-pink-400 uppercase tracking-wider mb-2">
            {parallaxGalleryConfig.sectionLabel}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-pink-500 gradient-text">
            {parallaxGalleryConfig.sectionTitle}
          </h2>
          <div className="flex justify-center gap-2 mt-4">
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400 animate-pulse-heart" />
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500 animate-pulse-heart" style={{ animationDelay: '0.2s' }} />
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400 animate-pulse-heart" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        {/* Top row - moves left */}
        <div
          ref={topRowRef}
          className="flex gap-6 mb-6 will-change-transform px-4"
        >
          {parallaxGalleryConfig.parallaxImagesTop.map((image) => (
            <div
              key={image.id}
              className="relative flex-shrink-0 w-[280px] h-[280px] overflow-hidden rounded-3xl photo-grid-item"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-500/30 to-transparent" />
              <div className="absolute top-3 right-3">
                <Heart className="w-6 h-6 text-white fill-white/80" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row - moves right */}
        <div
          ref={bottomRowRef}
          className="flex gap-6 will-change-transform px-4"
          style={{ transform: 'translateX(-150px)' }}
        >
          {parallaxGalleryConfig.parallaxImagesBottom.map((image) => (
            <div
              key={image.id}
              className="relative flex-shrink-0 w-[280px] h-[280px] overflow-hidden rounded-3xl photo-grid-item"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-500/30 to-transparent" />
              <div className="absolute top-3 right-3">
                <Heart className="w-6 h-6 text-white fill-white/80" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Section */}
      <div className="relative py-8 bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200 overflow-hidden border-y-4 border-pink-200/50">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="flex items-center gap-8 mx-8 text-2xl font-display text-pink-500"
            >
              {parallaxGalleryConfig.marqueeTexts.map((text, j) => (
                <span key={j} className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-pink-400" />
                  {text}
                  <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Horizontal Gallery Section */}
      <div
        ref={galleryRef}
        className="relative h-screen overflow-hidden bg-gradient-to-b from-pink-100 to-white"
      >
        {/* Gallery header */}
        <div className="absolute top-12 left-12 z-20">
          <p className="font-cute text-xs text-pink-400 uppercase tracking-wider mb-2">
            {parallaxGalleryConfig.galleryLabel}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-pink-500 gradient-text">
            {parallaxGalleryConfig.galleryTitle}
          </h2>
        </div>

        {/* Decorative hearts */}
        <div className="absolute top-12 right-12 z-10 flex gap-2">
          <Heart className="w-8 h-8 text-pink-300 fill-pink-300 animate-heart-float" />
          <Heart className="w-6 h-6 text-pink-400 fill-pink-400 animate-heart-float" style={{ animationDelay: '0.3s' }} />
          <Heart className="w-10 h-10 text-pink-300 fill-pink-300 animate-heart-float" style={{ animationDelay: '0.6s' }} />
        </div>

        {/* Horizontal scrolling track */}
        <div
          ref={galleryTrackRef}
          className="flex items-center gap-8 h-full px-12 pt-24 will-change-transform"
        >
          {parallaxGalleryConfig.galleryImages.map((image, index) => (
            <div
              key={image.id}
              className="relative flex-shrink-0 group cursor-pointer"
              style={{ marginTop: index % 2 === 0 ? '0' : '40px' }}
            >
              <div className="relative w-[320px] h-[320px] overflow-hidden rounded-3xl border-4 border-white shadow-xl shadow-pink-200/50 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-pink-300/50 group-hover:-translate-y-2">
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pink-500/60 via-transparent to-transparent" />

                {/* Image info */}
                <div className="absolute bottom-6 left-6">
                  <p className="font-cute text-xs text-white/90 mb-1 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-white" />
                    {image.date}
                  </p>
                  <h3 className="font-display text-xl text-white">
                    {image.title}
                  </h3>
                </div>

                {/* Hover heart overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Heart className="w-16 h-16 text-white fill-white/80 animate-pulse-heart" />
                </div>
              </div>

              {/* Index number */}
              <div className="absolute -top-6 -left-3 font-cute text-6xl text-pink-200 font-bold">
                {String(index + 1).padStart(2, '0')}
              </div>
            </div>
          ))}

          {/* End CTA */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-[300px] h-[320px]">
            <button
              onClick={scrollToTour}
              className="group flex flex-col items-center gap-4 text-pink-500 hover:text-pink-600 transition-colors"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-300/50 group-hover:shadow-xl group-hover:shadow-pink-400/50 transition-all group-hover:scale-110">
                <ArrowRight className="w-10 h-10 text-white group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="font-display text-lg uppercase tracking-wider text-pink-500">
                {parallaxGalleryConfig.endCtaText}
              </span>
            </button>
          </div>
        </div>

        {/* Scroll progress indicator */}
        <div className="absolute bottom-12 left-12 right-12 h-1 bg-pink-200/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-400 to-pink-500 w-0 rounded-full" id="gallery-progress" />
        </div>
      </div>
    </section>
  );
};

export default ParallaxGallery;
