import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";
import "./index.css";

// Register service worker (only in production / non-preview)
if ('serviceWorker' in navigator && !window.location.hostname.includes('lovable.app')) {
  window.addEventListener('load', async () => {
    try {
      // Unregister old SWs first to clear stale cache
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
      
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', reg.scope);

      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'SHOW_NOTIFICATION' && Notification.permission === 'granted') {
          const { title, body, tag, icon } = e.data.payload;
          reg.showNotification(title, { body, tag, icon });
        }
      });

      if ('periodicSync' in reg) {
        try {
          await (reg as any).periodicSync.register('update-prayer-times', {
            minInterval: 12 * 60 * 60 * 1000,
          });
        } catch {
          // Periodic sync not available
        }
      }
    } catch (err) {
      console.error('SW registration failed:', err);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
