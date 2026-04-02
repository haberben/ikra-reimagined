import { useState, useCallback, useEffect } from "react";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { logZikir, getLast7DaysData, getZikirLogs, getPinnedZikir, setPinnedZikir } from "@/lib/zikir";
import { managePersistentZikirNotification } from "@/lib/notifications";

const DHIKR_PRESETS = [
  { name: "Sübhanallah", arabic: "سُبْحَانَ اللَّهِ", target: 33 },
  { name: "Elhamdülillah", arabic: "الْحَمْدُ لِلَّهِ", target: 33 },
  { name: "Allahu Ekber", arabic: "اللَّهُ أَكْبَرُ", target: 33 },
  { name: "Lâ ilâhe illallah", arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ", target: 100 },
  { name: "Estağfirullah", arabic: "أَسْتَغْفِرُ اللَّهَ", target: 100 },
  { name: "Salavat", arabic: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ", target: 100 },
];

export default function ZikirmatikPage({ onBack }: { onBack: () => void }) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [count, setCount] = useState(0);
  const [customTarget, setCustomTarget] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"counter" | "stats">("counter");
  const [totalCount, setTotalCount] = useState(() => {
    return parseInt(localStorage.getItem("ikra_zikir_total") || "0", 10);
  });
  const [pinnedZikir, setPinnedZikirState] = useState(getPinnedZikir());

  const preset = DHIKR_PRESETS[selectedPreset];
  const target = customTarget ?? preset.target;
  const progress = Math.min((count / target) * 100, 100);
  const completed = count >= target;

  useEffect(() => {
    localStorage.setItem("ikra_zikir_total", String(totalCount));
  }, [totalCount]);

  const handleTap = useCallback(() => {
    if (completed) return;

    setCount((c) => c + 1);
    setTotalCount((t) => t + 1);
    
    // Log the zikir for analytics
    logZikir(preset.name, 1);

    // If this is the pinned zikir, update the lock-screen notification immediately
    if (pinnedZikir.name === preset.name) {
      const zikirEnabled = localStorage.getItem("ikra_persistent_zikir") === "true";
      if (zikirEnabled) {
        // Need to calculate current count for this specific zikir today
        const logs = getZikirLogs();
        const today = new Date().toISOString().split('T')[0];
        const currentCount = (logs[today] && logs[today][preset.name]) || 0;
        managePersistentZikirNotification(true, pinnedZikir.target, currentCount, preset.name);
      }
    }

    // Haptic feedback logic
    const triggerHaptics = async () => {
      if (!vibrationEnabled) return;
      
      try {
        if (count + 1 >= target) {
          // Vibrate on completion (heavy success pattern)
          await Haptics.impact({ style: ImpactStyle.Heavy });
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 150);
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 300);
        } else if ((count + 1) % 33 === 0) {
          // Vibrate longer at milestones
          await Haptics.impact({ style: ImpactStyle.Medium });
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 150);
        } else {
          // Light tick for every count
          await Haptics.impact({ style: ImpactStyle.Light });
        }
      } catch (e) {
        // Fallback for browsers if Haptics plugin fails
        if (navigator.vibrate) {
          if (count + 1 >= target) navigator.vibrate([100, 50, 100, 50, 100]);
          else if ((count + 1) % 33 === 0) navigator.vibrate([50, 30, 50]);
          else navigator.vibrate(20);
        }
      }
    };

    triggerHaptics();
  }, [count, target, completed, vibrationEnabled, preset.name, pinnedZikir.name, pinnedZikir.target]);

  const handleReset = () => {
    setCount(0);
  };

  const handleNextDhikr = () => {
    setCount(0);
    setCustomTarget(null);
    setSelectedPreset((p) => (p + 1) % DHIKR_PRESETS.length);
  };

  const handlePin = (e: React.MouseEvent, p: typeof preset) => {
    e.stopPropagation();
    const targetVal = customTarget ?? p.target;
    setPinnedZikir(p.name, targetVal);
    setPinnedZikirState({ name: p.name, target: targetVal });
    
    // Update notification if enabled
    const zikirEnabled = localStorage.getItem("ikra_persistent_zikir") === "true";
    if (zikirEnabled) {
      const logs = getZikirLogs();
      const today = new Date().toISOString().split('T')[0];
      const currentCount = (logs[today] && logs[today][p.name]) || 0;
      managePersistentZikirNotification(true, targetVal, currentCount, p.name);
    }
  };

  const statsData = getLast7DaysData();
  const maxTotal = Math.max(...statsData.map(d => d.total), 1);
  const todayLogs = getZikirLogs()[new Date().toISOString().split('T')[0]] || {};

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <StickyHeader
        title="Zikirmatik"
        leftIcon="arrow_back"
        onLeftClick={onBack}
        rightIcon="settings"
        onRightClick={() => setShowSettings(true)}
        showNotificationDot={false}
      />


      <div className="flex flex-1 flex-col px-4 pt-4">
        {/* Tab switch */}
        <div className="mb-6 flex w-full rounded-2xl bg-secondary p-1">
          <button
            onClick={() => setActiveTab("counter")}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
              activeTab === "counter" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            Zikir Çek
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
              activeTab === "stats" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            İstatistikler
          </button>
        </div>

        {activeTab === "counter" ? (
          <div className="flex flex-col items-center">
            {/* Preset selector */}
            <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-hide pb-2 w-full">
              {DHIKR_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedPreset(i); setCount(0); setCustomTarget(null); }}
                  className={cn(
                    "shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors",
                    i === selectedPreset
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/5 border border-primary/10"
                  )}
                >
                  {p.name}
                  <button 
                    onClick={(e) => handlePin(e, p)}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full transition-colors",
                      pinnedZikir.name === p.name ? "bg-accent/20 text-accent" : "hover:bg-primary/20"
                    )}
                    title="Kilit Ekranına Sabitle"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {pinnedZikir.name === p.name ? "push_pin" : "push_pin_out"}
                    </span>
                  </button>
                </button>
              ))}
            </div>

            {/* Arabic text */}
            <p className="font-arabic text-3xl leading-relaxed text-primary mt-2" dir="rtl">
              {preset.arabic}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{preset.name}</p>

            {/* Counter circle */}
            <button
              onClick={handleTap}
              className={cn(
                "relative mt-8 flex h-56 w-56 items-center justify-center rounded-full border-4 transition-all active:scale-95",
                completed
                  ? "border-accent bg-accent/10"
                  : "border-primary/20 bg-primary/5 active:bg-primary/10"
              )}
            >
              {/* Progress ring */}
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 224 224">
                <circle
                  cx="112" cy="112" r="106"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeOpacity="0.1"
                  strokeWidth="4"
                />
                <circle
                  cx="112" cy="112" r="106"
                  fill="none"
                  stroke={completed ? "hsl(var(--accent))" : "hsl(var(--primary))"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 106}`}
                  strokeDashoffset={`${2 * Math.PI * 106 * (1 - progress / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>

              <div className="flex flex-col items-center z-10">
                <span className={cn(
                  "text-6xl font-extrabold",
                  completed ? "text-accent" : "text-primary"
                )}>
                  {count}
                </span>
                <span className="text-sm text-muted-foreground mt-1">/ {target}</span>
              </div>
            </button>

            {completed && (
              <div className="mt-4 text-center animate-pulse-glow">
                <span className="material-symbols-outlined text-accent text-[32px]">check_circle</span>
                <p className="text-sm font-bold text-accent mt-1">Tamamlandı! Maşallah!</p>
              </div>
            )}

            {/* Controls */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-3 text-sm font-medium text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                Sıfırla
              </button>
              {completed && (
                <button
                  onClick={handleNextDhikr}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                >
                  <span className="material-symbols-outlined text-[20px]">skip_next</span>
                  Sonraki
                </button>
              )}
            </div>

            {/* Total counter */}
            <div className="mt-8 rounded-xl border border-primary/10 bg-card p-4 shadow-sm w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Toplam Zikir</p>
                  <p className="text-2xl font-extrabold text-primary">{totalCount.toLocaleString("tr-TR")}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="material-symbols-outlined text-primary text-[28px]">counter_1</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Chart */}
            <div className="rounded-2xl border border-primary/10 bg-card p-5 shadow-sm">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                Son 7 Günün Özeti
              </h3>
              
              <div className="flex h-40 items-end justify-between gap-2 px-1">
                {statsData.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative w-full group">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        {d.total}
                      </div>
                      <div 
                        className={cn(
                          "w-full rounded-t-lg transition-all duration-500",
                          d.date === new Date().toISOString().split('T')[0] ? "bg-primary" : "bg-primary/20 hover:bg-primary/40"
                        )}
                        style={{ height: `${(d.total / maxTotal) * 100}%`, minHeight: d.total > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed logs */}
            <div className="rounded-2xl border border-primary/10 bg-card p-5 shadow-sm">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[18px]">history</span>
                Bugünün Dağılımı
              </h3>
              
              <div className="space-y-3">
                {Object.entries(todayLogs).length > 0 ? (
                  Object.entries(todayLogs).map(([name, count], i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-primary/5 last:border-0">
                      <span className="text-sm font-medium">{name}</span>
                      <span className="text-sm font-bold text-primary">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs text-muted-foreground italic">Henüz bugün için zikir kaydı yok.</p>
                )}
              </div>
            </div>
            
            <p className="text-[10px] text-center text-muted-foreground">İstatistikler her gece 00:00'da sonraki güne devredilir.</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
            <h3 className="text-lg font-bold mb-4">Ayarlar</h3>

            {/* Vibration toggle */}
            <div className="flex items-center justify-between py-3 border-b border-primary/5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">vibration</span>
                <span className="font-medium text-sm">Titreşim</span>
              </div>
              <button
                onClick={() => setVibrationEnabled(!vibrationEnabled)}
                className={cn("h-[31px] w-[51px] rounded-full transition-colors", vibrationEnabled ? "bg-primary" : "bg-muted")}
              >
                <div className={cn("h-[27px] w-[27px] rounded-full bg-card shadow transition-transform", vibrationEnabled ? "translate-x-[22px]" : "translate-x-[2px]")} />
              </button>
            </div>

            {/* Custom target */}
            <div className="py-3 border-b border-primary/5">
              <p className="text-sm font-medium mb-2">Hedef Sayı</p>
              <div className="flex gap-2">
                {[33, 99, 100, 500, 1000].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setCustomTarget(t); setCount(0); }}
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-bold",
                      (customTarget ?? preset.target) === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset total */}
            <button
              onClick={() => { setTotalCount(0); localStorage.setItem("ikra_zikir_total", "0"); }}
              className="mt-4 w-full rounded-xl bg-destructive/10 py-3 text-sm font-medium text-destructive"
            >
              Toplam Sayacı Sıfırla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
