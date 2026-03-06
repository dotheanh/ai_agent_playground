import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Play, Music, Disc, Calendar, Heart, Sparkles } from 'lucide-react';
import { heroConfig } from '../config';

const ICON_MAP = {
  disc: Disc,
  play: Play,
  calendar: Calendar,
  music: Music,
};

const Hero = () => {
  // Null check: if config is empty, do not render
  if (!heroConfig.decodeText && !heroConfig.brandName && heroConfig.navItems.length === 0) {
    return null;
  }

  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const heartsRef = useRef<HTMLDivElement>(null);
  const TARGET_TEXT = heroConfig.decodeText;
  const CHARS = heroConfig.decodeChars || '💖✨🌸💕🎀💗🌺💝🌷💘';
  const [displayText, setDisplayText] = useState(' '.repeat(TARGET_TEXT.length));
  const [isDecoding, setIsDecoding] = useState(true);

  // Decode text effect
  useEffect(() => {
    let iteration = 0;
    const maxIterations = TARGET_TEXT.length * 8;

    const interval = setInterval(() => {
      setDisplayText(() => {
        return TARGET_TEXT.split('')
          .map((_, index) => {
            if (index < iteration / 8) {
              return TARGET_TEXT[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('');
      });

      iteration += 1;

      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(TARGET_TEXT);
        setIsDecoding(false);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Nav slide in
      gsap.fromTo(
        navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.3 }
      );

      // Subtitle fade in
      gsap.fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 1.5 }
      );

      // Floating hearts animation
      const hearts = heartsRef.current?.querySelectorAll('.floating-heart');
      hearts?.forEach((heart, index) => {
        gsap.to(heart, {
          y: -20,
          rotation: 10,
          duration: 2 + index * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
        });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative w-full h-screen overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroConfig.backgroundImage})` }}
        />
        {/* Pink overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-pink-200/40 via-pink-100/30 to-pink-50/60" />
        {/* Soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-pink-50/80" />
      </div>

      {/* Floating hearts decoration */}
      <div ref={heartsRef} className="absolute inset-0 z-5 pointer-events-none overflow-hidden">
        <div className="floating-heart absolute top-20 left-[10%] text-pink-300 animate-sparkle">
          <Heart className="w-8 h-8 fill-pink-300" />
        </div>
        <div className="floating-heart absolute top-32 right-[15%] text-pink-400 animate-sparkle" style={{ animationDelay: '0.5s' }}>
          <Heart className="w-6 h-6 fill-pink-400" />
        </div>
        <div className="floating-heart absolute bottom-40 left-[20%] text-pink-300 animate-sparkle" style={{ animationDelay: '1s' }}>
          <Heart className="w-10 h-10 fill-pink-300" />
        </div>
        <div className="floating-heart absolute top-1/3 right-[8%] text-pink-400 animate-sparkle" style={{ animationDelay: '1.5s' }}>
          <Sparkles className="w-8 h-8 text-pink-400" />
        </div>
        <div className="floating-heart absolute bottom-1/4 right-[25%] text-pink-300 animate-sparkle" style={{ animationDelay: '0.8s' }}>
          <Heart className="w-7 h-7 fill-pink-300" />
        </div>
      </div>

      {/* Navigation pill */}
      <nav
        ref={navRef}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 nav-pill rounded-full px-2 py-2"
      >
        <div className="flex items-center gap-1">
          {heroConfig.navItems.map((item) => {
            const IconComponent = ICON_MAP[item.icon];
            return (
              <button
                key={item.sectionId}
                onClick={() => scrollToSection(item.sectionId)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-cute uppercase tracking-wider text-pink-600 hover:text-pink-500 transition-colors rounded-full hover:bg-pink-50"
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full pb-20 px-4">
        {/* Logo / Brand */}
        <div className="absolute top-8 left-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-300/50">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display text-xl text-pink-600">{heroConfig.brandName}</span>
          </div>
        </div>

        {/* Main title with decode effect */}
        <h1
          ref={titleRef}
          className="decode-text text-[10vw] md:text-[8vw] lg:text-[6vw] font-bold text-pink-500 leading-none tracking-tight mb-4"
        >
          <span className={`${isDecoding ? 'text-glow-pink' : ''} transition-all duration-300 gradient-text`}>
            {displayText}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="font-cute text-sm md:text-base text-pink-600/80 uppercase tracking-[0.2em] mb-8 text-center max-w-2xl"
        >
          {heroConfig.subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => scrollToSection(heroConfig.ctaPrimaryTarget)}
            className="btn-cute flex items-center gap-2"
          >
            <Heart className="w-4 h-4" />
            {heroConfig.ctaPrimary}
          </button>
          <button
            onClick={() => scrollToSection(heroConfig.ctaSecondaryTarget)}
            className="btn-cute-outline flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {heroConfig.ctaSecondary}
          </button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />

      {/* Corner accents */}
      <div className="absolute top-8 right-8 text-right">
        <p className="font-cute text-xs text-pink-500/60 uppercase tracking-wider">{heroConfig.cornerLabel}</p>
        <p className="font-cute text-xs text-pink-400/80">{heroConfig.cornerDetail}</p>
      </div>
    </section>
  );
};

export default Hero;
