import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Tümü", "Günün Ayeti", "Hadis-i Şerifler", "Hat Sanatı", "Manzara"];

interface WallpaperItem {
  id: string;
  arabic_text: string | null;
  turkish_text: string | null;
  category: string;
  image_url: string;
  contributor_name?: string | null;
}

interface GalleryPageProps {
  onNotifications: () => void;
  onMenuOpen: () => void;
}

export default function GalleryPage({ onNotifications, onMenuOpen }: GalleryPageProps) {
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [search, setSearch] = useState("");
  const [wallpapers, setWallpapers] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetchWallpapers();
  }, []);

  const fetchWallpapers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("wallpapers")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (data) setWallpapers(data);
    setLoading(false);
  };

  const filtered = wallpapers.filter((w) => {
    if (activeCategory !== "Tümü" && w.category !== activeCategory) return false;
    if (search && !(w.turkish_text || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="pb-20">
      <StickyHeader title="İKRA" subtitle="GALERİ" onLeftClick={onMenuOpen} onRightClick={onNotifications} />

      <div className="px-4 pt-4">
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">search</span>
          <input
            type="text"
            placeholder="Duvar kağıdı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-primary/5 py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/5 border border-primary/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[48px] text-muted-foreground/30">wallpaper</span>
            <p className="mt-2 text-sm text-muted-foreground">Henüz duvar kağıdı eklenmedi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {filtered.map((w) => (
              <div key={w.id} className="flex flex-col gap-2">
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-gradient-to-b from-primary/20 to-primary/40">
                  <img src={w.image_url} alt={w.turkish_text || w.category} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    <button
                      onClick={() => toggleFavorite(w.id, "wallpaper")}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur"
                    >
                      <span
                        className={cn("material-symbols-outlined text-[16px]", isFavorite(w.id) ? "text-red-400" : "text-white")}
                        style={isFavorite(w.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >favorite</span>
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                      <span className="material-symbols-outlined text-white text-[16px]">download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
