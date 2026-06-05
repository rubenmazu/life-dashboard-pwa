import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

// Service worker registration is handled by vite-plugin-pwa with registerType: 'autoUpdate'.
// Log registration status for debugging without blocking the app.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready
    .then((registration) => {
      console.log('[SW] Service worker registered successfully:', registration.scope);
    })
    .catch((error) => {
      console.error('[SW] Service worker registration failed:', error);
    });
}
