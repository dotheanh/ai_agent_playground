import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Ticket, ArrowRight, Cpu, Brain, Zap } from 'lucide-react';
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
  const headerRef = useRef<HTMLDivElement>(null);
  const contentBlocksRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRefs = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Enhanced Parallax strips animation with depth
      if (topRowRef.current && bottomRowRef.current) {
        const st1 = ScrollTrigger.create({
          trigger: parallaxContainerRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5,
          onUpdate: (self) => {
            const progress = self.progress;
            if (topRowRef.current) {
              gsap.set(topRowRef.current, {
                x: -progress * 400,
                scale: 1 + progress * 0.05,
              });
            }
            if (bottomRowRef.current) {
              gsap.set(bottomRowRef.current, {
                x: progress * 400 - 150,
                scale: 1 - progress * 0.03,
              });
            }
          },
        });
        scrollTriggerRefs.current.push(st1);
      }

      // Header parallax fade
      if (headerRef.current) {
        const stHeader = ScrollTrigger.create({
          trigger: parallaxContainerRef.current,
          start: 'top bottom',
          end: 'center center',
          scrub: 1,
          onUpdate: (self) => {
            if (headerRef.current) {
              gsap.set(headerRef.current, {
                y: (1 - self.progress) * 50,
                opacity: 0.3 + self.progress * 0.7,
              });
            }
          },
        });
        scrollTriggerRefs.current.push(stHeader);
      }

      // Content blocks staggered parallax
      if (contentBlocksRef.current) {
        const blocks = contentBlocksRef.current.children;
        Array.from(blocks).forEach((block, i) => {
          const stBlock = ScrollTrigger.create({
            trigger: block,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
            onUpdate: (self) => {
              gsap.set(block, {
                y: self.progress * (30 + i * 20) * (i % 2 === 0 ? -1 : 1),
              });
            },
          });
          scrollTriggerRefs.current.push(stBlock);
        });
      }

      // Horizontal gallery scroll with enhanced effects
      if (galleryRef.current && galleryTrackRef.current) {
        const trackWidth = galleryTrackRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;

        const st2 = ScrollTrigger.create({
          trigger: galleryRef.current,
          start: 'top top',
          end: () => `+=${trackWidth - viewportWidth}`,
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            if (galleryTrackRef.current) {
              const x = -self.progress * (trackWidth - viewportWidth);
              gsap.set(galleryTrackRef.current, { x });
              
              // Update progress bar
              const progressBar = document.getElementById('gallery-progress');
              if (progressBar) {
                progressBar.style.width = `${self.progress * 100}%`;
              }
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
    const tourSection = document.getElementById('tour');
    if (tourSection) {
      tourSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative w-full bg-void-black"
    >
      {/* Parallax Strips Section */}
      <div
        ref={parallaxContainerRef}
        className="relative py-20 overflow-hidden"
      >
        {/* Section header with parallax */}
        <div ref={headerRef} className="px-12 mb-12 will-change-transform">
          <p className="font-mono-custom text-xs text-crimson/60 uppercase tracking-wider mb-2">
            {parallaxGalleryConfig.sectionLabel}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white">
            {parallaxGalleryConfig.sectionTitle}
          </h2>
        </div>

        {/* AI Info Cards with parallax */}
        <div ref={contentBlocksRef} className="px-12 mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-crimson/10 to-transparent border border-crimson/20 rounded-xl p-6 hover:border-crimson/40 transition-colors">
            <Brain className="w-8 h-8 text-crimson mb-4" />
            <h3 className="font-display text-lg text-white mb-2">Claude Code</h3>
            <p className="text-white/60 text-sm">Advanced AI coding assistant powered by Anthropic's Claude. Write, debug, and optimize code with natural language.</p>
          </div>
          <div className="bg-gradient-to-br from-crimson/10 to-transparent border border-crimson/20 rounded-xl p-6 hover:border-crimson/40 transition-colors">
            <Cpu className="w-8 h-8 text-crimson mb-4" />
            <h3 className="font-display text-lg text-white mb-2">AI Agents</h3>
            <p className="text-white/60 text-sm">Autonomous AI agents that can perform complex tasks, make decisions, and interact with systems on your behalf.</p>
          </div>
          <div className="bg-gradient-to-br from-crimson/10 to-transparent border border-crimson/20 rounded-xl p-6 hover:border-crimson/40 transition-colors">
            <Zap className="w-8 h-8 text-crimson mb-4" />
            <h3 className="font-display text-lg text-white mb-2">Neural Networks</h3>
            <p className="text-white/60 text-sm">Deep learning models that process and understand complex patterns in data for intelligent decision making.</p>
          </div>
        </div>

        {/* Top row - moves left with parallax */}
        <div
          ref={topRowRef}
          className="flex gap-4 mb-4 will-change-transform"
        >
          {parallaxGalleryConfig.parallaxImagesTop.map((image) => (
            <div
              key={image.id}
              className="relative flex-shrink-0 w-[400px] h-[250px] overflow-hidden rounded-lg image-hover-scale group"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void-black/50 to-transparent" />
              <div className="absolute inset-0 bg-crimson/0 group-hover:bg-crimson/10 transition-colors duration-300" />
            </div>
          ))}
        </div>

        {/* Bottom row - moves right with parallax */}
        <div
          ref={bottomRowRef}
          className="flex gap-4 will-change-transform"
          style={{ transform: 'translateX(-150px)' }}
        >
          {parallaxGalleryConfig.parallaxImagesBottom.map((image) => (
            <div
              key={image.id}
              className="relative flex-shrink-0 w-[400px] h-[250px] overflow-hidden rounded-lg image-hover-scale group"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void-black/50 to-transparent" />
              <div className="absolute inset-0 bg-crimson/0 group-hover:bg-crimson/10 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Section */}
      <div className="relative py-8 bg-void-dark overflow-hidden border-y border-crimson/10">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="flex items-center gap-8 mx-8 text-2xl font-display text-crimson/20"
            >
              {parallaxGalleryConfig.marqueeTexts.map((text, j) => (
                <span key={j}>{text}</span>
              ))}
              <Ticket className="w-6 h-6" />
              <ArrowRight className="w-6 h-6" />
            </span>
          ))}
        </div>
      </div>

      {/* Horizontal Gallery Section */}
      <div
        ref={galleryRef}
        className="relative h-screen overflow-hidden"
      >
        {/* Gallery header */}
        <div className="absolute top-12 left-12 z-20">
          <p className="font-mono-custom text-xs text-crimson/60 uppercase tracking-wider mb-2">
            {parallaxGalleryConfig.galleryLabel}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white">
            {parallaxGalleryConfig.galleryTitle}
          </h2>
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
              style={{ marginTop: index % 2 === 0 ? '0' : '60px' }}
            >
              <div className="relative w-[450px] h-[300px] overflow-hidden rounded-xl">
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void-black/80 via-transparent to-transparent" />

                {/* Image info */}
                <div className="absolute bottom-6 left-6">
                  <p className="font-mono-custom text-xs text-crimson/80 mb-1">
                    {image.date}
                  </p>
                  <h3 className="font-display text-2xl text-white">
                    {image.title}
                  </h3>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-crimson/0 group-hover:bg-crimson/10 transition-colors duration-300" />
              </div>

              {/* Index number */}
              <div className="absolute -top-8 -left-4 font-mono-custom text-7xl text-crimson/10 font-bold">
                {String(index + 1).padStart(2, '0')}
              </div>
            </div>
          ))}

          {/* End CTA */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-[300px] h-[300px]">
            <button
              onClick={scrollToTour}
              className="group flex flex-col items-center gap-4 text-white hover:text-crimson transition-colors"
            >
              <div className="w-20 h-20 rounded-full border border-white/20 group-hover:border-crimson flex items-center justify-center transition-colors animate-pulse-glow">
                <ArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="font-display text-lg uppercase tracking-wider">
                {parallaxGalleryConfig.endCtaText}
              </span>
            </button>
          </div>
        </div>

        {/* Scroll progress indicator */}
        <div className="absolute bottom-12 left-12 right-12 h-px bg-white/10">
          <div className="h-full bg-crimson/50 w-0 transition-all duration-100" id="gallery-progress" />
        </div>
      </div>
    </section>
  );
};

export default ParallaxGallery;
