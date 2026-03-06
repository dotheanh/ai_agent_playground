import { useEffect } from 'react';
import useLenis from '../../hooks/useLenis';
import { siteConfig } from '../../config';
import Hero from '../../sections/Hero';
import AlbumCube from '../../sections/AlbumCube';
import ParallaxGallery from '../../sections/ParallaxGallery';
import VisitorStats from '../../sections/VisitorStats';
import AIQuiz from '../../sections/AIQuiz';
import Guestbook from '../../sections/Guestbook';
import TourSchedule from '../../sections/TourSchedule';
import Footer from '../../sections/Footer';
import AIChat from '../../sections/AIChat';

function PortalApp() {
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
    <main className="relative w-full min-h-screen bg-void-black overflow-x-hidden">
      <Hero />
      <AlbumCube />
      <ParallaxGallery />
      <VisitorStats />
      <AIQuiz />
      <Guestbook />
      <TourSchedule />
      <Footer />
      <AIChat />
    </main>
  );
}

export default PortalApp;
