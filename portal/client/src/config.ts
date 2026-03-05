// =============================================================================
// Site Configuration
// Edit ONLY this file to customize all content across the site.
// All animations, layouts, and styles are controlled by the components.
// =============================================================================

// -- Site-wide settings -------------------------------------------------------
export interface SiteConfig {
  title: string;
  description: string;
  language: string;
}

export const siteConfig: SiteConfig = {
  title: "AI Agent - Next Generation Intelligence",
  description: "Experience the future of AI with Claude Code and advanced AI agents. Intelligent automation, natural language processing, and cognitive computing solutions powered by cutting-edge technology.",
  language: "en",
};

// -- Hero Section -------------------------------------------------------------
export interface HeroNavItem {
  label: string;
  sectionId: string;
  icon: "disc" | "play" | "calendar" | "music";
}

export interface HeroConfig {
  backgroundImage: string;
  brandName: string;
  decodeText: string;
  decodeChars: string;
  subtitle: string;
  ctaPrimary: string;
  ctaPrimaryTarget: string;
  ctaSecondary: string;
  ctaSecondaryTarget: string;
  cornerLabel: string;
  cornerDetail: string;
  navItems: HeroNavItem[];
}

export const heroConfig: HeroConfig = {
  backgroundImage: "/hero-bg.jpg",
  brandName: "AI AGENT",
  decodeText: "INTELLIGENCE",
  decodeChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  subtitle: "EVOLVED",
  ctaPrimary: "Explore AI",
  ctaPrimaryTarget: "gallery",
  ctaSecondary: "View Gallery",
  ctaSecondaryTarget: "stats",
  cornerLabel: "SYSTEM STATUS",
  cornerDetail: "ONLINE",
  navItems: [
    { label: "Vision", sectionId: "gallery", icon: "play" },
    { label: "Stats", sectionId: "stats", icon: "disc" },
    { label: "Quiz", sectionId: "quiz", icon: "disc" },
    { label: "Guestbook", sectionId: "guestbook", icon: "music" },
    { label: "Services", sectionId: "tour", icon: "calendar" },
  ],
};

