import { useEffect } from 'react';
import './index.css';
import useLenis from './hooks/useLenis';
import { siteConfig } from './config';
import Hero from './sections/Hero';
import AlbumCube from './sections/AlbumCube';
import ParallaxGallery from './sections/ParallaxGallery';
import VisitorStats from './sections/VisitorStats';
import AIQuiz from './sections/AIQuiz';
import Guestbook from './sections/Guestbook';
import TourSchedule from './sections/TourSchedule';
import Footer from './sections/Footer';
import AIChat from './sections/AIChat';

function App() {
  // Initialize Lenis smooth scrolling
  useLenis();

  useEffect(() => {
    // Set page title from config
    if (siteConfig.title) {
      document.title = siteConfig.title;
    }

    // Add viewport meta for better mobile experience
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, []);

  return (
    <main className="relative w-full min-h-screen bg-void-black overflow-x-hidden">
      {/* Hero Section - Immersive landing */}
      <Hero />

      {/* Album Cube Section - 3D showcase */}
      <AlbumCube />

      {/* Parallax Gallery Section */}
      <ParallaxGallery />

      {/* Visitor Stats - Real-time analytics */}
      <VisitorStats />

      {/* AI Quiz - Test AI knowledge */}
      <AIQuiz />

      {/* Guestbook - Leave a message */}
      <Guestbook />

      {/* Tour Schedule Section */}
      <TourSchedule />

      {/* Footer Section */}
      <Footer />

      {/* AI Chat - Floating assistant */}
      <AIChat />
    </main>
  );
}

export default App;
