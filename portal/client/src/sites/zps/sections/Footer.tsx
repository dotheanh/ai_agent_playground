import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, Twitter, Youtube, Music2, Mail, Phone, MapPin, ExternalLink, Heart, Sparkles } from 'lucide-react';
import { footerConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

const SOCIAL_ICON_MAP = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  music: Music2,
};

const Footer = () => {
  // Null check: if config is empty, do not render
  if (!footerConfig.brandName && !footerConfig.heroTitle && footerConfig.socialLinks.length === 0) {
    return null;
  }

  const sectionRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);
  const scrollTriggerRefs = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax title effect
      if (titleRef.current && portraitRef.current) {
        const st = ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          onUpdate: (self) => {
            if (titleRef.current) {
              // Title moves faster than portrait
              gsap.set(titleRef.current, {
                y: -self.progress * 100,
              });
            }
          },
        });
        scrollTriggerRefs.current.push(st);
      }
    }, sectionRef);

    return () => {
      ctx.revert();
      scrollTriggerRefs.current.forEach(st => st.kill());
      scrollTriggerRefs.current = [];
    };
  }, []);

  const handleContactClick = () => {
    if (footerConfig.subscribeAlertMessage) {
      alert(footerConfig.subscribeAlertMessage);
    }
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative w-full overflow-hidden"
    >
      {/* Artist portrait section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-pink-100 to-pink-50">
        {/* Floating hearts */}
        <div className="absolute inset-0 pointer-events-none">
          <Heart className="absolute top-16 left-[15%] w-10 h-10 text-pink-300/50 fill-pink-300/50 animate-heart-float" />
          <Heart className="absolute top-32 right-[20%] w-8 h-8 text-pink-400/40 fill-pink-400/40 animate-heart-float" style={{ animationDelay: '0.5s' }} />
          <Heart className="absolute bottom-32 left-[25%] w-12 h-12 text-pink-300/40 fill-pink-300/40 animate-heart-float" style={{ animationDelay: '1s' }} />
          <Sparkles className="absolute top-1/3 right-[10%] w-8 h-8 text-pink-400/40 animate-sparkle" />
        </div>

        {/* Background portrait */}
        <div
          ref={portraitRef}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative w-full max-w-3xl aspect-[16/9] mx-auto rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-pink-200/50">
            <img
              src={footerConfig.portraitImage}
              alt={footerConfig.portraitAlt}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-pink-500/40 via-transparent to-pink-100/30" />
            <div className="absolute inset-0 bg-gradient-to-b from-pink-100/50 via-transparent to-transparent opacity-50" />
          </div>
        </div>

        {/* Parallax title overlay */}
        <div
          ref={titleRef}
          className="relative z-10 text-center will-change-transform px-4"
        >
          <div className="flex justify-center gap-3 mb-6">
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400 animate-pulse-heart" />
            <Heart className="w-10 h-10 text-pink-500 fill-pink-500 animate-pulse-heart" style={{ animationDelay: '0.2s' }} />
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400 animate-pulse-heart" style={{ animationDelay: '0.4s' }} />
          </div>
          <h2 className="font-display text-[8vw] md:text-[6vw] text-pink-500 leading-none tracking-tight gradient-text">
            {footerConfig.heroTitle}
          </h2>
          <p className="font-cute text-lg text-pink-500/70 uppercase tracking-[0.3em] mt-4">
            {footerConfig.heroSubtitle}
          </p>
        </div>

        {/* Artist name */}
        <div className="absolute bottom-20 left-12 z-20">
          <p className="font-cute text-xs text-pink-400/70 uppercase tracking-wider mb-2">
            {footerConfig.artistLabel}
          </p>
          <h3 className="font-display text-4xl text-pink-500">{footerConfig.artistName}</h3>
          <p className="font-cute text-sm text-pink-400/80">{footerConfig.artistSubtitle}</p>
        </div>
      </div>

      {/* Footer content */}
      <div className="relative bg-gradient-to-b from-pink-50 to-white py-20 px-6 md:px-12">
        {/* Top divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />

        <div className="max-w-7xl mx-auto">
          {/* Footer grid - Main content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-300/50">
                  <Heart className="w-6 h-6 text-white fill-white" />
                </div>
                <span className="font-display text-2xl text-pink-500">{footerConfig.brandName}</span>
              </div>
              <p className="text-sm text-pink-600/60 leading-relaxed mb-6">
                {footerConfig.brandDescription}
              </p>
              {/* Social links */}
              <div className="flex gap-4">
                {footerConfig.socialLinks.map((social) => {
                  const IconComponent = SOCIAL_ICON_MAP[social.icon];
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      className="w-10 h-10 rounded-full border-2 border-pink-300 flex items-center justify-center text-pink-400 hover:text-white hover:bg-gradient-to-br hover:from-pink-400 hover:to-pink-500 hover:border-transparent transition-all shadow-md shadow-pink-200/30 hover:shadow-lg hover:shadow-pink-300/50"
                      aria-label={social.label}
                    >
                      <IconComponent className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display text-sm uppercase tracking-wider text-pink-500 mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {footerConfig.quickLinksTitle}
              </h4>
              <ul className="space-y-3">
                {footerConfig.quickLinks.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-pink-600/60 hover:text-pink-500 transition-colors flex items-center gap-2 group"
                    >
                      <span>{link}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-sm uppercase tracking-wider text-pink-500 mb-6 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                {footerConfig.contactTitle}
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-pink-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-pink-600/50">{footerConfig.emailLabel}</p>
                    <a href={`mailto:${footerConfig.email}`} className="text-sm text-pink-600 hover:text-pink-500 transition-colors">
                      {footerConfig.email}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-pink-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-pink-600/50">{footerConfig.phoneLabel}</p>
                    <span className="text-sm text-pink-600">{footerConfig.phone}</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-pink-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-pink-600/50">{footerConfig.addressLabel}</p>
                    <span className="text-sm text-pink-600">{footerConfig.address}</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-display text-sm uppercase tracking-wider text-pink-500 mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {footerConfig.newsletterTitle}
              </h4>
              <p className="text-sm text-pink-600/60 mb-4">
                {footerConfig.newsletterDescription}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-grow px-4 py-3 bg-white border-2 border-pink-200 rounded-xl text-sm text-pink-600 placeholder:text-pink-300 focus:outline-none focus:border-pink-400"
                />
                <button
                  onClick={handleContactClick}
                  className="px-4 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-xl text-sm font-medium hover:from-pink-500 hover:to-pink-600 transition-all shadow-md shadow-pink-300/50"
                >
                  {footerConfig.newsletterButtonText}
                </button>
              </div>
            </div>
          </div>

          {/* Footer image grid */}
          {footerConfig.galleryImages.length > 0 && (
            <div className="mb-12">
              <p className="font-cute text-xs text-pink-400/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Heart className="w-3 h-3" />
                Gallery - Tất Cả Các Thành Viên
              </p>
              <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {footerConfig.galleryImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-2xl cursor-pointer border-2 border-white shadow-md shadow-pink-200/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-pink-300/50 hover:border-pink-300"
                    onMouseEnter={() => setHoveredImage(index)}
                    onMouseLeave={() => setHoveredImage(null)}
                  >
                    <img
                      src={image.src}
                      alt=""
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        hoveredImage === index ? 'scale-110 brightness-110' : 'brightness-90'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pink-500/30 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom bar */}
          <div className="pt-8 border-t-2 border-pink-200/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-pink-400/60 font-cute flex items-center gap-1">
              <Heart className="w-3 h-3 fill-pink-400/60" />
              {footerConfig.copyrightText}
            </p>
            <div className="flex gap-6">
              {footerConfig.bottomLinks.map((link) => (
                <a key={link} href="#" className="text-xs text-pink-400/60 hover:text-pink-500 transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Footer;
