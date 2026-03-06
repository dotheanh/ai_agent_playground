import { lazy, Suspense } from 'react';

const siteId = import.meta.env.VITE_SITE_ID || 'portal';

// Lazy load the correct app based on site ID
const SiteApp = siteId === 'zps'
  ? lazy(() => import('./sites/zps/ZpsApp'))
  : lazy(() => import('./sites/portal/PortalApp'));

function App() {
  return (
    <Suspense fallback={null}>
      <SiteApp />
    </Suspense>
  );
}

export default App;
