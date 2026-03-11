// Push notification utilities for İKRA app

const VAPID_PUBLIC_KEY = ''; // Will be set when push service is configured

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  delayMs: number,
  tag?: string
): Promise<number | null> {
  const permitted = await requestNotificationPermission();
  if (!permitted) return null;

  const timerId = window.setTimeout(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: { title, body, tag: tag || 'ikra-local', icon: '/icons/icon-192.png' },
      });
    } else {
      // Fallback to Notification API directly
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
        tag: tag || 'ikra-local',
      });
    }
  }, delayMs);

  return timerId;
}

export function cancelScheduledNotification(timerId: number) {
  window.clearTimeout(timerId);
}

// Schedule prayer notifications based on user preferences
export function schedulePrayerNotifications(
  times: Record<string, string>,
  toggles: Record<string, boolean>,
  offsets: Record<string, string>
): number[] {
  const timerIds: number[] = [];
  const now = new Date();
  const nowMs = now.getTime();

  const PRAYER_NAMES: Record<string, string> = {
    Fajr: 'Sabah',
    Dhuhr: 'Öğle',
    Asr: 'İkindi',
    Maghrib: 'Akşam',
    Isha: 'Yatsı',
  };

  Object.entries(toggles).forEach(([key, enabled]) => {
    if (!enabled || !times[key]) return;

    const [h, m] = times[key].split(':').map(Number);
    const prayerDate = new Date(now);
    prayerDate.setHours(h, m, 0, 0);

    // Parse offset
    const offsetStr = offsets[key] || 'Vakitte';
    let offsetMinutes = 0;
    if (offsetStr.includes('5')) offsetMinutes = 5;
    else if (offsetStr.includes('10')) offsetMinutes = 10;
    else if (offsetStr.includes('15')) offsetMinutes = 15;
    else if (offsetStr.includes('30')) offsetMinutes = 30;

    const notifyTime = prayerDate.getTime() - offsetMinutes * 60 * 1000;
    const delay = notifyTime - nowMs;

    if (delay > 0) {
      const name = PRAYER_NAMES[key] || key;
      const bodyText = offsetMinutes > 0
        ? `${name} namazına ${offsetMinutes} dakika kaldı`
        : `${name} namazı vakti girdi`;

      scheduleLocalNotification(
        `🕌 ${name} Vakti`,
        bodyText,
        delay,
        `prayer-${key}`
      ).then(id => { if (id !== null) timerIds.push(id); });
    }
  });

  return timerIds;
}

// Schedule daily ayet/hadis notification
export function scheduleDailyContentNotification(
  type: 'ayet' | 'hadis',
  hour: number,
  minute: number
): number | null {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  const title = type === 'ayet' ? '📖 Günün Ayeti' : '📿 Günün Hadisi';
  const body = type === 'ayet'
    ? 'Günün ayetini okumak için tıklayın'
    : 'Günün hadisini okumak için tıklayın';

  return scheduleLocalNotification(title, body, delay, `daily-${type}`) as number | null;
}

// Register background sync
export async function registerBackgroundSync(tag: string) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    try {
      await (reg as any).sync.register(tag);
    } catch {
      console.log('Background sync registration failed');
    }
  }
}
