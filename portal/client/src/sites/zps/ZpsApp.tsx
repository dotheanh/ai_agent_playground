import { useEffect } from 'react';
import useLenis from '../../hooks/useLenis';
import { siteConfig, footerConfig } from './config';
import Hero from './sections/Hero';
import AlbumCube from './sections/AlbumCube';
import ParallaxGallery from './sections/ParallaxGallery';
import VisitorStats from './sections/VisitorStats';
import Guestbook from './sections/Guestbook';
import HeartParticles from './components/HeartParticles';
import { Heart } from 'lucide-react';

function Footer() {
  return (
    <footer className="relative py-16 bg-gradient-to-b from-pink-100 via-pink-50 to-white overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={footerConfig.portraitImage}
          alt={footerConfig.portraitAlt}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pink-50 via-pink-50/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="flex justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400 animate-pulse-heart" />
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500 animate-pulse-heart" style={{ animationDelay: '0.2s' }} />
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400 animate-pulse-heart" style={{ animationDelay: '0.4s' }} />
          </div>
          <h2 className="font-display text-4xl md:text-6xl text-pink-500 mb-4">
            {footerConfig.heroTitle}
          </h2>
          <p className="font-cute text-pink-600/80 text-lg">
            {footerConfig.heroSubtitle}
          </p>
        </div>

        <div className="text-center mb-8">
          <p className="font-cute text-sm text-pink-500/60 uppercase tracking-widest mb-4">
            {footerConfig.artistLabel}
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-pink-600 mb-2">
            {footerConfig.artistName}
          </h3>
          <p className="font-cute text-pink-500/70">
            {footerConfig.artistSubtitle}
          </p>
        </div>

        <div className="text-center pt-8 border-t border-pink-200">
          <p className="text-pink-500/60 text-sm">
            {footerConfig.copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}

function ZpsApp() {
  useLenis();

  useEffect(() => {
    if (siteConfig.title) {
      document.title = siteConfig.title;
    }
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-gradient-to-br from-pink-50 via-white to-pink-100">
      <HeartParticles />
      <Hero />
      <AlbumCube />
      <ParallaxGallery />
      <VisitorStats />
      <Guestbook />
      <Footer />
    </main>
  );
}

export default ZpsApp;
