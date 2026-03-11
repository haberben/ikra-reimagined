import { useState } from "react";
import { TURKISH_CITIES } from "@/data/cities";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
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

export default function PrayerTimesPage({ city, setCity, onNotifications, onMenuOpen }: PrayerTimesPageProps) {
  const { times, loading } = usePrayerTimes(city);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});
  const [notifTimes, setNotifTimes] = useState<Record<string, string>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [compassHeading, setCompassHeading] = useState(0);

  const filteredCities = TURKISH_CITIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  // Qibla compass attempt
  const startCompass = () => {
    if ("DeviceOrientationEvent" in window) {
      const handler = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null) setCompassHeading(e.alpha);
      };
      window.addEventListener("deviceorientation", handler);
    }
  };

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
              وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">
              "Kim Allah'a tevekkül ederse, O ona yeter."
            </p>
            <p className="mt-1 text-xs text-primary/60">Talak Suresi, 3</p>
            <button className="mt-2 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              Paylaş
            </button>
          </div>

          {/* Hadis */}
          <div className="mt-3 rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-bold uppercase text-primary">Hadis-i Şerif</h4>
            <p className="font-arabic text-xl leading-loose text-foreground" dir="rtl">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">
              "Sizin en hayırlınız Kur'an'ı öğrenen ve öğretendir."
            </p>
            <p className="mt-1 text-xs text-primary/60">Buhârî, Fedâilü'l-Kur'ân, 21</p>
            <button className="mt-2 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              Paylaş
            </button>
          </div>
        </div>

        {/* Kıble Compass */}
        <div className="mt-6 mb-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Kıble Bulucu</h3>
          <div className="flex flex-col items-center rounded-xl border border-primary/10 bg-card p-6 shadow-sm">
            <div className="relative h-48 w-48">
              {/* Compass circle */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-2 rounded-full border border-primary/10" />
              {/* N/S/E/W labels */}
              <span className="absolute left-1/2 top-1 -translate-x-1/2 text-xs font-bold text-primary">K</span>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground">G</span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">D</span>
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">B</span>
              {/* Needle */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
                style={{ transform: `rotate(${154 - compassHeading}deg)` }}
              >
                <div className="flex flex-col items-center">
                  <div className="h-16 w-1 rounded-full bg-primary" />
                  <span className="material-symbols-outlined text-accent text-[32px]">mosque</span>
                  <div className="h-16 w-1 rounded-full bg-muted" />
                </div>
              </div>
            </div>
            <button
              onClick={startCompass}
              className="mt-4 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
            >
              Pusulayı Başlat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
