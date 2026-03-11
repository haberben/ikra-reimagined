import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";
import {
  requestNotificationPermission,
  getNotificationPermission,
  schedulePrayerNotifications,
  scheduleDailyContentNotification,
  cancelScheduledNotification,
} from "@/lib/notifications";
import { useDailyContent } from "@/hooks/useDailyContent";

const PRAYERS = [
  { key: "Fajr", name: "Sabah", icon: "dark_mode" },
  { key: "Dhuhr", name: "Öğle", icon: "wb_sunny" },
  { key: "Asr", name: "İkindi", icon: "wb_twilight" },
  { key: "Maghrib", name: "Akşam", icon: "nights_stay" },
  { key: "Isha", name: "Yatsı", icon: "bedtime" },
];

const OFFSET_OPTIONS = [0, 5, 10, 15, 20, 30];

interface AdminNotification {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

function loadJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}

export default function NotificationsPage({ onBack }: { onBack: () => void }) {
  const [prayerToggles, setPrayerToggles] = useState<Record<string, boolean>>(() => loadJson("ikra_notif_toggles", {}));
  const [prayerOffsets, setPrayerOffsets] = useState<Record<string, number>>(() => loadJson("ikra_notif_offsets", {}));
  const [dailyToggles, setDailyToggles] = useState<Record<string, boolean>>(() => loadJson("ikra_daily_notif_toggles", {}));
  const [ayetTime, setAyetTime] = useState(() => localStorage.getItem("ikra_ayet_time") || "07:00");
  const [hadisTime, setHadisTime] = useState(() => localStorage.getItem("ikra_hadis_time") || "08:00");

  const [adminNotifs, setAdminNotifs] = useState<AdminNotification[]>([]);
  const [expandedNotif, setExpandedNotif] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>(getNotificationPermission());
  const [scheduledTimers, setScheduledTimers] = useState<number[]>([]);

  const { ayet: dailyAyet, hadis: dailyHadis } = useDailyContent();

  // Persist all preferences
  useEffect(() => { localStorage.setItem("ikra_notif_toggles", JSON.stringify(prayerToggles)); }, [prayerToggles]);
  useEffect(() => { localStorage.setItem("ikra_notif_offsets", JSON.stringify(prayerOffsets)); }, [prayerOffsets]);
  useEffect(() => { localStorage.setItem("ikra_daily_notif_toggles", JSON.stringify(dailyToggles)); }, [dailyToggles]);
  useEffect(() => { localStorage.setItem("ikra_ayet_time", ayetTime); }, [ayetTime]);
  useEffect(() => { localStorage.setItem("ikra_hadis_time", hadisTime); }, [hadisTime]);

  useEffect(() => { fetchAdminNotifs(); }, []);

  // Schedule prayer notifications
  useEffect(() => {
    scheduledTimers.forEach(cancelScheduledNotification);
    const city = localStorage.getItem("ikra_city") || "İstanbul";
    fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=TR&method=13`)
      .then(r => r.json())
      .then(data => {
        if (data.code === 200) {
          const timers = schedulePrayerNotifications(data.data.timings, prayerToggles, prayerOffsets);
          setScheduledTimers(timers);
        }
      })
      .catch(console.error);
  }, [prayerToggles, prayerOffsets]);

  // Schedule daily content notifications with rich content
  useEffect(() => {
    if (dailyToggles.ayet) {
      const [h, m] = ayetTime.split(":").map(Number);
      const content = dailyAyet
        ? `${dailyAyet.arabic_text}\n${dailyAyet.turkish_text}${dailyAyet.source ? ` (${dailyAyet.source})` : ""}`
        : undefined;
      scheduleDailyContentNotification("ayet", h, m, content);
    }
    if (dailyToggles.hadis) {
      const [h, m] = hadisTime.split(":").map(Number);
      const content = dailyHadis
        ? `${dailyHadis.turkish_text}${dailyHadis.source ? ` — ${dailyHadis.source}` : ""}`
        : undefined;
      scheduleDailyContentNotification("hadis", h, m, content);
    }
  }, [dailyToggles, ayetTime, hadisTime, dailyAyet, dailyHadis]);

  const fetchAdminNotifs = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setAdminNotifs(data as AdminNotification[]);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(granted ? "granted" : "denied");
  };

  const toggleWithPermission = (
    current: Record<string, boolean>,
    setter: (v: Record<string, boolean>) => void,
    key: string
  ) => {
    const newVal = !current[key];
    if (newVal && permissionStatus !== "granted") {
      handleRequestPermission().then(() => setter({ ...current, [key]: true }));
    } else {
      setter({ ...current, [key]: newVal });
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="pb-20">
      <StickyHeader
        title="Bildirimler"
        leftIcon="arrow_back"
        onLeftClick={onBack}
        rightIcon="settings"
        showNotificationDot={false}
      />

      <div className="px-4 pt-4">
        {/* Permission banner */}
        {permissionStatus === "denied" && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-xs text-destructive">
              Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.
            </p>
          </div>
        )}
        {permissionStatus === "default" && (
          <button
            onClick={handleRequestPermission}
            className="mb-4 w-full rounded-xl bg-primary/5 border border-primary/10 p-3 text-sm font-medium text-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            Bildirimlere İzin Ver
          </button>
        )}

        {/* Namaz Hatırlatıcıları */}
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
          Namaz Hatırlatıcıları
        </h3>
        <div className="space-y-2">
          {PRAYERS.map((p) => (
            <div key={p.key} className="rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">{p.icon}</span>
                  <span className="font-medium">{p.name}</span>
                </div>
                <button
                  onClick={() => toggleWithPermission(prayerToggles, setPrayerToggles, p.key)}
                  className={cn(
                    "h-[31px] w-[51px] rounded-full transition-colors",
                    prayerToggles[p.key] ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                    prayerToggles[p.key] ? "translate-x-[22px]" : "translate-x-[2px]"
                  )} />
                </button>
              </div>

              {prayerToggles[p.key] && (
                <div className="mt-3 flex items-center gap-2 pl-9">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Kaç dk önce:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {OFFSET_OPTIONS.map((min) => (
                      <button
                        key={min}
                        onClick={() => setPrayerOffsets({ ...prayerOffsets, [p.key]: min })}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                          (prayerOffsets[p.key] ?? 0) === min
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {min === 0 ? "Vakitte" : `${min}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Günlük İçerik Bildirimleri */}
        <h3 className="mt-6 mb-3 text-sm font-bold uppercase tracking-wider text-primary">
          Günlük İçerik Bildirimleri
        </h3>
        <div className="space-y-2">
          {/* Ayet */}
          <div className="rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">auto_stories</span>
                <div>
                  <span className="font-medium">Günün Ayeti</span>
                  <p className="text-[10px] text-muted-foreground">Bildirimde ayet metni ve meali gösterilir</p>
                </div>
              </div>
              <button
                onClick={() => toggleWithPermission(dailyToggles, setDailyToggles, "ayet")}
                className={cn(
                  "h-[31px] w-[51px] rounded-full transition-colors",
                  dailyToggles.ayet ? "bg-primary" : "bg-muted"
                )}
              >
                <div className={cn(
                  "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                  dailyToggles.ayet ? "translate-x-[22px]" : "translate-x-[2px]"
                )} />
              </button>
            </div>
            {dailyToggles.ayet && (
              <div className="mt-3 flex items-center gap-2 pl-9">
                <span className="text-xs text-muted-foreground">Bildirim saati:</span>
                <input
                  type="time"
                  value={ayetTime}
                  onChange={(e) => setAyetTime(e.target.value)}
                  className="rounded-lg border border-primary/10 bg-secondary px-2 py-1 text-xs text-foreground"
                />
              </div>
            )}
          </div>

          {/* Hadis */}
          <div className="rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">menu_book</span>
                <div>
                  <span className="font-medium">Günün Hadisi</span>
                  <p className="text-[10px] text-muted-foreground">Bildirimde hadis metni gösterilir</p>
                </div>
              </div>
              <button
                onClick={() => toggleWithPermission(dailyToggles, setDailyToggles, "hadis")}
                className={cn(
                  "h-[31px] w-[51px] rounded-full transition-colors",
                  dailyToggles.hadis ? "bg-primary" : "bg-muted"
                )}
              >
                <div className={cn(
                  "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                  dailyToggles.hadis ? "translate-x-[22px]" : "translate-x-[2px]"
                )} />
              </button>
            </div>
            {dailyToggles.hadis && (
              <div className="mt-3 flex items-center gap-2 pl-9">
                <span className="text-xs text-muted-foreground">Bildirim saati:</span>
                <input
                  type="time"
                  value={hadisTime}
                  onChange={(e) => setHadisTime(e.target.value)}
                  className="rounded-lg border border-primary/10 bg-secondary px-2 py-1 text-xs text-foreground"
                />
              </div>
            )}
          </div>
        </div>

        {/* Admin Notifications */}
        {adminNotifs.length > 0 && (
          <div className="mt-6">
            <div className="islamic-pattern rounded-t-xl bg-primary px-4 py-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary-foreground">
                Bildirimler
              </h3>
            </div>
            <div className="space-y-2 mt-2">
              {adminNotifs.map((n) => (
                <div key={n.id} className="rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
                  <button
                    onClick={() => setExpandedNotif(expandedNotif === n.id ? null : n.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold">{n.title}</h4>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <p className={cn("mt-1 text-sm text-muted-foreground", expandedNotif !== n.id && "line-clamp-2")}>
                      {n.body}
                    </p>
                  </button>

                  {expandedNotif === n.id && (
                    <div className="mt-3 space-y-3">
                      {n.image_url && (
                        <img src={n.image_url} alt="" className="w-full rounded-lg object-cover max-h-60" />
                      )}
                      {n.video_url && (
                        <div className="rounded-lg overflow-hidden border border-primary/10">
                          {n.video_url.includes("youtube") || n.video_url.includes("youtu.be") ? (
                            <div className="aspect-video">
                              <iframe
                                src={n.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                                className="h-full w-full"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <a href={n.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 text-sm text-primary">
                              <span className="material-symbols-outlined text-[18px]">play_circle</span>
                              Videoyu İzle
                            </a>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => handleCopy(
                          `${n.title}\n\n${n.body}${n.image_url ? `\n\n${n.image_url}` : ""}${n.video_url ? `\n\n${n.video_url}` : ""}`,
                          n.id
                        )}
                        className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copied === n.id ? "check" : "content_copy"}
                        </span>
                        {copied === n.id ? "Kopyalandı!" : "Kopyala"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
