import { useState } from "react";
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

export default function NotificationsPage({ onBack }: { onBack: () => void }) {
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});
  const [notifTimes, setNotifTimes] = useState<Record<string, string>>({});

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
                    className="rounded-lg bg-secondary px-2 py-1 text-xs"
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

        {/* Günün Mesajları */}
        <div className="mt-6">
          <div className="islamic-pattern rounded-t-xl bg-primary px-4 py-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary-foreground">
              Günün Mesajları
            </h3>
          </div>

          <div className="rounded-b-xl border border-t-0 border-primary/10 bg-card p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-bold uppercase text-primary">Günün Ayeti</h4>
            <p className="font-arabic text-2xl leading-loose" dir="rtl">
              فَإِنَّ مَعَ الْعُسْرِ يُسْرًا
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">
              "Muhakkak ki zorlukla beraber bir kolaylık vardır."
            </p>
            <p className="mt-1 text-xs text-primary/60">İnşirah Suresi, 5</p>
            <button className="mt-2 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              Paylaş
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
            <h4 className="mb-2 text-xs font-bold uppercase text-primary">Hadis-i Şerif</h4>
            <p className="font-arabic text-xl leading-loose" dir="rtl">
              مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">
              "Kim ilim öğrenmek için bir yola girerse, Allah ona cennetin yolunu kolaylaştırır."
            </p>
            <p className="mt-1 text-xs text-primary/60">Müslim, Zikir, 38</p>
            <button className="mt-2 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              Paylaş
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
