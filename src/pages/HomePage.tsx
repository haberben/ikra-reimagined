import { usePrayerTimes, useCurrentPrayer } from "@/hooks/usePrayerTimes";
import { useDailyContent } from "@/hooks/useDailyContent";
import { useFavorites } from "@/hooks/useFavorites";
import StickyHeader from "@/components/layout/StickyHeader";
import { DailyFactCard } from "@/components/DailyFactCard";
import { MoodDiscovery } from "@/components/MoodDiscovery";
import { TevekkulVakti } from "@/components/TevekkulVakti";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

async function shareContent(type: string, arabicText: string, turkishText: string, source?: string) {
  const label = type === "ayet" ? "📖 Günün Ayeti" : "📿 Günün Hadisi";
  let text = `${label}\n\n${arabicText}\n\n"${turkishText}"`;
  if (source) text += `\n\n— ${source}`;
  text += "\n\n🕌 İKRA Uygulaması";

  if (navigator.share) {
    try {
      await navigator.share({ title: label, text });
      return;
    } catch { /* cancelled */ }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Panoya kopyalandı");
  } catch {
    toast.error("Paylaşım başarısız oldu");
  }
}

interface HomePageProps {
  city: string;
  coords?: { lat: number; lng: number };
  onNavigate: (tab: string) => void;
  onNotifications: () => void;
  onZikirmatik: () => void;
  onMenuOpen: () => void;
  onToggleDark?: () => void;
  dark?: boolean;
}

const HIJRI_MONTHS_TR: Record<string, string> = {
  "Muharram": "Muharrem", "Safar": "Safer", "Rabi' al-awwal": "Rebiülevvel",
  "Rabi' al-thani": "Rebiülahir", "Jumada al-ula": "Cemaziyelevvel",
  "Jumada al-akhira": "Cemaziyelahir", "Rajab": "Recep", "Sha'ban": "Şaban",
  "Ramadan": "Ramazan", "Shawwal": "Şevval", "Dhu al-Qi'dah": "Zilkade",
  "Dhu al-Hijjah": "Zilhicce"
};

const GREGORIAN_MONTHS_TR: Record<string, string> = {
  "Jan": "Ocak", "Feb": "Şubat", "Mar": "Mart", "Apr": "Nisan", "May": "Mayıs", "Jun": "Haziran",
  "Jul": "Temmuz", "Aug": "Ağustos", "Sep": "Eylül", "Oct": "Ekim", "Nov": "Kasım", "Dec": "Aralık"
};

const PRAYER_LABELS: Record<string, string> = {
  "Fajr": "İmsak", "Sunrise": "Güneş", "Dhuhr": "Öğle", "Asr": "İkindi", "Maghrib": "Akşam", "Isha": "Yatsı"
};

const DISCOVER_ITEMS = [
  { icon: "auto_stories", label: "Hatim", action: "tab:hatim" },
  { icon: "wallpaper", label: "Duvar Kağıdı", action: "tab:gallery" },
  { icon: "explore", label: "Kıble Yönü", action: "tab:times" },
  { icon: "counter_1", label: "Zikirmatik", action: "zikirmatik" },
];

