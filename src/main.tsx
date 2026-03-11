// Force cache invalidation
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker with enhanced capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', reg.scope);

      // Listen for SW messages (for showing notifications from SW)
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'SHOW_NOTIFICATION' && Notification.permission === 'granted') {
          const { title, body, tag, icon } = e.data.payload;
          reg.showNotification(title, { body, tag, icon });
        }
      });

      // Register periodic sync if supported
      if ('periodicSync' in reg) {
        try {
          await (reg as any).periodicSync.register('update-prayer-times', {
            minInterval: 12 * 60 * 60 * 1000, // 12 hours
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

createRoot(document.getElementById("root")!).render(<App />);
