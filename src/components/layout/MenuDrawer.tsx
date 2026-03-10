import { cn } from "@/lib/utils";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (target: string) => void;
  city: string;
  userName: string;
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

export default function MenuDrawer({ open, onClose, onNavigate, city, userName }: MenuDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Drawer */}
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
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-primary/10 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>İKRA v1.0 — Namaz & Kur'an</span>
          </div>
        </div>
      </div>
    </div>
  );
}
