import { useState, useEffect, useRef } from "react";
import { TURKISH_CITIES } from "@/data/cities";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useDailyContent } from "@/hooks/useDailyContent";
import { useFavorites } from "@/hooks/useFavorites";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";

interface PrayerTimesPageProps {
  city: string;
  setCity: (c: string) => void;
  onNotifications: () => void;
  onMenuOpen: () => void;
}

const PRAYERS = [
  { key: "Fajr", name: "Sabah", icon: "dark_mode" },
  { key: "Dhuhr", name: "Öğle", icon: "wb_sunny" },
  { key: "Asr", name: "İkindi", icon: "wb_twilight" },
  { key: "Maghrib", name: "Akşam", icon: "nights_stay" },
  { key: "Isha", name: "Yatsı", icon: "bedtime" },
];

const TIME_OPTIONS = ["Vakitte", "5 dk önce", "10 dk önce", "15 dk önce", "30 dk önce"];

// Istanbul Qibla bearing ~154°
const QIBLA_BEARING = 154;
const QIBLA_THRESHOLD = 5; // degrees tolerance

export default function PrayerTimesPage({ city, setCity, onNotifications, onMenuOpen }: PrayerTimesPageProps) {
  const { times, loading } = usePrayerTimes(city);
  const { ayet, hadis } = useDailyContent();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});
  const [notifTimes, setNotifTimes] = useState<Record<string, string>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [compassActive, setCompassActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const handlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  const filteredCities = TURKISH_CITIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate direction to Qibla
  const getQiblaDirection = () => {
    if (compassHeading === null) return null;
    const diff = ((QIBLA_BEARING - compassHeading) % 360 + 360) % 360;
    if (diff <= QIBLA_THRESHOLD || diff >= 360 - QIBLA_THRESHOLD) return "correct";
    if (diff > 180) return "right"; // turn right
    return "left"; // turn left
  };

  const qiblaDir = getQiblaDirection();
  const isOnQibla = qiblaDir === "correct";

  const startCompass = async () => {
    // iOS 13+ requires permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm !== "granted") { setPermissionDenied(true); return; }
      } catch { setPermissionDenied(true); return; }
    }

    if (handlerRef.current) {
      window.removeEventListener("deviceorientation", handlerRef.current);
    }

    const handler = (e: DeviceOrientationEvent) => {
      // Use webkitCompassHeading for iOS, alpha for Android
      const heading = (e as any).webkitCompassHeading ?? (e.alpha !== null ? (360 - e.alpha) % 360 : null);
      if (heading !== null) setCompassHeading(heading);
    };
    handlerRef.current = handler;
    window.addEventListener("deviceorientation", handler);
    setCompassActive(true);
  };

  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        window.removeEventListener("deviceorientation", handlerRef.current);
      }
    };
  }, []);

  return (
    <div className="pb-20">
      <StickyHeader
        title="İKRA"
        subtitle="NAMAZ VAKİTLERİ"
        onLeftClick={onMenuOpen}
        onRightClick={onNotifications}
      />

      <div className="px-4 pt-4">
        {/* City selector */}
        <div className="relative mb-4">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex w-full items-center gap-3 rounded-xl border border-primary/10 bg-card px-4 py-3 text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
            <span className="font-medium">{city}</span>
            <span className="material-symbols-outlined ml-auto text-muted-foreground">expand_more</span>
          </button>

          {searchOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-primary/10 bg-card shadow-lg">
              <div className="sticky top-0 bg-card p-2">
                <input
                  type="text"
                  placeholder="Şehir ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg bg-secondary px-3 py-2 text-sm focus:outline-none"
                  autoFocus
                />
              </div>
              {filteredCities.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCity(c); setSearchOpen(false); setSearch(""); localStorage.setItem("ikra_city", c); }}
                  className={cn(
                    "block w-full px-4 py-2 text-left text-sm hover:bg-primary/5",
                    c === city && "bg-primary/5 font-bold text-primary"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prayer cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          </div>
        ) : times ? (
          <div className="space-y-3">
            {PRAYERS.map((p) => (
              <div key={p.key} className="rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="material-symbols-outlined text-primary">{p.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold">{p.name}</p>
                      <p className="text-lg font-extrabold text-primary">
                        {(times as any)[p.key]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notification toggle */}
                <div className="mt-3 flex items-center justify-between border-t border-primary/5 pt-3">
                  <span className="text-xs text-muted-foreground">Bildirim</span>
                  <div className="flex items-center gap-2">
                    {notifications[p.key] && (
                      <select
                        value={notifTimes[p.key] || "Vakitte"}
                        onChange={(e) => setNotifTimes({ ...notifTimes, [p.key]: e.target.value })}
                        className="rounded-lg bg-secondary px-2 py-1 text-xs"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => setNotifications({ ...notifications, [p.key]: !notifications[p.key] })}
                      className={cn(
                        "h-[31px] w-[51px] rounded-full transition-colors",
                        notifications[p.key] ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <div className={cn(
                        "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                        notifications[p.key] ? "translate-x-[22px]" : "translate-x-[2px]"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Günün Mesajları */}
        <div className="mt-6">
          <div className="islamic-pattern mb-3 rounded-t-xl bg-primary px-4 py-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary-foreground">
              Günün Mesajları
            </h3>
          </div>

          {/* Ayet */}
          <div className="rounded-b-xl border border-t-0 border-primary/10 bg-card p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-bold uppercase text-primary">Günün Ayeti</h4>
            <p className="font-arabic text-2xl leading-loose text-foreground" dir="rtl">
              {ayet?.arabic_text || "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ"}
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">
              "{ayet?.turkish_text || "Kim Allah'a tevekkül ederse, O ona yeter."}"
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-primary/60">{ayet?.source || "Talak Suresi, 3"}</p>
              <div className="flex gap-2">
                <button className="rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                  Paylaş
                </button>
                {ayet && (
                  <button
                    onClick={() => toggleFavorite(ayet.id, "ayet")}
                    className="p-1 text-muted-foreground hover:text-primary"
                  >
                    <span
                      className={cn("material-symbols-outlined text-[18px]", isFavorite(ayet.id) && "text-destructive")}
                      style={isFavorite(ayet.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >favorite</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hadis */}
          <div className="mt-3 rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-bold uppercase text-primary">Hadis-i Şerif</h4>
            <p className="font-arabic text-xl leading-loose text-foreground" dir="rtl">
              {hadis?.arabic_text || "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"}
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">
              "{hadis?.turkish_text || "Sizin en hayırlınız Kur'an'ı öğrenen ve öğretendir."}"
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-primary/60">{hadis?.source || "Buhârî"}</p>
              <div className="flex gap-2">
                <button className="rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                  Paylaş
                </button>
                {hadis && (
                  <button
                    onClick={() => toggleFavorite(hadis.id, "hadis")}
                    className="p-1 text-muted-foreground hover:text-primary"
                  >
                    <span
                      className={cn("material-symbols-outlined text-[18px]", isFavorite(hadis.id) && "text-destructive")}
                      style={isFavorite(hadis.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >favorite</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kıble Compass */}
        <div className="mt-6 mb-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Kıble Bulucu</h3>
          <div className={cn(
            "flex flex-col items-center rounded-xl border bg-card p-6 shadow-sm transition-all duration-500",
            isOnQibla ? "border-accent shadow-[0_0_30px_-5px_hsl(var(--accent)/0.5)]" : "border-primary/10"
          )}>
            <div className="relative h-52 w-52">
              {/* Outer ring */}
              <div className={cn(
                "absolute inset-0 rounded-full border-2 transition-colors duration-500",
                isOnQibla ? "border-accent" : "border-primary/20"
              )} />
              <div className="absolute inset-2 rounded-full border border-primary/10" />

              {/* N/S/E/W labels */}
              <span className="absolute left-1/2 top-2 -translate-x-1/2 text-xs font-bold text-primary">K</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground">G</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">D</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">B</span>

              {/* Qibla needle */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${compassHeading !== null ? QIBLA_BEARING - compassHeading : QIBLA_BEARING}deg)` }}
              >
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "h-14 w-1.5 rounded-full transition-colors duration-500",
                    isOnQibla ? "bg-accent" : "bg-primary"
                  )} />
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500",
                    isOnQibla ? "bg-accent scale-110" : "bg-primary/10"
                  )}>
                    <span className={cn(
                      "material-symbols-outlined text-[24px] transition-colors duration-500",
                      isOnQibla ? "text-primary-foreground" : "text-primary"
                    )}>mosque</span>
                  </div>
                  <div className="h-14 w-1 rounded-full bg-muted" />
                </div>
              </div>

              {/* Glow effect when on Qibla */}
              {isOnQibla && (
                <div className="absolute inset-0 rounded-full animate-pulse bg-accent/10" />
              )}
            </div>

            {/* Direction guidance */}
            <div className="mt-4 text-center">
              {!compassActive ? (
                <button
                  onClick={startCompass}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
                >
                  <span className="material-symbols-outlined text-[16px] align-middle mr-1">explore</span>
                  Pusulayı Başlat
                </button>
              ) : permissionDenied ? (
                <p className="text-sm text-destructive">Pusula izni reddedildi. Ayarlardan izin verin.</p>
              ) : isOnQibla ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
                    <span className="material-symbols-outlined text-accent text-[20px]">check_circle</span>
                    <span className="text-sm font-bold text-accent">Kıble Yönündesiniz!</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Cihazınızı bu yönde tutun</p>
                </div>
              ) : qiblaDir === "left" ? (
                <div className="flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2">
                  <span className="material-symbols-outlined text-primary text-[20px] animate-bounce">arrow_back</span>
                  <span className="text-sm font-medium text-primary">Sola çevirin</span>
                </div>
              ) : qiblaDir === "right" ? (
                <div className="flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2">
                  <span className="material-symbols-outlined text-primary text-[20px] animate-bounce">arrow_forward</span>
                  <span className="text-sm font-medium text-primary">Sağa çevirin</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Pusula yükleniyor...</p>
              )}
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground text-center">
              Kıble açısı: {QIBLA_BEARING}° (İstanbul için)
              {compassHeading !== null && ` • Pusula: ${Math.round(compassHeading)}°`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
