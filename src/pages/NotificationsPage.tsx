import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";

const PRAYERS = [
  { key: "Fajr", name: "Sabah", icon: "dark_mode" },
  { key: "Dhuhr", name: "Öğle", icon: "wb_sunny" },
  { key: "Asr", name: "İkindi", icon: "wb_twilight" },
  { key: "Maghrib", name: "Akşam", icon: "nights_stay" },
  { key: "Isha", name: "Yatsı", icon: "bedtime" },
];

const TIME_OPTIONS = ["Vakitte", "5 dk önce", "10 dk önce", "15 dk önce", "30 dk önce"];

interface Notification {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

export default function NotificationsPage({ onBack }: { onBack: () => void }) {
  const [notifications, setNotifications] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_notif_toggles") || "{}"); } catch { return {}; }
  });
  const [notifTimes, setNotifTimes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_notif_times") || "{}"); } catch { return {}; }
  });
  const [adminNotifs, setAdminNotifs] = useState<Notification[]>([]);
  const [expandedNotif, setExpandedNotif] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminNotifs();
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("ikra_notif_toggles", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("ikra_notif_times", JSON.stringify(notifTimes));
  }, [notifTimes]);

  const fetchAdminNotifs = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setAdminNotifs(data as Notification[]);
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
        {/* Namaz Hatırlatıcıları */}
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
          Namaz Hatırlatıcıları
        </h3>
        <div className="space-y-2">
          {PRAYERS.map((p) => (
            <div key={p.key} className="flex items-center justify-between rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">{p.icon}</span>
                <span className="font-medium">{p.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {notifications[p.key] && (
                  <select
                    value={notifTimes[p.key] || "Vakitte"}
                    onChange={(e) => setNotifTimes({ ...notifTimes, [p.key]: e.target.value })}
                    className="rounded-lg bg-secondary px-2 py-1 text-xs text-foreground"
                  >
                    {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
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
          ))}
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
                <div
                  key={n.id}
                  className="rounded-xl border border-primary/10 bg-card p-4 shadow-sm"
                >
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

                      {/* Copy button */}
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
