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
            ongoing: tag === "persistent",  // If the tag is persistent, make it sticky
            autoCancel: tag !== "persistent", // Don't auto-dismiss sticky ones
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

// Persistent "Ezan Vakti" countdown for Android
let persistentInterval: any = null;
const PERSISTENT_NOTIF_ID = 99999;

export async function managePersistentNotification(
  enabled: boolean, 
  times: Record<string, string> | null
) {
  if (!isNative()) return; // Only relevant for Android/iOS native

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    // If disabled or no times, clear everything
    if (!enabled || !times) {
      if (persistentInterval) clearInterval(persistentInterval);
      await LocalNotifications.cancel({ notifications: [{ id: PERSISTENT_NOTIF_ID }] });
      return;
    }

    // Clear any existing interval to prevent duplicates
    if (persistentInterval) clearInterval(persistentInterval);

    const updateNotif = async () => {
      if (!times || !times.Imsak) return;

      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const nowMinutes = currentH * 60 + currentM;

      const timeArray = [
        { key: "Imsak", label: "İmsak", time: times.Imsak },
        { key: "Sunrise", label: "Güneş", time: times.Sunrise },
        { key: "Dhuhr", label: "Öğle", time: times.Dhuhr },
        { key: "Asr", label: "İkindi", time: times.Asr },
        { key: "Maghrib", label: "Akşam", time: times.Maghrib },
        { key: "Isha", label: "Yatsı", time: times.Isha },
      ];

      const toMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };

      let nextPrayer = timeArray[0];

      for (let i = 0; i < timeArray.length; i++) {
        if (nowMinutes < toMinutes(timeArray[i].time)) {
          nextPrayer = timeArray[i];
          break;
        }
      }

      const nextTime = toMinutes(nextPrayer.time);
      let diff = nextTime - nowMinutes;
      if (diff < 0) diff += 24 * 60; // Next day's Imsak
      
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      
      const timeRemaining = h > 0 ? `${h} Saat ${m} Dakika Kaldı` : `${m} Dakika Kaldı`;

      await LocalNotifications.schedule({
        notifications: [
          {
            title: `Sıradaki Vakit: ${nextPrayer.label} (${nextPrayer.time})`,
            body: timeRemaining,
            id: PERSISTENT_NOTIF_ID,
            schedule: { at: new Date(Date.now() + 1000) }, // Schedule immediately
            smallIcon: "ic_stat_icon_config_sample",
            iconColor: "#1a8a4a",
            ongoing: true, // Sticky notification
            autoCancel: false,
            sound: undefined, // Silent update
          },
        ],
      });
    };

    // Run once immediately, then every 1 minute
    await updateNotif();
    persistentInterval = setInterval(updateNotif, 60000);

  } catch (e) {
    console.error("Persistent notification error:", e);
  }
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

// Fetch multiple random ayets or hadiths from daily_content
async function fetchMultipleContent(count: number): Promise<{ turkish_text: string; source: string | null; type: string }[]> {
  try {
    const { data: allData } = await supabase
      .from('daily_content')
      .select('turkish_text, source, type')
      .order('date', { ascending: false })
      .limit(30);

    if (allData && allData.length > 0) {
      // Shuffle the array and return the requested number of items
      const shuffled = allData.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    }
    return [];
  } catch {
    return [];
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

  // Pre-fetch multiple contents to ensure variety across the 5 prayers
  const contents = await fetchMultipleContent(5);
  let contentIndex = 0;

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
      let bodyText = "";

      // Get a unique content for this specific prayer
      const currentContent = contents[contentIndex % contents.length];
      contentIndex++;

      // Ayet/hadis content first
      if (currentContent) {
        let label = currentContent.type === 'ayet' ? '📖 Ayet' : '📿 Hadis';
        bodyText += `${label}: "${currentContent.turkish_text}"`;
        if (currentContent.source) bodyText += ` — ${currentContent.source}`;
        bodyText += "\n\n";
      } else {
         bodyText += `📖 Ayet: "Şüphesiz zorlukla beraber bir kolaylık vardır." — İnşirah, 5\n\n`;
      }

      // Time offset second
      bodyText += offsetMinutes > 0
        ? `📍 ${name} vaktine ${offsetMinutes} dakika kaldı.`
        : `📍 ${name} vakti girdi.`;

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
