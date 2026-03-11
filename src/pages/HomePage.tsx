import { usePrayerTimes, useCurrentPrayer } from "@/hooks/usePrayerTimes";
import { useDailyContent } from "@/hooks/useDailyContent";
import { useFavorites } from "@/hooks/useFavorites";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";

interface HomePageProps {
  city: string;
  onNavigate: (tab: string) => void;
  onNotifications: () => void;
  onZikirmatik: () => void;
  onMenuOpen: () => void;
}

const PRAYER_LABELS: Record<string, string> = {
  Imsak: "İmsak", Fajr: "Sabah", Sunrise: "Güneş", Dhuhr: "Öğle",
  Asr: "İkindi", Maghrib: "Akşam", Isha: "Yatsı",
};

const DISCOVER_ITEMS = [
  { icon: "auto_stories", label: "Hatim", action: "tab:hatim" },
  { icon: "wallpaper", label: "Duvar Kağıdı", action: "tab:gallery" },
  { icon: "explore", label: "Kıble Bulucu", action: "tab:times" },
  { icon: "counter_1", label: "Zikirmatik", action: "zikirmatik" },
];

export default function HomePage({ city, onNavigate, onNotifications, onZikirmatik, onMenuOpen }: HomePageProps) {
  const { times, hijri, loading } = usePrayerTimes(city);
  const { current, next, remaining, progress } = useCurrentPrayer(times);
  const { ayet, hadis } = useDailyContent();
  const { toggleFavorite, isFavorite } = useFavorites();

  const miniPrayers = times
    ? [
        { key: "Imsak", time: times.Imsak },
        { key: "Sunrise", time: times.Sunrise },
        { key: "Dhuhr", time: times.Dhuhr },
        { key: "Asr", time: times.Asr },
        { key: "Maghrib", time: times.Maghrib },
        { key: "Isha", time: times.Isha },
      ]
    : [];

  return (
    <div className="pb-20">
      {/* Dark green header */}
      <div className="islamic-pattern bg-primary pb-16 pt-0">
        <StickyHeader
          dark
          showPattern={false}
          onLeftClick={onMenuOpen}
          onRightClick={onNotifications}
          className="border-none bg-transparent"
        />
        {hijri && (
          <div className="px-4 pb-4 text-center">
            <span className="text-xs text-primary-foreground/70">Bugün</span>
            <p className="text-sm font-medium text-primary-foreground">
              {hijri.day} {hijri.month.ar} {hijri.year}
            </p>
          </div>
        )}
      </div>

      {/* Main prayer card */}
      <div className="px-4 -mt-12">
        <div className="rounded-xl border border-primary/10 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Şu Anki Vakit
              </p>
              <h2 className="mt-1 text-4xl font-extrabold text-foreground">{current}</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[28px]">wb_sunny</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            <span>{next} vaktine kalan: <strong className="text-foreground">{remaining}</strong></span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Mini prayer grid */}
          {miniPrayers.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {miniPrayers.map((p) => {
                const isActive = PRAYER_LABELS[p.key] === current;
                return (
                  <div
                    key={p.key}
                    className={cn(
                      "rounded-lg p-2 text-center",
                      isActive
                        ? "bg-primary/5 ring-2 ring-primary/20"
                        : "bg-secondary"
                    )}
                  >
                    <p className="text-[10px] text-muted-foreground">{PRAYER_LABELS[p.key]}</p>
                    <p className="text-sm font-bold">{p.time}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Günün Ayeti */}
      <div className="mt-6 px-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Günün Ayeti</h3>
        <div className="rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="font-arabic text-2xl leading-loose text-foreground" dir="rtl">
              {ayet?.arabic_text || "إِنَّ مَعَ الْعُسْرِ يُسْرًا"}
            </p>
          </div>
          <p className="mt-3 text-sm italic text-muted-foreground">
            "{ayet?.turkish_text || "Şüphesiz zorlukla beraber kolaylık vardır."}"
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-primary/60">{ayet?.source || "İnşirah Suresi, 6"}</span>
            <div className="flex gap-2">
              <button className="p-1 text-muted-foreground hover:text-primary">
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>
              {ayet && (
                <button
                  onClick={() => toggleFavorite(ayet.id, "ayet")}
                  className="p-1 text-muted-foreground hover:text-primary"
                >
                  <span
                    className={cn("material-symbols-outlined text-[20px]", isFavorite(ayet.id) && "text-destructive")}
                    style={isFavorite(ayet.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >favorite</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Günün Hadisi */}
      {hadis && (
        <div className="mt-4 px-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent">Günün Hadisi</h3>
          <div className="rounded-xl border border-accent/20 bg-card p-4 shadow-sm">
            <div className="rounded-lg bg-accent/5 p-4">
              <p className="font-arabic text-xl leading-loose text-foreground" dir="rtl">
                {hadis.arabic_text}
              </p>
            </div>
            <p className="mt-3 text-sm italic text-muted-foreground">
              "{hadis.turkish_text}"
            </p>
            {hadis.source && (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-accent/60">{hadis.source}</p>
                <button
                  onClick={() => toggleFavorite(hadis.id, "hadis")}
                  className="p-1 text-muted-foreground hover:text-accent"
                >
                  <span
                    className={cn("material-symbols-outlined text-[20px]", isFavorite(hadis.id) && "text-destructive")}
                    style={isFavorite(hadis.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >favorite</span>
                </button>
              </div>
            )}
            {!hadis.source && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => toggleFavorite(hadis.id, "hadis")}
                  className="p-1 text-muted-foreground hover:text-accent"
                >
                  <span
                    className={cn("material-symbols-outlined text-[20px]", isFavorite(hadis.id) && "text-destructive")}
                    style={isFavorite(hadis.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >favorite</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keşfet Grid */}
      <div className="mt-6 px-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Keşfet</h3>
        <div className="grid grid-cols-2 gap-3">
          {DISCOVER_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => item.action === "zikirmatik" ? onZikirmatik() : item.action.startsWith("tab:") && onNavigate(item.action.replace("tab:", ""))}
              className="flex flex-col items-center gap-2 rounded-xl border border-primary/10 bg-card p-4 shadow-sm transition-colors hover:bg-primary/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="material-symbols-outlined text-primary text-[24px]">{item.icon}</span>
              </div>
              <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Full prayer times */}
      {times && (
        <div className="mt-6 px-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
            Namaz Vakitleri — {city}
          </h3>
          <div className="space-y-2">
            {(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const).map((key) => {
              const isActive = PRAYER_LABELS[key] === current;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center justify-between rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm",
                    isActive && "ring-2 ring-primary/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "material-symbols-outlined text-[20px]",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {key === "Fajr" ? "dark_mode" : key === "Dhuhr" ? "wb_sunny" : key === "Asr" ? "wb_twilight" : key === "Maghrib" ? "nights_stay" : "bedtime"}
                    </span>
                    <span className={cn("font-medium", isActive && "font-bold text-primary")}>
                      {PRAYER_LABELS[key]}
                    </span>
                  </div>
                  <span className={cn("font-bold", isActive && "text-primary")}>
                    {(times as any)[key]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
