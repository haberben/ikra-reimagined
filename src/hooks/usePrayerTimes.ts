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

export function usePrayerTimes(city: string, coords?: { lat: number; lng: number }) {
  const [times, setTimes] = useState<PrayerTimesData | null>(null);
  const [hijri, setHijri] = useState<HijriDate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = coords ? `ikra_times_${coords.lat}_${coords.lng}` : `ikra_times_${city}`;
    const cacheHijriKey = cacheKey + "_hijri";
    const cacheTsKey = cacheKey + "_ts";
    const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

    const fetchTimes = async () => {
      // Try cache first
      try {
        const cachedTs = localStorage.getItem(cacheTsKey);
        if (cachedTs && Date.now() - Number(cachedTs) < TTL_MS) {
          const cachedTimes = localStorage.getItem(cacheKey);
          const cachedHijri = localStorage.getItem(cacheHijriKey);
          if (cachedTimes) {
            setTimes(JSON.parse(cachedTimes));
            if (cachedHijri) setHijri(JSON.parse(cachedHijri));
            setLoading(false);
            return; // Serve from cache
          }
        }
      } catch {}

      try {
        setLoading(true);
        let url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=TR&method=13`;
        
        if (coords) {
           const timestamp = Math.floor(Date.now() / 1000);
           url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${coords.lat}&longitude=${coords.lng}&method=13`;
        }

        const res = await fetch(url);
        const data = await res.json();
        if (data.code === 200) {
          setTimes(data.data.timings);
          setHijri(data.data.date.hijri);
          // Save to cache
          try {
            localStorage.setItem(cacheKey, JSON.stringify(data.data.timings));
            localStorage.setItem(cacheHijriKey, JSON.stringify(data.data.date.hijri));
            localStorage.setItem(cacheTsKey, String(Date.now()));
          } catch {}
        }
      } catch (e) {
        console.error("Prayer times fetch error:", e);
        // Serve stale cache if available
        try {
          const cachedTimes = localStorage.getItem(cacheKey);
          const cachedHijri = localStorage.getItem(cacheHijriKey);
          if (cachedTimes) {
            setTimes(JSON.parse(cachedTimes));
            if (cachedHijri) setHijri(JSON.parse(cachedHijri));
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    fetchTimes();
  }, [city, coords?.lat, coords?.lng]);

  return { times, hijri, loading };
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
        const [h, m] = t.split(":").map(Number);
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