export default function HomePage({ city, coords, onNavigate, onNotifications, onZikirmatik, onMenuOpen, onToggleDark, dark }: HomePageProps) {
  const { times, hijri, weekly, loading } = usePrayerTimes(city, coords);
  const { current, next, remaining, progress } = useCurrentPrayer(times);
  const { ayet, hadis } = useDailyContent();
  const { toggleFavorite, isFavorite } = useFavorites();

  return (
    <div className="pb-20">
      {/* Dark green header */}
      <div className="islamic-pattern bg-primary pb-16 pt-0">
        <StickyHeader
          dark
          showPattern={false}
          onLeftClick={onMenuOpen}
          onRightClick={onNotifications}
          onToggleDark={onToggleDark}
          isDark={dark}
          className="border-none bg-transparent"
        />
        {hijri && (
          <div className="px-4 pb-4 text-center">
            <span className="text-xs text-primary-foreground/70">Bugün</span>
            <p className="text-sm font-medium text-primary-foreground">
              {hijri.day} {hijri.month.ar} {hijri.year}
            </p>
            <p className="text-xs text-primary-foreground/60 mt-0.5">
              {hijri.day} {HIJRI_MONTHS_TR[hijri.month.en] || hijri.month.en} {hijri.year}
            </p>
          </div>
        )}
      </div>

      {/* Main prayer cards carousel */}
      <div className="px-0 -mt-12 overflow-x-auto flex snap-x snap-mandatory hide-scrollbar gap-4 pb-4">
        {weekly.length > 0 ? weekly.map((day, idx) => {
          const isToday = idx === 0;
          const dayParts = day.date.split(" ");
          const dayNum = dayParts[0];
          const monthEn = dayParts[1];
          const monthTr = GREGORIAN_MONTHS_TR[monthEn] || monthEn;
          const dayTitle = isToday ? "Bugün" : `${dayNum} ${monthTr}`;
          const hijriMonthTr = HIJRI_MONTHS_TR[day.hijri.month.en] || day.hijri.month.en;
          
          return (
            <div 
              key={day.date} 
              className="min-w-[85%] first:ml-4 last:mr-4 snap-center rounded-xl border border-primary/10 bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">{isToday ? "today" : "calendar_today"}</span>
                    {dayTitle} — {day.hijri.day} {hijriMonthTr}
                  </p>
                  <h2 className="mt-1 text-4xl font-extrabold text-foreground">
                    {isToday ? current : PRAYER_LABELS[Object.keys(day.times).find(key => {
                      const now = new Date();
                      const t = (day.times as any)[key];
                      const [h, m] = t.match(/(\d{1,2}):(\d{1,2})/)?.slice(1).map(Number) || [0, 0];
                      const pTime = new Date(now);
                      pTime.setHours(h, m, 0, 0);
                      return now < pTime;
                    }) || "Fajr"]}
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="material-symbols-outlined text-primary text-[28px]">
                    {isToday ? "wb_sunny" : "auto_awesome"}
                  </span>
                </div>
              </div>

              {isToday ? (
                <>
                  <div className="mt-6 flex flex-col items-center justify-center py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2">
                      {next} VAKTİNE KALAN SÜRE
                    </p>
                    <div className="font-mono text-5xl font-black tabular-nums tracking-tighter text-primary">
                      {remaining}
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary/10">
                    <div
                      className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(6,76,57,0.3)] transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="mt-6 py-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground italic">
                    Gelecek günün vakitlerini aşağıda görebilirsiniz.
                  </p>
                </div>
              )}

              {/* Day's prayer grid */}
              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  { key: "Fajr", label: "İmsak", time: day.times.Fajr },
                  { key: "Sunrise", label: "Güneş", time: day.times.Sunrise },
                  { key: "Dhuhr", label: "Öğle", time: day.times.Dhuhr },
                  { key: "Asr", label: "İkindi", time: day.times.Asr },
                  { key: "Maghrib", label: "Akşam", time: day.times.Maghrib },
                  { key: "Isha", label: "Yatsı", time: day.times.Isha },
                ].map((p) => {
                  const isActive = isToday && p.label === current;
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
                      <p className="text-[10px] text-muted-foreground">{p.label}</p>
                      <p className="text-sm font-bold">{p.time}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }) : (
           <div className="mx-4 rounded-xl border border-primary/10 bg-card p-5 animate-pulse h-48 flex items-center justify-center">
             <span className="text-primary/50">Vakitler yükleniyor...</span>
           </div>
        )}
      </div>

      {/* Tevekkül Vakti */}
      <TevekkulVakti />

      {/* Bunu Biliyor Muydun? Karti */}
      <div className="px-4">
        <DailyFactCard />
      </div>

      {/* Duygu Durumu Keşfi */}
      <MoodDiscovery />

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
              <button
                onClick={() => ayet && shareContent("ayet", ayet.arabic_text, ayet.turkish_text, ayet.source || undefined)}
                className="p-1 text-muted-foreground hover:text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>
              <button
                onClick={() => ayet ? toggleFavorite(ayet.id, "ayet") : null}
                className="p-1 text-muted-foreground hover:text-primary"
              >
                <span
                  className={cn("material-symbols-outlined text-[20px]", ayet && isFavorite(ayet.id) && "text-destructive")}
                  style={ayet && isFavorite(ayet.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                >favorite</span>
              </button>
            </div>
          </div>
          {ayet?.contributor_name && (
            <div className="mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span className="text-[10px] text-muted-foreground italic">{ayet.contributor_name} katkısıyla</span>
            </div>
          )}
        </div>
      </div>

      {/* Günün Hadisi */}
      <div className="mt-4 px-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent">Günün Hadisi</h3>
        <div className="rounded-xl border border-accent/20 bg-card p-4 shadow-sm">
          <div className="rounded-lg bg-accent/5 p-4">
            <p className="font-arabic text-xl leading-loose text-foreground" dir="rtl">
              {hadis?.arabic_text || "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"}
            </p>
          </div>
          <p className="mt-3 text-sm italic text-muted-foreground">
            "{hadis?.turkish_text || "Sizin en hayırlınız Kur'an'ı öğrenen ve öğretendir."}"
          </p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-accent/60">{hadis?.source || "Buhârî"}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => hadis && shareContent("hadis", hadis.arabic_text, hadis.turkish_text, hadis.source || undefined)}
                className="p-1 text-muted-foreground hover:text-accent"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>
              <button
                onClick={() => hadis ? toggleFavorite(hadis.id, "hadis") : null}
                className="p-1 text-muted-foreground hover:text-accent"
              >
                <span
                  className={cn("material-symbols-outlined text-[20px]", hadis && isFavorite(hadis.id) && "text-destructive")}
                  style={hadis && isFavorite(hadis.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                >favorite</span>
              </button>
            </div>
          </div>
          {hadis?.contributor_name && (
            <div className="mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span className="text-[10px] text-muted-foreground italic">{hadis.contributor_name} katkısıyla</span>
            </div>
          )}
        </div>
      </div>

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
