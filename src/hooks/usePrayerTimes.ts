import { useState, useEffect } from "react";

export interface PrayerTimesData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
}

export interface HijriDate {
  day: string;
  month: { en: string; ar: string };
  year: string;
}

export interface DailyPrayer {
  date: string;
  times: PrayerTimesData;
  hijri: HijriDate;
}

export function usePrayerTimes(city: string, coords?: { lat: number; lng: number }) {
  const [times, setTimes] = useState<PrayerTimesData | null>(null);
  const [hijri, setHijri] = useState<HijriDate | null>(null);
  const [weekly, setWeekly] = useState<DailyPrayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const todayStr = now.getDate().toString().padStart(2, '0');

    const cacheKey = coords ? `ikra_cal_${coords.lat}_${coords.lng}_${month}_${year}` : `ikra_cal_${city}_${month}_${year}`;
    const cacheTsKey = cacheKey + "_ts";
    const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for calendar

    const fetchCalendar = async () => {
      try {
        setLoading(true);
        // Fetch current month
        let url = `https://api.aladhan.com/v1/calendarByCity?city=${encodeURIComponent(city)}&country=TR&method=13&month=${month}&year=${year}`;
        if (coords) {
          url = `https://api.aladhan.com/v1/calendar?latitude=${coords.lat}&longitude=${coords.lng}&method=13&month=${month}&year=${year}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        let allDays = data.code === 200 ? data.data : [];

        // If we are near the end of the month (last 7 days), fetch next month too
        const daysInMonth = new Date(year, month, 0).getDate();
        if (now.getDate() > daysInMonth - 7) {
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextYear = month === 12 ? year + 1 : year;
          let nextUrl = `https://api.aladhan.com/v1/calendarByCity?city=${encodeURIComponent(city)}&country=TR&method=13&month=${nextMonth}&year=${nextYear}`;
          if (coords) {
            nextUrl = `https://api.aladhan.com/v1/calendar?latitude=${coords.lat}&longitude=${coords.lng}&method=13&month=${nextMonth}&year=${nextYear}`;
          }
          const nextRes = await fetch(nextUrl);
          const nextData = await nextRes.json();
          if (nextData.code === 200) {
            allDays = [...allDays, ...nextData.data];
          }
        }

        processData(allDays);
        // Cache management (simplified for multi-month for now)
        try {
          localStorage.setItem(cacheKey, JSON.stringify(allDays));
          localStorage.setItem(cacheTsKey, String(Date.now()));
        } catch {}
      } catch (e) {
        console.error("Prayer times fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    const processData = (days: any[]) => {
      const todayData = days.find(d => d.date.gregorian.day === todayStr);
      if (todayData) {
        setTimes(todayData.timings);
        setHijri(todayData.date.hijri);
      }

      // Get next 7 days (including cross-month days if available)
      const todayIndex = days.findIndex(d => d.date.gregorian.day === todayStr);
      const nextDays = days.slice(todayIndex, todayIndex + 7).map(d => ({
        date: d.date.readable,
        times: d.timings,
        hijri: d.date.hijri
      }));
      setWeekly(nextDays);
      setLoading(false);
    };

    // Try cache first
    try {
      const cachedTs = localStorage.getItem(cacheTsKey);
      if (cachedTs && Date.now() - Number(cachedTs) < TTL_MS) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const data = JSON.parse(cachedData);
          processData(data);
          return;
        }
      }
    } catch {}

    fetchCalendar();
  }, [city, coords?.lat, coords?.lng]);

  return { times, hijri, weekly, loading };
}

export function useCurrentPrayer(times: PrayerTimesData | null) {
  const [current, setCurrent] = useState<string>("İmsak");
  const [next, setNext] = useState<string>("Güneş");
  const [remaining, setRemaining] = useState<string>("--:--");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!times) return;

    const update = () => {
      const now = new Date();
      const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      const prayerOrder = [
        { key: "Fajr", name: "İmsak", label: "Fajr" }, // Aladhan's Fajr is Diyanet's Imsak
        { key: "Sunrise", name: "Güneş", label: "Sunrise" },
        { key: "Dhuhr", name: "Öğle", label: "Dhuhr" },
        { key: "Asr", name: "İkindi", label: "Asr" },
        { key: "Maghrib", name: "Akşam", label: "Maghrib" },
        { key: "Isha", name: "Yatsı", label: "Isha" },
      ];

      const toSeconds = (t: string) => {
        // Sanitize string (regex to match HH:mm, removing offsets like +03)
        const match = t.match(/(\d{1,2}):(\d{1,2})/);
        if (!match) return 0;
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        return h * 3600 + m * 60;
      };

      let currentPrayer = prayerOrder[prayerOrder.length - 1];
      let nextPrayer = prayerOrder[0];

      for (let i = 0; i < prayerOrder.length; i++) {
        const time = toSeconds((times as any)[prayerOrder[i].key]);
        if (nowSeconds < time) {
          nextPrayer = prayerOrder[i];
          currentPrayer = i > 0 ? prayerOrder[i - 1] : prayerOrder[prayerOrder.length - 1];
          break;
        }
        if (i === prayerOrder.length - 1) {
          currentPrayer = prayerOrder[i];
          nextPrayer = prayerOrder[0];
        }
      }

      setCurrent(currentPrayer.name);
      setNext(nextPrayer.name);

      const nextTimeSecs = toSeconds((times as any)[nextPrayer.key]);
      let diffSecs = nextTimeSecs - nowSeconds;
      if (diffSecs < 0) diffSecs += 24 * 3600; // next day
      
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const s = diffSecs % 60;
      setRemaining(
        h > 0
          ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );

      const currentTimeSecs = toSeconds((times as any)[currentPrayer.key]);
      let totalSpan = nextTimeSecs - currentTimeSecs;
      if (totalSpan <= 0) totalSpan += 24 * 3600;
      let elapsed = nowSeconds - currentTimeSecs;
      if (elapsed < 0) elapsed += 24 * 3600;
      setProgress(Math.min((elapsed / totalSpan) * 100, 100));
    };

    update();
    const interval = setInterval(update, 1000); // tick every second for real-time countdown
    return () => clearInterval(interval);
  }, [times]);

  return { current, next, remaining, progress };
}