// -- Album Cube Section -------------------------------------------------------
export interface Album {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

export interface AlbumCubeConfig {
  albums: Album[];
  cubeTextures: string[];
  scrollHint: string;
}

export const albumCubeConfig: AlbumCubeConfig = {
  albums: [
    {
      id: 1,
      title: "CLAUDE",
      subtitle: "CODE",
      image: "/cube-1.jpg",
    },
    {
      id: 2,
      title: "AI",
      subtitle: "AGENTS",
      image: "/cube-2.jpg",
    },
    {
      id: 3,
      title: "NEURAL",
      subtitle: "NETWORKS",
      image: "/cube-3.jpg",
    },
    {
      id: 4,
      title: "QUANTUM",
      subtitle: "CORE",
      image: "/cube-4.jpg",
    },
  ],
  cubeTextures: [
    "/cube-1.jpg", // right
    "/cube-2.jpg", // left
    "/cube-3.jpg", // top
    "/cube-4.jpg", // bottom
    "/cube-5.jpg", // front
    "/cube-6.jpg", // back
  ],
  scrollHint: "Scroll to explore AI capabilities",
};

// -- Parallax Gallery Section -------------------------------------------------
export interface ParallaxImage {
  id: number;
  src: string;
  alt: string;
}

export interface GalleryImage {
  id: number;
  src: string;
  title: string;
  date: string;
}

export interface ParallaxGalleryConfig {
  sectionLabel: string;
  sectionTitle: string;
  galleryLabel: string;
  galleryTitle: string;
  marqueeTexts: string[];
  endCtaText: string;
  parallaxImagesTop: ParallaxImage[];
  parallaxImagesBottom: ParallaxImage[];
  galleryImages: GalleryImage[];
}

export const parallaxGalleryConfig: ParallaxGalleryConfig = {
  sectionLabel: "AI TECHNOLOGY",
  sectionTitle: "THE FUTURE IS NOW",
  galleryLabel: "CAPABILITIES",
  galleryTitle: "POWERED BY ADVANCED AI",
  marqueeTexts: [
    "CLAUDE CODE",
    "AI AGENTS",
    "MACHINE LEARNING",
    "DEEP LEARNING",
    "NEURAL NETWORKS",
    "NLP",
    "COMPUTER VISION",
    "AUTONOMOUS SYSTEMS",
  ],
  endCtaText: "Discover More AI Applications",
  parallaxImagesTop: [
    { id: 1, src: "/gallery-1.jpg", alt: "AI Smart Cities" },
    { id: 2, src: "/gallery-2.jpg", alt: "Robotics AI" },
    { id: 3, src: "/gallery-3.jpg", alt: "AI Data Centers" },
    { id: 4, src: "/gallery-4.jpg", alt: "AI Core Processor" },
    { id: 5, src: "/gallery-5.jpg", alt: "AI Hologram" },
    { id: 6, src: "/gallery-6.jpg", alt: "Quantum AI Chip" },
  ],
  parallaxImagesBottom: [
    { id: 7, src: "/gallery-6.jpg", alt: "Quantum AI Chip" },
    { id: 8, src: "/gallery-5.jpg", alt: "AI Hologram" },
    { id: 9, src: "/gallery-4.jpg", alt: "AI Core Processor" },
    { id: 10, src: "/gallery-3.jpg", alt: "AI Data Centers" },
    { id: 11, src: "/gallery-2.jpg", alt: "Robotics AI" },
    { id: 12, src: "/gallery-1.jpg", alt: "AI Smart Cities" },
  ],
  galleryImages: [
    { id: 1, src: "/gallery-1.jpg", title: "Smart Cities", date: "AI Infrastructure" },
    { id: 2, src: "/gallery-2.jpg", title: "Robotics", date: "Autonomous Systems" },
    { id: 3, src: "/gallery-3.jpg", title: "Data Centers", date: "AI Processing" },
    { id: 4, src: "/gallery-4.jpg", title: "Neural Core", date: "Deep Learning" },
    { id: 5, src: "/gallery-5.jpg", title: "Virtual Assistants", date: "NLP Systems" },
    { id: 6, src: "/gallery-6.jpg", title: "Quantum AI", date: "Next-Gen Computing" },
  ],
};

// -- Tour Schedule Section (Adapted for AI Services) ----------------------------------------------------
export interface TourDate {
  id: number;
  date: string;
  time: string;
  city: string;
  venue: string;
  status: "on-sale" | "sold-out" | "coming-soon";
  image: string;
}

export interface TourStatusLabels {
  onSale: string;
  soldOut: string;
  comingSoon: string;
  default: string;
}

export interface TourScheduleConfig {
  sectionLabel: string;
  sectionTitle: string;
  vinylImage: string;
  buyButtonText: string;
  detailsButtonText: string;
  bottomNote: string;
  bottomCtaText: string;
  statusLabels: TourStatusLabels;
  tourDates: TourDate[];
}

export const tourScheduleConfig: TourScheduleConfig = {
  sectionLabel: "AI SOLUTIONS",
  sectionTitle: "CHOOSE YOUR AI PLAN",
  vinylImage: "/spinner.png",
  buyButtonText: "Get Started",
  detailsButtonText: "Learn More",
  bottomNote: "All plans include 24/7 support and API access powered by Claude Code",
  bottomCtaText: "Contact for Enterprise AI Solutions",
  statusLabels: {
    onSale: "Available",
    soldOut: "Limited",
    comingSoon: "Coming Soon",
    default: "Inquire",
  },
  tourDates: [
    {
      id: 1,
      date: "STARTER",
      time: "$49/mo",
      city: "Claude Basic",
      venue: "Perfect for developers and small teams getting started with AI agents",
      status: "on-sale",
      image: "/gallery-1.jpg",
    },
    {
      id: 2,
      date: "PROFESSIONAL",
      time: "$199/mo",
      city: "AI Agent Pro",
      venue: "Advanced AI capabilities with Claude Code integration for growing businesses",
      status: "on-sale",
      image: "/gallery-2.jpg",
    },
    {
      id: 3,
      date: "ENTERPRISE",
      time: "Custom",
      city: "Enterprise AI",
      venue: "Tailored AI agent solutions with dedicated Claude Code infrastructure",
      status: "coming-soon",
      image: "/gallery-3.jpg",
    },
    {
      id: 4,
      date: "QUANTUM",
      time: "Beta",
      city: "Quantum AI",
      venue: "Next-generation quantum-enhanced AI processing with neural networks",
      status: "coming-soon",
      image: "/gallery-4.jpg",
    },
  ],
};

// -- Footer Section -----------------------------------------------------------
export interface FooterImage {
  id: number;
  src: string;
}

export interface SocialLink {
  icon: "instagram" | "twitter" | "youtube" | "music";
  label: string;
  href: string;
}

export interface FooterConfig {
  portraitImage: string;
  portraitAlt: string;
  heroTitle: string;
  heroSubtitle: string;
  artistLabel: string;
  artistName: string;
  artistSubtitle: string;
  brandName: string;
  brandDescription: string;
  quickLinksTitle: string;
  quickLinks: string[];
  contactTitle: string;
  emailLabel: string;
  email: string;
  phoneLabel: string;
  phone: string;
  addressLabel: string;
  address: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterButtonText: string;
  subscribeAlertMessage: string;
  copyrightText: string;
  bottomLinks: string[];
  socialLinks: SocialLink[];
  galleryImages: FooterImage[];
}

export const footerConfig: FooterConfig = {
  portraitImage: "/footer-portrait.jpg",
  portraitAlt: "AI Agent Portrait",
  heroTitle: "CONNECT",
  heroSubtitle: "WITH AI",
  artistLabel: "POWERED BY",
  artistName: "CLAUDE CODE",
  artistSubtitle: "Next Generation AI Agent",
  brandName: "AI AGENT",
  brandDescription: "Pioneering the future of artificial intelligence with Claude Code, advanced AI agents, neural networks, and cognitive computing solutions that transform how businesses operate.",
  quickLinksTitle: "Quick Links",
  quickLinks: ["AI Technology", "Claude Code", "AI Agents", "Documentation", "API"],
  contactTitle: "Contact",
  emailLabel: "Email",
  email: "hello@aiagent.io",
  phoneLabel: "Phone",
  phone: "+1 (555) 123-4567",
  addressLabel: "Location",
  address: "San Francisco, CA",
  newsletterTitle: "Stay Updated",
  newsletterDescription: "Subscribe to receive the latest AI news, Claude Code updates, and AI agent innovations.",
  newsletterButtonText: "Subscribe",
  subscribeAlertMessage: "Thank you for subscribing to AI Agent updates!",
  copyrightText: "© 2024 AI Agent. Powered by Claude Code. All rights reserved.",
  bottomLinks: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  socialLinks: [
    { icon: "twitter", label: "Twitter", href: "https://twitter.com" },
    { icon: "instagram", label: "LinkedIn", href: "https://linkedin.com" },
    { icon: "youtube", label: "YouTube", href: "https://youtube.com" },
    { icon: "music", label: "GitHub", href: "https://github.com" },
  ],
  galleryImages: [
    { id: 1, src: "/gallery-1.jpg" },
    { id: 2, src: "/gallery-2.jpg" },
    { id: 3, src: "/gallery-3.jpg" },
    { id: 4, src: "/gallery-4.jpg" },
  ],
};
