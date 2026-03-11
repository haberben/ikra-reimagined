import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Tümü", "Günün Ayeti", "Hadis-i Şerifler", "Hat Sanatı", "Manzara"];

interface WallpaperItem {
  id: string;
  arabic_text: string;
  turkish_text: string;
  category: string;
  image_url: string;
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
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthed, setAdminAuthed] = useState(false);

  // Admin form
  const [formArabic, setFormArabic] = useState("");
  const [formTurkish, setFormTurkish] = useState("");
  const [formCategory, setFormCategory] = useState("Günün Ayeti");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleUpload = async () => {
    if (!formFile || !formArabic.trim() || !formTurkish.trim()) return;
    setSaving(true);

    const ext = formFile.name.split(".").pop();
    const path = `wallpapers/${Date.now()}.${ext}`;
    const { data: uploadData } = await supabase.storage
      .from("video-covers")
      .upload(path, formFile);

    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from("video-covers")
        .getPublicUrl(uploadData.path);

      await supabase.from("wallpapers").insert({
        arabic_text: formArabic.trim(),
        turkish_text: formTurkish.trim(),
        category: formCategory,
        image_url: urlData.publicUrl,
      });

      setFormArabic("");
      setFormTurkish("");
      setFormFile(null);
      fetchWallpapers();
    }
    setSaving(false);
  };

  const filtered = wallpapers.filter((w) => {
    if (activeCategory !== "Tümü" && w.category !== activeCategory) return false;
    if (search && !w.turkish_text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="pb-20">
      <StickyHeader title="İKRA" subtitle="GALERİ" onLeftClick={onMenuOpen} onRightClick={onNotifications} />

      <div className="px-4 pt-4">
        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">search</span>
          <input
            type="text"
            placeholder="Duvar kağıdı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-primary/5 py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Category pills */}
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

        {/* Wallpaper grid */}
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
                  <img src={w.image_url} alt={w.turkish_text} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/30">
                    <p className="font-arabic text-lg text-center leading-relaxed text-white" dir="rtl">
                      {w.arabic_text}
                    </p>
                    <p className="mt-2 text-center text-[9px] uppercase tracking-widest text-white/80">
                      {w.turkish_text}
                    </p>
                  </div>
                  <button className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                    <span className="material-symbols-outlined text-white text-[16px]">download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin button */}
        <div className="mt-8 text-center">
          <button onClick={() => setShowAdmin(true)} className="text-xs text-muted-foreground underline">
            Admin Paneli
          </button>
        </div>

        {/* Admin modal */}
        {showAdmin && !adminAuthed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-xl bg-card p-6">
              <h3 className="mb-4 text-lg font-bold">Admin Girişi</h3>
              <input
                type="password"
                placeholder="Şifre"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full rounded-lg border border-primary/10 px-4 py-2 text-sm"
              />
              <div className="mt-4 flex gap-2">
                <button onClick={() => setShowAdmin(false)} className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm">İptal</button>
                <button
                  onClick={() => { if (adminPassword === "ikra2024") setAdminAuthed(true); }}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
                >
                  Giriş
                </button>
              </div>
            </div>
          </div>
        )}

        {showAdmin && adminAuthed && (
          <div className="fixed inset-0 z-50 overflow-auto bg-background">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/10 bg-card px-4 py-3">
              <h3 className="text-lg font-bold">Duvar Kağıdı Yükle</h3>
              <button onClick={() => { setShowAdmin(false); setAdminAuthed(false); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input type="file" accept="image/*" onChange={(e) => setFormFile(e.target.files?.[0] || null)} className="w-full text-sm" />
              <input placeholder="Arapça metin" value={formArabic} onChange={(e) => setFormArabic(e.target.value)} className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm" />
              <input placeholder="Türkçe metin" value={formTurkish} onChange={(e) => setFormTurkish(e.target.value)} className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm" />
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm">
                {CATEGORIES.filter(c => c !== "Tümü").map(c => <option key={c}>{c}</option>)}
              </select>
              <button
                onClick={handleUpload}
                disabled={saving || !formFile || !formArabic.trim() || !formTurkish.trim()}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Yükleniyor..." : "Yükle"}
              </button>

              {/* Existing wallpapers list */}
              <div className="mt-6">
                <h4 className="text-sm font-bold mb-3">Mevcut ({wallpapers.length})</h4>
                <div className="space-y-2">
                  {wallpapers.map((w) => (
                    <div key={w.id} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-card p-3">
                      <img src={w.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{w.turkish_text}</p>
                        <p className="text-[10px] text-muted-foreground">{w.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
