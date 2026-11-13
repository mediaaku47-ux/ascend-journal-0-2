import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Bersihkan cache usang dari service worker lama agar perubahan terbaru langsung aktif
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((keys) => {
    for (const key of keys) {
      if (key !== 'journal-stream-pwa-v25') {
        caches.delete(key);
      }
    }
  }).catch(() => {});
}

// PWA Service Worker: Registrasi service worker untuk Web Push Notification & Offline PWA
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('Service worker registration notice:', err);
      });
  });
}
