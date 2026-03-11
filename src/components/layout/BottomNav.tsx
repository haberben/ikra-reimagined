import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "home", label: "Ana Sayfa", icon: "home" },
  { id: "times", label: "Vakitler", icon: "schedule" },
  { id: "quran", label: "Kur'an", icon: "menu_book" },
  { id: "favorites", label: "Favoriler", icon: "favorite" },
  { id: "gallery", label: "Galeri", icon: "photo_library" },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/10 bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around py-1.5">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[24px]",
                  active && "font-bold"
                )}
                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
