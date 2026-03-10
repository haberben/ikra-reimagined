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

export function usePrayerTimes(city: string) {
  const [times, setTimes] = useState<PrayerTimesData | null>(null);
  const [hijri, setHijri] = useState<HijriDate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimes = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=TR&method=13`
        );
        const data = await res.json();
        if (data.code === 200) {
          setTimes(data.data.timings);
          setHijri(data.data.date.hijri);
        }
      } catch (e) {
        console.error("Prayer times fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTimes();
  }, [city]);

  return { times, hijri, loading };
}

export function useCurrentPrayer(times: PrayerTimesData | null) {
  const [current, setCurrent] = useState<string>("Fajr");
  const [next, setNext] = useState<string>("Sunrise");
  const [remaining, setRemaining] = useState<string>("--:--");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!times) return;

    const update = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const prayerOrder = [
        { key: "Imsak", name: "İmsak", label: "Fajr" },
        { key: "Fajr", name: "Sabah", label: "Fajr" },
        { key: "Sunrise", name: "Güneş", label: "Sunrise" },
        { key: "Dhuhr", name: "Öğle", label: "Dhuhr" },
        { key: "Asr", name: "İkindi", label: "Asr" },
        { key: "Maghrib", name: "Akşam", label: "Maghrib" },
        { key: "Isha", name: "Yatsı", label: "Isha" },
      ];

      const toMinutes = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      let currentPrayer = prayerOrder[prayerOrder.length - 1];
      let nextPrayer = prayerOrder[0];

      for (let i = 0; i < prayerOrder.length; i++) {
        const time = toMinutes((times as any)[prayerOrder[i].key]);
        if (nowMinutes < time) {
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

      const nextTime = toMinutes((times as any)[nextPrayer.key]);
      let diff = nextTime - nowMinutes;
      if (diff < 0) diff += 24 * 60;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      setRemaining(`${h}sa ${m}dk`);

      const currentTime = toMinutes((times as any)[currentPrayer.key]);
      let totalSpan = nextTime - currentTime;
      if (totalSpan <= 0) totalSpan += 24 * 60;
      let elapsed = nowMinutes - currentTime;
      if (elapsed < 0) elapsed += 24 * 60;
      setProgress(Math.min((elapsed / totalSpan) * 100, 100));
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [times]);

  return { current, next, remaining, progress };
}
