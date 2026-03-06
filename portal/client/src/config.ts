// =============================================================================
// Site Configuration - Dynamic Loader
// Loads config from the selected site based on VITE_SITE_ID env variable.
// Usage: VITE_SITE_ID=portal (default) | VITE_SITE_ID=zps
// =============================================================================

// Eagerly import all site configs at build time (Vite tree-shakes unused ones)
const siteModules = import.meta.glob('./sites/*/config.ts', { eager: true }) as Record<string, any>;

const siteId = import.meta.env.VITE_SITE_ID || 'portal';
const siteModule = siteModules[`./sites/${siteId}/config.ts`];

if (!siteModule) {
  throw new Error(`Unknown site: "${siteId}". Available: ${Object.keys(siteModules).map(k => k.split('/')[2]).join(', ')}`);
}

// Re-export types from portal (types are shared across all sites)
export type {
  SiteConfig,
  HeroNavItem,
  HeroConfig,
  Album,
  AlbumCubeConfig,
  ParallaxImage,
  GalleryImage,
  ParallaxGalleryConfig,
  TourDate,
  TourStatusLabels,
  TourScheduleConfig,
  FooterImage,
  SocialLink,
  FooterConfig,
} from './sites/portal/config';

import type {
  SiteConfig,
  HeroConfig,
  AlbumCubeConfig,
  ParallaxGalleryConfig,
  TourScheduleConfig,
  FooterConfig,
} from './sites/portal/config';

// Re-export data from the active site
export const siteConfig = siteModule.siteConfig as SiteConfig;
export const heroConfig = siteModule.heroConfig as HeroConfig;
export const albumCubeConfig = siteModule.albumCubeConfig as AlbumCubeConfig;
export const parallaxGalleryConfig = siteModule.parallaxGalleryConfig as ParallaxGalleryConfig;
export const tourScheduleConfig = siteModule.tourScheduleConfig as TourScheduleConfig;
export const footerConfig = siteModule.footerConfig as FooterConfig;
