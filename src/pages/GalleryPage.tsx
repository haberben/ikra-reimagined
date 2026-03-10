import { useState } from "react";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Tümü", "Günün Ayeti", "Hadis-i Şerifler", "Hat Sanatı", "Manzara"];

interface WallpaperItem {
  id: number;
  arabic: string;
  turkish: string;
  category: string;
  bgColor: string;
}

const MOCK_WALLPAPERS: WallpaperItem[] = [
  { id: 1, arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", turkish: "Rahman ve Rahim olan Allah'ın adıyla", category: "Günün Ayeti", bgColor: "from-emerald-800 to-emerald-950" },
  { id: 2, arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", turkish: "Allah sabredenlerle beraberdir", category: "Günün Ayeti", bgColor: "from-teal-800 to-slate-900" },
  { id: 3, arabic: "وَذَكِّرْ فَإِنَّ الذِّكْرَىٰ تَنفَعُ الْمُؤْمِنِينَ", turkish: "Hatırlat, çünkü hatırlatma müminlere fayda verir", category: "Hadis-i Şerifler", bgColor: "from-amber-900 to-stone-900" },
  { id: 4, arabic: "رَبِّ اشْرَحْ لِي صَدْرِي", turkish: "Rabbim göğsümü aç", category: "Günün Ayeti", bgColor: "from-sky-900 to-indigo-950" },
  { id: 5, arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", turkish: "Allah'ı hamd ile tesbih ederim", category: "Hat Sanatı", bgColor: "from-rose-900 to-stone-900" },
  { id: 6, arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ", turkish: "Allah'tan başka ilah yoktur", category: "Hat Sanatı", bgColor: "from-green-900 to-emerald-950" },
  { id: 7, arabic: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ", turkish: "Allah'ım Muhammed'e salat et", category: "Hadis-i Şerifler", bgColor: "from-violet-900 to-slate-950" },
  { id: 8, arabic: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ", turkish: "Başarım ancak Allah'tandır", category: "Manzara", bgColor: "from-cyan-900 to-teal-950" },
];

export default function GalleryPage({ onNotifications }: { onNotifications: () => void }) {
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [search, setSearch] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthed, setAdminAuthed] = useState(false);

  const filtered = MOCK_WALLPAPERS.filter((w) => {
    if (activeCategory !== "Tümü" && w.category !== activeCategory) return false;
    if (search && !w.turkish.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="pb-20">
      <StickyHeader title="İKRA" onRightClick={onNotifications} />

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
        <div className="grid grid-cols-2 gap-3 mt-2">
          {filtered.map((w) => (
            <div key={w.id} className="flex flex-col gap-2">
              <div className={cn(
                "relative aspect-[9/16] overflow-hidden rounded-xl bg-gradient-to-b",
                w.bgColor
              )}>
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <p className="font-arabic text-lg text-center leading-relaxed text-white" dir="rtl">
                    {w.arabic}
                  </p>
                  <p className="mt-2 text-center text-[9px] uppercase tracking-widest text-white/80">
                    {w.turkish}
                  </p>
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                {/* Download button */}
                <button className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <span className="material-symbols-outlined text-white text-[16px]">download</span>
                </button>
              </div>
              <button className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                Ayarla
              </button>
            </div>
          ))}
        </div>

        {/* Admin button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowAdmin(true)}
            className="text-xs text-muted-foreground underline"
          >
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-xl bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Duvar Kağıdı Yükle</h3>
                <button onClick={() => { setShowAdmin(false); setAdminAuthed(false); }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-3">
                <input type="file" accept="image/*" className="w-full text-sm" />
                <input placeholder="Arapça metin" className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm" />
                <input placeholder="Türkçe metin" className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm" />
                <select className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm">
                  {CATEGORIES.filter(c => c !== "Tümü").map(c => <option key={c}>{c}</option>)}
                </select>
                <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                  Yükle (Supabase bağlantısı gerekli)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
