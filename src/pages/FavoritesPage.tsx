import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const isNative = () => !!(window as any).Capacitor?.isNativePlatform?.();

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadImage(imageUrl: string, id: string) {
  try {
    const fileName = `ikra-wallpaper-${id.slice(0, 8)}.jpg`;
    const response = await fetch(imageUrl, { mode: "cors" });
    if (!response.ok) throw new Error("Görsel indirilemedi");
    const blob = await response.blob();

    if (isNative()) {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const base64Data = await blobToBase64(blob);
      try {
        await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Documents, recursive: true });
        toast.success("Görsel kaydedildi!", { description: "Belgeler klasörüne kaydedildi" });
      } catch {
        const file = new File([blob], fileName, { type: "image/jpeg" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "İKRA Duvar Kağıdı" });
          toast.success("Görsel paylaşıldı!");
        }
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Görsel indiriliyor");
    }
  } catch (err) {
    console.error("Download error:", err);
    toast.error("İndirme başarısız oldu");
  }
}

async function shareContent(type: string, arabicText: string, turkishText: string, source?: string) {
  const label = type === "ayet" ? "📖 Günün Ayeti" : "📿 Günün Hadisi";
  let text = `${label}\n\n${arabicText}\n\n"${turkishText}"`;
  if (source) text += `\n\n— ${source}`;
  text += "\n\n🕌 İKRA Uygulaması";

  if (navigator.share) {
    try {
      await navigator.share({ title: label, text });
      return;
    } catch { /* cancelled */ }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Panoya kopyalandı");
  } catch {
    toast.error("Paylaşım başarısız oldu");
  }
}

export default function FavoritesPage({ onNotifications, onMenuOpen }: FavoritesPageProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

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

    const wallpaperIds = favs.filter(f => f.item_type === "wallpaper").map(f => f.item_id);
    const ayetIds = favs.filter(f => f.item_type === "ayet").map(f => f.item_id);
    const hadisIds = favs.filter(f => f.item_type === "hadis").map(f => f.item_id);
    const videoIds = favs.filter(f => f.item_type === "video").map(f => f.item_id);

    const itemMap: Record<string, any> = {};

    if (wallpaperIds.length > 0) {
      const { data } = await supabase.from("wallpapers").select("*").in("id", wallpaperIds);
      data?.forEach(d => { itemMap[d.id] = { ...d, _type: "wallpaper" }; });
    }
    if (ayetIds.length > 0 || hadisIds.length > 0) {
      const dcIds = [...ayetIds, ...hadisIds];
      const { data } = await supabase.from("daily_content").select("*").in("id", dcIds);
      data?.forEach(d => { itemMap[d.id] = { ...d, _type: d.type }; });
    }
    if (videoIds.length > 0) {
      const { data } = await supabase.from("video_playlists").select("*").in("id", videoIds);
      data?.forEach(d => { itemMap[d.id] = { ...d, _type: "video" }; });
    }
    setItems(itemMap);
    setLoading(false);
  };

  const removeFavorite = async (favId: string) => {
    await supabase.from("favorites").delete().eq("id", favId);
    setFavorites(prev => prev.filter(f => f.id !== favId));
  };

  const handleDownload = useCallback(async (imageUrl: string, id: string) => {
    if (downloading) return;
    setDownloading(id);
    await downloadImage(imageUrl, id);
    setDownloading(null);
  }, [downloading]);

  const filtered = activeCategory === "all"
    ? favorites
    : favorites.filter(f => f.item_type === activeCategory);

  const renderItem = (fav: any) => {
    const item = items[fav.item_id];
    if (!item) return null;

    if (item._type === "wallpaper") {
      return (
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
          <img src={item.image_url} alt={item.category} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              onClick={() => removeFavorite(fav.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur"
            >
              <span className="material-symbols-outlined text-red-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </button>
            <button
              onClick={() => handleDownload(item.image_url, item.id)}
              disabled={downloading === item.id}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur"
            >
              <span className={cn("material-symbols-outlined text-white text-[16px]", downloading === item.id && "animate-spin")}>
                {downloading === item.id ? "progress_activity" : "download"}
              </span>
            </button>
          </div>
          {item.contributor_name && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-1">
                <span className="material-symbols-outlined text-[12px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                <span className="text-[9px] text-white/90 font-medium truncate">{item.contributor_name} katkısıyla</span>
              </div>
            </div>
          )}
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => shareContent(item._type, item.arabic_text, item.turkish_text, item.source)}
                className="p-1 text-muted-foreground hover:text-primary"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
              </button>
              <button onClick={() => removeFavorite(fav.id)} className="text-red-400">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </button>
            </div>
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
