import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "Tümü", icon: "favorite" },
  { key: "wallpaper", label: "Duvar Kağıdı", icon: "wallpaper" },
  { key: "ayet", label: "Ayetler", icon: "auto_stories" },
  { key: "hadis", label: "Hadisler", icon: "menu_book" },
  { key: "video", label: "Videolar", icon: "video_library" },
];

interface FavoritesPageProps {
  onNotifications: () => void;
  onMenuOpen: () => void;
}

export default function FavoritesPage({ onNotifications, onMenuOpen }: FavoritesPageProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data: favs } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!favs || favs.length === 0) { setFavorites([]); setLoading(false); return; }
    setFavorites(favs);

    // Load referenced items
    const wallpaperIds = favs.filter(f => f.item_type === "wallpaper").map(f => f.item_id);
    const ayetIds = favs.filter(f => f.item_type === "ayet").map(f => f.item_id);
    const hadisIds = favs.filter(f => f.item_type === "hadis").map(f => f.item_id);
    const videoIds = favs.filter(f => f.item_type === "video").map(f => f.item_id);

    const itemMap: Record<string, any> = {};

    const promises: Promise<void>[] = [];

    if (wallpaperIds.length > 0) {
      promises.push(
        supabase.from("wallpapers").select("*").in("id", wallpaperIds).then(({ data }) => {
          data?.forEach(d => { itemMap[d.id] = { ...d, _type: "wallpaper" }; });
        })
      );
    }
    if (ayetIds.length > 0 || hadisIds.length > 0) {
      const dcIds = [...ayetIds, ...hadisIds];
      promises.push(
        supabase.from("daily_content").select("*").in("id", dcIds).then(({ data }) => {
          data?.forEach(d => { itemMap[d.id] = { ...d, _type: d.type }; });
        })
      );
    }
    if (videoIds.length > 0) {
      promises.push(
        supabase.from("video_playlists").select("*").in("id", videoIds).then(({ data }) => {
          data?.forEach(d => { itemMap[d.id] = { ...d, _type: "video" }; });
        })
      );
    }

    await Promise.all(promises);
    setItems(itemMap);
    setLoading(false);
  };

  const removeFavorite = async (favId: string) => {
    await supabase.from("favorites").delete().eq("id", favId);
    setFavorites(prev => prev.filter(f => f.id !== favId));
  };

  const filtered = activeCategory === "all"
    ? favorites
    : favorites.filter(f => f.item_type === activeCategory);

  const renderItem = (fav: any) => {
    const item = items[fav.item_id];
    if (!item) return null;

    if (item._type === "wallpaper") {
      return (
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
          <img src={item.image_url} alt={item.turkish_text || item.category} className="absolute inset-0 h-full w-full object-cover" />
          {(item.arabic_text || item.turkish_text) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-black/30">
              {item.arabic_text && <p className="font-arabic text-sm text-center text-white" dir="rtl">{item.arabic_text}</p>}
              {item.turkish_text && <p className="mt-1 text-center text-[8px] uppercase tracking-widest text-white/80">{item.turkish_text}</p>}
            </div>
          )}
          <button
            onClick={() => removeFavorite(fav.id)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur"
          >
            <span className="material-symbols-outlined text-red-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </button>
        </div>
      );
    }

    if (item._type === "ayet" || item._type === "hadis") {
      return (
        <div className="rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
              item._type === "ayet" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent-foreground"
            )}>
              {item._type === "ayet" ? "Ayet" : "Hadis"}
            </span>
            <button onClick={() => removeFavorite(fav.id)} className="text-red-400">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </button>
          </div>
          <p className="font-arabic text-lg leading-relaxed text-foreground" dir="rtl">{item.arabic_text}</p>
          <p className="mt-2 text-sm italic text-muted-foreground">"{item.turkish_text}"</p>
          {item.source && <p className="mt-1 text-xs text-primary/60">{item.source}</p>}
        </div>
      );
    }

    if (item._type === "video") {
      return (
        <div className="rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {item.cover_image_url ? (
              <img src={item.cover_image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-primary/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary/30 text-[28px]">playlist_play</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{item.title}</p>
              {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
            </div>
            <button onClick={() => removeFavorite(fav.id)} className="text-red-400">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="pb-20">
      <StickyHeader title="İKRA" subtitle="FAVORİLER" onLeftClick={onMenuOpen} onRightClick={onNotifications} />

      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "flex items-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors",
                activeCategory === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/5 border border-primary/10"
              )}
            >
              <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[48px] text-muted-foreground/30">favorite_border</span>
            <p className="mt-2 text-sm text-muted-foreground">
              {favorites.length === 0 ? "Henüz favori eklenmedi" : "Bu kategoride favori yok"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              İçeriklerdeki ♥ butonuna tıklayarak favorilere ekleyebilirsin
            </p>
          </div>
        ) : (
          <div className={cn(
            "mt-2",
            activeCategory === "wallpaper" || activeCategory === "all"
              ? "grid grid-cols-2 gap-3"
              : "space-y-3"
          )}>
            {filtered.map((fav) => {
              const item = items[fav.item_id];
              if (!item) return null;
              if (item._type === "wallpaper" && (activeCategory === "wallpaper" || activeCategory === "all")) {
                return <div key={fav.id}>{renderItem(fav)}</div>;
              }
              if (item._type !== "wallpaper" && activeCategory !== "wallpaper") {
                return <div key={fav.id}>{renderItem(fav)}</div>;
              }
              if (activeCategory === "all") {
                return <div key={fav.id} className="col-span-2">{renderItem(fav)}</div>;
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
