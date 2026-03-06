import { useEffect } from 'react';
import useLenis from '../../hooks/useLenis';
import { siteConfig } from './config';
import Hero from './sections/Hero';
import AlbumCube from './sections/AlbumCube';
import ParallaxGallery from './sections/ParallaxGallery';
import VisitorStats from './sections/VisitorStats';
import Guestbook from './sections/Guestbook';
import TourSchedule from './sections/TourSchedule';
import Footer from './sections/Footer';
import HeartParticles from './components/HeartParticles';

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
      <TourSchedule />
      <Footer />
    </main>
  );
}

export default ZpsApp;
