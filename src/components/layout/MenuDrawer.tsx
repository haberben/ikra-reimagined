import { cn } from "@/lib/utils";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (target: string) => void;
  city: string;
  userName: string;
  dark?: boolean;
  onToggleDark?: () => void;
}

const MENU_ITEMS = [
  { icon: "home", label: "Ana Sayfa", target: "home" },
  { icon: "schedule", label: "Namaz Vakitleri", target: "times" },
  { icon: "menu_book", label: "Kur'an-ı Kerim", target: "quran" },
  { icon: "photo_library", label: "Galeri", target: "gallery" },
  { icon: "group", label: "Ortak Hatim", target: "hatim" },
  { icon: "counter_1", label: "Zikirmatik", target: "zikirmatik" },
  { icon: "notifications", label: "Bildirimler", target: "notifications" },
  { icon: "explore", label: "Kıble Bulucu", target: "times" },
];

export default function MenuDrawer({ open, onClose, onNavigate, city, userName, dark, onToggleDark }: MenuDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="absolute left-0 top-0 bottom-0 w-72 bg-card shadow-2xl animate-in slide-in-from-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="islamic-pattern bg-primary p-6 pb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/20">
              <span className="material-symbols-outlined text-primary-foreground text-[28px]">person</span>
            </div>
            <div>
              <p className="text-lg font-bold text-primary-foreground">{userName || "Misafir"}</p>
              <p className="text-xs text-primary-foreground/70">{city}</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="py-2">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.target + item.label}
              onClick={() => onNavigate(item.target)}
              className="flex w-full items-center gap-4 px-6 py-3 text-sm font-medium transition-colors hover:bg-primary/5"
            >
              <span className="material-symbols-outlined text-primary text-[22px]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          {/* Admin entry - separated */}
          <div className="border-t border-primary/10 mt-2 pt-2">
            <button
              onClick={() => onNavigate("admin")}
              className="flex w-full items-center gap-4 px-6 py-3 text-sm font-medium transition-colors hover:bg-primary/5"
            >
              <span className="material-symbols-outlined text-accent text-[22px]">admin_panel_settings</span>
              <span className="text-accent">Admin Paneli</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-primary/10 p-4 space-y-3">
          {onToggleDark && (
            <button
              onClick={onToggleDark}
              className="flex w-full items-center justify-between rounded-lg bg-secondary px-4 py-2.5"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="material-symbols-outlined text-[18px]">{dark ? "light_mode" : "dark_mode"}</span>
                <span>{dark ? "Açık Tema" : "Koyu Tema"}</span>
              </div>
              <div className={cn("h-5 w-9 rounded-full transition-colors", dark ? "bg-primary" : "bg-muted-foreground/30")}>
                <div className={cn("h-5 w-5 rounded-full bg-card shadow transition-transform", dark ? "translate-x-4" : "translate-x-0")} />
              </div>
            </button>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>İKRA v1.0 — Namaz & Kur'an</span>
          </div>
        </div>
      </div>
    </div>
  );
}
