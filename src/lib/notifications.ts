// Push notification utilities for İKRA app
import { supabase } from "@/integrations/supabase/client";

const isNative = () => !!(window as any).Capacitor?.isNativePlatform?.();

// Sound preferences
export type NotifSound = "default" | "ezan" | "silent";

export function getNotifSoundPref(): NotifSound {
  return (localStorage.getItem("ikra_notif_sound") as NotifSound) || "default";
}

export function setNotifSoundPref(sound: NotifSound) {
  localStorage.setItem("ikra_notif_sound", sound);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    } catch {
      return false;
    }
  }

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

// Unique ID generator for Capacitor notifications (needs integer IDs)
let notifIdCounter = Math.floor(Math.random() * 10000);
function nextNotifId(): number {
  notifIdCounter += 1;
  return notifIdCounter;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  delayMs: number,
  tag?: string
): Promise<number | null> {
  const permitted = await requestNotificationPermission();
  if (!permitted) return null;

  const sound = getNotifSoundPref();
  if (sound === "silent" && isNative()) {
    // Still schedule but without sound
  }

  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const id = nextNotifId();
      const scheduleAt = new Date(Date.now() + delayMs);
      
      // Sound file mapping for Android res/raw
      let soundFile: string | undefined = undefined;
      if (sound === "ezan") {
        soundFile = "ezan.mp3";
      } else if (sound === "silent") {
        soundFile = undefined; // No sound
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { at: scheduleAt },
            sound: soundFile,
            smallIcon: "ic_stat_icon_config_sample",
            iconColor: "#1a8a4a",
            ...(sound === "silent" ? { extra: { silent: "true" } } : {}),
          },
        ],
      });
      return id;
    } catch (e) {
      console.error("Capacitor local notification error:", e);
      return null;
    }
  }

  // Web fallback with setTimeout
  const timerId = window.setTimeout(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: { title, body, tag: tag || 'ikra-local', icon: '/icons/icon-192.png', silent: sound === 'silent' },
      });
    } else {
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
        tag: tag || 'ikra-local',
        silent: sound === 'silent',
      });
    }
  }, delayMs);

  return timerId;
}

export async function cancelScheduledNotification(timerId: number) {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.cancel({ notifications: [{ id: timerId }] });
    } catch {
      // ignore
    }
    return;
  }
  window.clearTimeout(timerId);
}

// Cancel all pending native notifications
async function cancelAllNativeNotifications() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
      }
    } catch {
      // ignore
    }
  }
}

// Fetch a random ayet or hadis from daily_content
async function fetchRandomContent(): Promise<{ turkish_text: string; source: string | null; type: string } | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: todayData } = await supabase
      .from('daily_content')
      .select('turkish_text, source, type')
      .eq('date', today)
      .limit(2);

    if (todayData && todayData.length > 0) {
      return todayData[Math.floor(Math.random() * todayData.length)];
    }

    const { data: allData } = await supabase
      .from('daily_content')
      .select('turkish_text, source, type')
      .order('date', { ascending: false })
      .limit(10);

    if (allData && allData.length > 0) {
      return allData[Math.floor(Math.random() * allData.length)];
    }

    return null;
  } catch {
    return null;
  }
}

// Schedule prayer notifications based on user preferences
export async function schedulePrayerNotifications(
  times: Record<string, string>,
  toggles: Record<string, boolean>,
  offsets: Record<string, string>
): Promise<number[]> {
  // Cancel all existing native notifications first to avoid duplicates
  await cancelAllNativeNotifications();

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

  // Pre-fetch content for notifications
  const content = await fetchRandomContent();

  for (const [key, enabled] of Object.entries(toggles)) {
    if (!enabled || !times[key]) continue;

    const [h, m] = times[key].split(':').map(Number);
    const prayerDate = new Date(now);
    prayerDate.setHours(h, m, 0, 0);

    // Parse offset
    const offsetStr = offsets[key] || 'Vakitte';
    let offsetMinutes = 0;
    if (offsetStr.includes('30')) offsetMinutes = 30;
    else if (offsetStr.includes('15')) offsetMinutes = 15;
    else if (offsetStr.includes('10')) offsetMinutes = 10;
    else if (offsetStr.includes('5')) offsetMinutes = 5;

    const notifyTime = prayerDate.getTime() - offsetMinutes * 60 * 1000;
    const delay = notifyTime - nowMs;

    if (delay > 0) {
      const name = PRAYER_NAMES[key] || key;
      let bodyText = offsetMinutes > 0
        ? `${name} namazına ${offsetMinutes} dakika kaldı`
        : `${name} namazı vakti girdi`;

      // Append ayet/hadis content
      if (content) {
        const label = content.type === 'ayet' ? '📖 Ayet' : '📿 Hadis';
        bodyText += `\n\n${label}: "${content.turkish_text}"`;
        if (content.source) bodyText += ` — ${content.source}`;
      }

      const id = await scheduleLocalNotification(
        `🕌 ${name} Vakti`,
        bodyText,
        delay,
        `prayer-${key}`
      );
      if (id !== null) timerIds.push(id);
    }
  }

  return timerIds;
}

// Schedule daily ayet/hadis notification
export async function scheduleDailyContentNotification(
  type: 'ayet' | 'hadis',
  hour: number,
  minute: number
): Promise<number | null> {
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

  return scheduleLocalNotification(title, body, delay, `daily-${type}`);
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
