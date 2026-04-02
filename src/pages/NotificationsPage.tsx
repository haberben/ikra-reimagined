import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";
import {
  requestNotificationPermission,
  getNotificationPermission,
  schedulePrayerNotifications,
  scheduleDailyContentNotification,
  getNotifSoundPref,
  setNotifSoundPref,
  managePersistentNotification,
  scheduleTevekkulNotification,
  managePersistentZikirNotification,
  type NotifSound,
} from "@/lib/notifications";

const PRAYERS = [
  { key: "Fajr", name: "Sabah", icon: "dark_mode" },
  { key: "Dhuhr", name: "Öğle", icon: "wb_sunny" },
  { key: "Asr", name: "İkindi", icon: "wb_twilight" },
  { key: "Maghrib", name: "Akşam", icon: "nights_stay" },
  { key: "Isha", name: "Yatsı", icon: "bedtime" },
];

const TIME_OPTIONS = ["Vakitte", "5 dk önce", "10 dk önce", "15 dk önce", "30 dk önce"];

const SOUND_OPTIONS: { value: NotifSound; label: string; icon: string }[] = [
  { value: "default", label: "Varsayılan", icon: "notifications_active" },
  { value: "ezan", label: "Ezan Sesi", icon: "mosque" },
  { value: "silent", label: "Sessiz", icon: "notifications_off" },
];

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
  const [dailyNotifs, setDailyNotifs] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_daily_notif_toggles") || "{}"); } catch { return {}; }
  });
  const [selectedSound, setSelectedSound] = useState<NotifSound>(getNotifSoundPref());
  const [adminNotifs, setAdminNotifs] = useState<Notification[]>([]);
  const [closedNotifIds, setClosedNotifIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_closed_notifs") || "[]"); } catch { return []; }
  });
  const [expandedNotif, setExpandedNotif] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>(getNotificationPermission());
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [showAdminTools, setShowAdminTools] = useState(localStorage.getItem("ikra_admin") === "true");
  const [adminLoading, setAdminLoading] = useState(false);
  
  const [persistentEnabled, setPersistentEnabled] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_persistent_notif") || "false"); } catch { return false; }
  });

  const [persistentZikirEnabled, setPersistentZikirEnabled] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_persistent_zikir") || "false"); } catch { return false; }
  });

  const [autoLocationEnabled, setAutoLocationEnabled] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_auto_location") || "false"); } catch { return false; }
  });

  const [pinDailyEnabled, setPinDailyEnabled] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_pin_daily") || "false"); } catch { return false; }
  });

  useEffect(() => {
    fetchAdminNotifs();
  }, []);

  // Persist and schedule prayer notifications when toggles change
  useEffect(() => {
    const prevTogglesStr = localStorage.getItem("ikra_notif_toggles");
    const prevTimesStr = localStorage.getItem("ikra_notif_times");
    const currentTogglesStr = JSON.stringify(notifications);
    const currentTimesStr = JSON.stringify(notifTimes);

    // Only proceed if things changed from what's in storage
    if (prevTogglesStr === currentTogglesStr && prevTimesStr === currentTimesStr) {
      return;
    }

    localStorage.setItem("ikra_notif_toggles", currentTogglesStr);
    localStorage.setItem("ikra_notif_times", currentTimesStr);

    const hasAnyEnabled = Object.values(notifications).some(Boolean);
    if (!hasAnyEnabled) return;

    const city = localStorage.getItem("ikra_city") || "İstanbul";
    fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=TR&method=13`)
      .then(r => r.json())
      .then(async (data) => {
        if (data.code === 200) {
          await schedulePrayerNotifications(data.data.timings, notifications, notifTimes);
        }
      })
      .catch(console.error);
  }, [notifications, notifTimes]);

  // Schedule daily content notifications
  useEffect(() => {
    localStorage.setItem("ikra_daily_notif_toggles", JSON.stringify(dailyNotifs));
    if (dailyNotifs.ayet) {
      scheduleDailyContentNotification('ayet', 7, 0);
    }
    if (dailyNotifs.hadis) {
      scheduleDailyContentNotification('hadis', 8, 0);
    }
    if (dailyNotifs.tevekkul) {
      scheduleTevekkulNotification(16, 0); // 16:00
    }
  }, [dailyNotifs]);

  // Manage persistent notification when toggle or times change
  useEffect(() => {
    const prevPersistentStr = localStorage.getItem("ikra_persistent_notif_prev");
    const currentPersistentStr = JSON.stringify(persistentEnabled);

    if (prevPersistentStr === currentPersistentStr) {
      return;
    }

    localStorage.setItem("ikra_persistent_notif", currentPersistentStr);
    localStorage.setItem("ikra_persistent_notif_prev", currentPersistentStr);

    const city = localStorage.getItem("ikra_city") || "İstanbul";

    if (persistentEnabled) {
      fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=TR&method=13`)
        .then(r => r.json())
        .then(data => {
          if (data.code === 200) {
            managePersistentNotification(true, data.data.timings);
          }
        })
        .catch(console.error);
    } else {
      managePersistentNotification(false, null);
    }
  }, [persistentEnabled]);

  const fetchAdminNotifs = async () => {
    // Only fetch notifications created within the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .gte("created_at", oneDayAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(50);
      
    if (data) {
      // Filter out notifications the user has locally closed
      const visibleData = data.filter(n => !closedNotifIds.includes(n.id));
      setAdminNotifs(visibleData as Notification[]);
    }
  };

  const handleCloseNotif = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newClosed = [...closedNotifIds, id];
    setClosedNotifIds(newClosed);
    localStorage.setItem("ikra_closed_notifs", JSON.stringify(newClosed));
    setAdminNotifs(prev => prev.filter(n => n.id !== id));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
  };

  const handleToggleNotif = async (key: string) => {
    const newVal = !notifications[key];
    if (newVal && permissionStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      if (!granted) return;
    }
    setNotifications({ ...notifications, [key]: newVal });
  };

  const handleToggleDailyNotif = async (key: string) => {
    const newVal = !dailyNotifs[key];
    if (newVal && permissionStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      if (!granted) return;
    }
    setDailyNotifs({ ...dailyNotifs, [key]: newVal });
  };

  const handleTogglePersistent = async () => {
    const newVal = !persistentEnabled;
    if (newVal && permissionStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      if (!granted) return;
    }
    setPersistentEnabled(newVal);
  };

  const handleToggleAutoLocation = () => {
    const newVal = !autoLocationEnabled;
    setAutoLocationEnabled(newVal);
    localStorage.setItem("ikra_auto_location", JSON.stringify(newVal));
  };

  const handleTogglePinDaily = () => {
    const newVal = !pinDailyEnabled;
    setPinDailyEnabled(newVal);
    localStorage.setItem("ikra_pin_daily", JSON.stringify(newVal));
  };

  const handleTogglePersistentZikir = async () => {
    const newVal = !persistentZikirEnabled;
    if (newVal && permissionStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      if (!granted) return;
    }
    
    setPersistentZikirEnabled(newVal);
    localStorage.setItem("ikra_persistent_zikir", JSON.stringify(newVal));
    
    if (newVal) {
      const totalCount = parseInt(localStorage.getItem("ikra_zikir_total") || "0", 10);
      managePersistentZikirNotification(true, null, totalCount, "Genel Zikir");
    } else {
      managePersistentZikirNotification(false);
    }
  };

  const handleAdminResetHatim = async () => {
    if (!confirm("DİKKAT: Mevcut Global Hatim'i sıfırlamak istediğinize emin misiniz? Tüm cüzler boşaltılacak.")) return;
    setAdminLoading(true);
    const { data: groups } = await supabase.from("hatim_groups")
      .select("id").eq("is_public", true).is("completed_at", null).limit(1);
    
    if (groups && groups[0]) {
      await supabase.from("hatim_juz").update({
        claimed_by: null, claimed_by_name: null, claimed_at: null, completed_at: null
      }).eq("group_id", groups[0].id);
      alert("Hatim sıfırlandı.");
    }
    setAdminLoading(false);
  };

  const handleAdminArchiveHatim = async () => {
    if (!confirm("DİKKAT: Mevcut Global Hatim'i bitirip arşive almak istediğinize emin misiniz?")) return;
    setAdminLoading(true);
    const { data: groups } = await supabase.from("hatim_groups")
      .select("id").eq("is_public", true).is("completed_at", null).limit(1);
    
    if (groups && groups[0]) {
      await supabase.from("hatim_groups").update({
        completed_at: new Date().toISOString()
      }).eq("id", groups[0].id);
      alert("Hatim arşive alındı. Yeni hatim otomatik oluşturulacak.");
    }
    setAdminLoading(false);
  };

  const handleVersionTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    if (newCount === 3) {
      const isNowAdmin = !showAdminTools;
      setShowAdminTools(isNowAdmin);
      localStorage.setItem("ikra_admin", isNowAdmin ? "true" : "false");
      setAdminTapCount(0);
      alert(isNowAdmin ? "🔑 Yönetici Modu Açıldı!" : "Yönetici Modu Kapatıldı.");
    }
  };


  const handleSoundChange = (sound: NotifSound) => {
    setSelectedSound(sound);
    setNotifSoundPref(sound);
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
        {permissionStatus === 'denied' && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-xs text-destructive">
              Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.
            </p>
          </div>
        )}
        {permissionStatus === 'default' && (
          <button
            onClick={handleRequestPermission}
            className="mb-4 w-full rounded-xl bg-primary/5 border border-primary/10 p-3 text-sm font-medium text-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            Bildirimlere İzin Ver
          </button>
        )}

        {/* Bildirim Sesi Seçimi */}
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
          Bildirim Sesi
        </h3>
        <div className="flex gap-2 mb-6">
          {SOUND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSoundChange(opt.value)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all",
                selectedSound === opt.value
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-primary/10 bg-card text-muted-foreground"
              )}
            >
              <span className="material-symbols-outlined text-[22px]">{opt.icon}</span>
              <span className="text-[11px] font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>

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
                  onClick={() => handleToggleNotif(p.key)}
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

        {/* Kalıcı Vakit Bildirimi (Android) */}
        <h3 className="mt-6 mb-3 text-sm font-bold uppercase tracking-wider text-primary">
          Android Kilit/Bildirim Ekranı
        </h3>
        <div className="space-y-2 mb-2">
          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">push_pin</span>
              <div>
                <span className="font-medium">Vakitleri Kalıcı Göster</span>
                <p className="text-[10px] text-muted-foreground mr-2">Bildirim çubuğunda sıradaki vakti ve kalan süreyi gösterir.</p>
              </div>
            </div>
            <button
              onClick={handleTogglePersistent}
              className={cn(
                "h-[31px] w-[51px] rounded-full transition-colors flex-shrink-0",
                persistentEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                persistentEnabled ? "translate-x-[22px]" : "translate-x-[2px]"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">book</span>
              <div>
                <span className="font-medium">Günün Ayetini/Hadisini Sabitle</span>
                <p className="text-[10px] text-muted-foreground mr-2">Vakit bildiriminin içinde günün içeriğini de gösterir.</p>
              </div>
            </div>
            <button
              onClick={handleTogglePinDaily}
              className={cn(
                "h-[31px] w-[51px] rounded-full transition-colors flex-shrink-0",
                pinDailyEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                pinDailyEnabled ? "translate-x-[22px]" : "translate-x-[2px]"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">touch_app</span>
              <div>
                <span className="font-medium">Kilit Ekranı Zikirmatik</span>
                <p className="text-[10px] text-muted-foreground mr-2">Bildirim çubuğunda "+1 Okudum" butonu ile zikir çekmenizi sağlar.</p>
              </div>
            </div>
            <button
              onClick={handleTogglePersistentZikir}
              className={cn(
                "h-[31px] w-[51px] rounded-full transition-colors flex-shrink-0",
                persistentZikirEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                persistentZikirEnabled ? "translate-x-[22px]" : "translate-x-[2px]"
              )} />
            </button>
          </div>
        </div>

        {/* Konum Ayarları */}
        <h3 className="mt-6 mb-3 text-sm font-bold uppercase tracking-wider text-primary">
          Konum Ayarları
        </h3>
        <div className="space-y-2 mb-2">
          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <div>
                <span className="font-medium">Otomatik Konum Algılama</span>
                <p className="text-[10px] text-muted-foreground mr-2">Şehir değiştiğinde vakitleri otomatik olarak günceller.</p>
              </div>
            </div>
            <button
              onClick={handleToggleAutoLocation}
              className={cn(
                "h-[31px] w-[51px] rounded-full transition-colors flex-shrink-0",
                autoLocationEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                autoLocationEnabled ? "translate-x-[22px]" : "translate-x-[2px]"
              )} />
            </button>
          </div>
        </div>

        {/* Günlük İçerik Bildirimleri */}
        <h3 className="mt-6 mb-3 text-sm font-bold uppercase tracking-wider text-primary">
          Günlük İçerik Bildirimleri
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">auto_stories</span>
              <div>
                <span className="font-medium">Günün Ayeti</span>
                <p className="text-[10px] text-muted-foreground">Her gün 07:00'da bildirim</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleDailyNotif("ayet")}
              className={cn(
                "h-[31px] w-[51px] rounded-full transition-colors",
                dailyNotifs.ayet ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                dailyNotifs.ayet ? "translate-x-[22px]" : "translate-x-[2px]"
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">sparkles</span>
              <div>
                <span className="font-medium">Tevekkül Vakti</span>
                <p className="text-[10px] text-muted-foreground">Her gün 16:00'da (İkindi vakti)</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleDailyNotif("tevekkul")}
              className={cn(
                "h-[31px] w-[51px] rounded-full transition-colors",
                dailyNotifs.tevekkul ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                dailyNotifs.tevekkul ? "translate-x-[22px]" : "translate-x-[2px]"
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">menu_book</span>
              <div>
                <span className="font-medium">Günün Hadisi</span>
                <p className="text-[10px] text-muted-foreground">Her gün 08:00'da bildirim</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleDailyNotif("hadis")}
              className={cn(
                "h-[31px] w-[51px] rounded-full transition-colors",
                dailyNotifs.hadis ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "h-[27px] w-[27px] rounded-full bg-card shadow transition-transform",
                dailyNotifs.hadis ? "translate-x-[22px]" : "translate-x-[2px]"
              )} />
            </button>
          </div>
        </div>

        {/* Admin Notifications */}
        {adminNotifs.length > 0 && (
          <div className="mt-6 mb-6">
            <div className="islamic-pattern rounded-t-xl bg-primary px-4 py-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary-foreground">
                Duyurular
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
                    className="w-full text-left relative pr-8"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold pr-2">{n.title}</h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(n.created_at).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <p className={cn("mt-1 text-sm text-muted-foreground", expandedNotif !== n.id && "line-clamp-2")}>
                      {n.body}
                    </p>
                    <button 
                      onClick={(e) => handleCloseNotif(e, n.id)}
                      className="absolute top-0 right-0 p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                      title="Bildirimi Gizle"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
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

        {/* Admin Secret Tools */}
        {showAdminTools && (
          <div className="mt-2 mb-8 animate-in fade-in slide-in-from-bottom-4">
             <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent italic">
              ⭐ Yönetici Araçları
            </h3>
            <div className="rounded-xl bg-accent/5 border border-accent/20 p-4 space-y-4">
              <div className="flex gap-2">
                <button
                  disabled={adminLoading}
                  onClick={handleAdminResetHatim}
                  className="flex-1 rounded-xl bg-destructive px-3 py-3 text-xs font-bold uppercase text-white shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {adminLoading ? "Yükleniyor..." : "Global Hatimi Sıfırla"}
                </button>
                <button
                  disabled={adminLoading}
                  onClick={handleAdminArchiveHatim}
                  className="flex-1 rounded-xl bg-accent px-3 py-3 text-xs font-bold uppercase text-foreground shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {adminLoading ? "Yükleniyor..." : "Hatimi Bitir / Arşivle"}
                </button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground italic">
                Bu araçlar tüm kullanıcılar için Global Hatim tablosunu etkiler.
              </p>
            </div>
          </div>
        )}

        {/* Footer Version */}
        <div className="mt-8 mb-12 text-center" onClick={handleVersionTap}>
          <p className="text-[10px] text-muted-foreground opacity-50 select-none">
            İKRA v1.4.3 | Antigravity AI Engine
          </p>
        </div>
      </div>
    </div>
  );
}
