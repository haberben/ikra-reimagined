import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type AdminTab = "wallpaper" | "daily" | "video" | "notifications";

interface AdminPanelProps {
  onClose: () => void;
}

// Video helper
function extractPlaylistId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get("list");
  } catch {
    if (url.startsWith("PL") || url.length > 10) return url;
    return null;
  }
}

const WALLPAPER_CATEGORIES = ["Günün Ayeti", "Hadis-i Şerifler", "Hat Sanatı", "Manzara"];

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [activeTab, setActiveTab] = useState<AdminTab>("wallpaper");

  // Wallpaper state
  const [wallpapers, setWallpapers] = useState<any[]>([]);
  const [wpFile, setWpFile] = useState<File | null>(null);
  const [wpArabic, setWpArabic] = useState("");
  const [wpTurkish, setWpTurkish] = useState("");
  const [wpCategory, setWpCategory] = useState("Günün Ayeti");
  const [wpSaving, setWpSaving] = useState(false);

  // Daily content state
  const [dailyItems, setDailyItems] = useState<any[]>([]);
  const [dcType, setDcType] = useState<"ayet" | "hadis">("ayet");
  const [dcArabic, setDcArabic] = useState("");
  const [dcTurkish, setDcTurkish] = useState("");
  const [dcSource, setDcSource] = useState("");
  const [dcDate, setDcDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dcSaving, setDcSaving] = useState(false);

  // Video state
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [vidTitle, setVidTitle] = useState("");
  const [vidUrl, setVidUrl] = useState("");
  const [vidDesc, setVidDesc] = useState("");
  const [vidCover, setVidCover] = useState<File | null>(null);
  const [vidSaving, setVidSaving] = useState(false);
  const [vidEditId, setVidEditId] = useState<string | null>(null);

  // Notification state
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifImage, setNotifImage] = useState("");
  const [notifVideo, setNotifVideo] = useState("");
  const [notifSaving, setNotifSaving] = useState(false);
  const [sentNotifs, setSentNotifs] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsLoggedIn(true);
      // Check admin role
      await supabase.rpc("assign_admin_if_eligible");
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const hasAdmin = roles?.some((r: any) => r.role === "admin");
      setIsAdmin(!!hasAdmin);
      if (hasAdmin) loadAllData();
    }
    setLoading(false);
  };

  const handleAuth = async () => {
    setAuthError("");
    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setAuthError(error.message); return; }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setAuthError(error.message); return; }
    }
    await checkAuth();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setIsAdmin(false);
    onClose();
  };

  const loadAllData = () => {
    fetchWallpapers();
    fetchDailyContent();
    fetchPlaylists();
    fetchNotifications();
  };

  // ============ WALLPAPERS ============
  const fetchWallpapers = async () => {
    const { data } = await supabase.from("wallpapers").select("*").order("uploaded_at", { ascending: false });
    if (data) setWallpapers(data);
  };

  const handleUploadWallpaper = async () => {
    if (!wpFile) return;
    setWpSaving(true);
    const ext = wpFile.name.split(".").pop();
    const path = `wallpapers/${Date.now()}.${ext}`;
    const { data: uploadData } = await supabase.storage.from("video-covers").upload(path, wpFile);
    if (uploadData) {
      const { data: urlData } = supabase.storage.from("video-covers").getPublicUrl(uploadData.path);
      await supabase.from("wallpapers").insert({
        arabic_text: wpArabic.trim() || null,
        turkish_text: wpTurkish.trim() || null,
        category: wpCategory,
        image_url: urlData.publicUrl,
      });
      setWpArabic(""); setWpTurkish(""); setWpFile(null);
      fetchWallpapers();
    }
    setWpSaving(false);
  };

  const deleteWallpaper = async (id: string) => {
    await supabase.from("wallpapers").delete().eq("id", id);
    fetchWallpapers();
  };

  // ============ DAILY CONTENT ============
  const fetchDailyContent = async () => {
    const { data } = await supabase.from("daily_content").select("*").order("date", { ascending: false }).limit(30);
    if (data) setDailyItems(data);
  };

  const handleSaveDaily = async () => {
    if (!dcArabic.trim() || !dcTurkish.trim()) return;
    setDcSaving(true);
    await supabase.from("daily_content").insert({
      type: dcType, arabic_text: dcArabic.trim(), turkish_text: dcTurkish.trim(),
      source: dcSource.trim() || null, date: dcDate,
    });
    setDcArabic(""); setDcTurkish(""); setDcSource("");
    fetchDailyContent();
    setDcSaving(false);
  };

  const deleteDaily = async (id: string) => {
    await supabase.from("daily_content").delete().eq("id", id);
    fetchDailyContent();
  };

  // ============ VIDEOS ============
  const fetchPlaylists = async () => {
    const { data } = await supabase.from("video_playlists").select("*").order("sort_order");
    if (data) setPlaylists(data);
  };

  const handleSaveVideo = async () => {
    const playlistId = extractPlaylistId(vidUrl);
    if (!playlistId || !vidTitle.trim()) return;
    setVidSaving(true);
    let coverUrl: string | null = null;
    if (vidCover) {
      const ext = vidCover.name.split(".").pop();
      const path = `covers/${Date.now()}.${ext}`;
      const { data: uploadData } = await supabase.storage.from("video-covers").upload(path, vidCover);
      if (uploadData) {
        const { data: urlData } = supabase.storage.from("video-covers").getPublicUrl(uploadData.path);
        coverUrl = urlData.publicUrl;
      }
    }
    if (vidEditId) {
      await supabase.from("video_playlists").update({
        title: vidTitle.trim(), description: vidDesc.trim() || null,
        youtube_playlist_url: vidUrl.trim(), youtube_playlist_id: playlistId,
        ...(coverUrl ? { cover_image_url: coverUrl } : {}),
      }).eq("id", vidEditId);
    } else {
      await supabase.from("video_playlists").insert({
        title: vidTitle.trim(), description: vidDesc.trim() || null,
        youtube_playlist_url: vidUrl.trim(), youtube_playlist_id: playlistId,
        cover_image_url: coverUrl, is_published: true, sort_order: playlists.length,
      });
    }
    setVidTitle(""); setVidUrl(""); setVidDesc(""); setVidCover(null); setVidEditId(null);
    fetchPlaylists();
    setVidSaving(false);
  };

  const deleteVideo = async (id: string) => {
    await supabase.from("video_playlists").delete().eq("id", id);
    fetchPlaylists();
  };

  const togglePublishVideo = async (id: string, current: boolean) => {
    await supabase.from("video_playlists").update({ is_published: !current }).eq("id", id);
    fetchPlaylists();
  };

  // ============ NOTIFICATIONS ============
  const fetchNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    if (data) setSentNotifs(data);
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setNotifSaving(true);
    await supabase.from("notifications").insert({
      title: notifTitle.trim(), body: notifBody.trim(),
      image_url: notifImage.trim() || null, video_url: notifVideo.trim() || null,
    });
    setNotifTitle(""); setNotifBody(""); setNotifImage(""); setNotifVideo("");
    fetchNotifications();
    setNotifSaving(false);
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    fetchNotifications();
  };

  // ============ RENDER ============
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
      </div>
    );
  }

  // Auth screen
  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Admin Girişi</h2>
            <button onClick={onClose}>
              <span className="material-symbols-outlined text-muted-foreground">close</span>
            </button>
          </div>
          {isLoggedIn && !isAdmin && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Bu hesap admin yetkisine sahip değil.
            </div>
          )}
          <div className="space-y-3">
            <input
              type="email" placeholder="E-posta" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-primary/10 bg-card px-4 py-3 text-sm text-foreground"
            />
            <input
              type="password" placeholder="Şifre" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-primary/10 bg-card px-4 py-3 text-sm text-foreground"
            />
            {authError && <p className="text-xs text-destructive">{authError}</p>}
            <button onClick={handleAuth} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">
              {authMode === "login" ? "Giriş Yap" : "Kayıt Ol"}
            </button>
            <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} className="w-full text-xs text-muted-foreground">
              {authMode === "login" ? "Hesabın yok mu? Kayıt ol" : "Hesabın var mı? Giriş yap"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TABS: { key: AdminTab; label: string; icon: string }[] = [
    { key: "wallpaper", label: "Duvar Kağıdı", icon: "wallpaper" },
    { key: "daily", label: "Ayet/Hadis", icon: "menu_book" },
    { key: "video", label: "Videolar", icon: "video_library" },
    { key: "notifications", label: "Bildirimler", icon: "notifications" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-primary/10 bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-lg font-bold">Admin Paneli</h3>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="text-xs text-muted-foreground">Çıkış</button>
            <button onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 shrink-0 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors",
                activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              )}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* ===== WALLPAPER TAB ===== */}
        {activeTab === "wallpaper" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-3">
              <h4 className="text-sm font-bold">Yeni Duvar Kağıdı</h4>
              <input type="file" accept="image/*" onChange={(e) => setWpFile(e.target.files?.[0] || null)} className="w-full text-sm" />
              <input placeholder="Arapça metin (opsiyonel)" value={wpArabic} onChange={(e) => setWpArabic(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground font-arabic" dir="rtl" />
              <input placeholder="Türkçe metin (opsiyonel)" value={wpTurkish} onChange={(e) => setWpTurkish(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              <select value={wpCategory} onChange={(e) => setWpCategory(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground">
                {WALLPAPER_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={handleUploadWallpaper} disabled={wpSaving || !wpFile} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                {wpSaving ? "Yükleniyor..." : "Yükle"}
              </button>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2">Mevcut ({wallpapers.length})</h4>
              <div className="space-y-2">
                {wallpapers.map((w) => (
                  <div key={w.id} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-card p-3">
                    <img src={w.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{w.turkish_text || w.category}</p>
                      <p className="text-[10px] text-muted-foreground">{w.category}</p>
                    </div>
                    <button onClick={() => deleteWallpaper(w.id)} className="text-destructive">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== DAILY CONTENT TAB ===== */}
        {activeTab === "daily" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-3">
              <h4 className="text-sm font-bold">Yeni İçerik</h4>
              <div className="flex gap-2">
                <button onClick={() => setDcType("ayet")} className={cn("flex-1 rounded-lg py-2 text-sm font-bold", dcType === "ayet" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>Ayet</button>
                <button onClick={() => setDcType("hadis")} className={cn("flex-1 rounded-lg py-2 text-sm font-bold", dcType === "hadis" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>Hadis</button>
              </div>
              <input type="date" value={dcDate} onChange={(e) => setDcDate(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              <textarea placeholder="Arapça metin" value={dcArabic} onChange={(e) => setDcArabic(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground font-arabic min-h-[80px]" dir="rtl" />
              <textarea placeholder="Türkçe metin" value={dcTurkish} onChange={(e) => setDcTurkish(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground min-h-[60px]" />
              <input placeholder="Kaynak (ör: Bakara, 255)" value={dcSource} onChange={(e) => setDcSource(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              <button onClick={handleSaveDaily} disabled={dcSaving || !dcArabic.trim() || !dcTurkish.trim()} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                {dcSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2">Son İçerikler ({dailyItems.length})</h4>
              <div className="space-y-2">
                {dailyItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-primary/10 bg-card p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", item.type === "ayet" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent")}>{item.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{item.date}</span>
                        <button onClick={() => deleteDaily(item.id)} className="text-destructive">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-arabic mt-1" dir="rtl">{item.arabic_text?.substring(0, 60)}...</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.turkish_text?.substring(0, 80)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== VIDEO TAB ===== */}
        {activeTab === "video" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-3">
              <h4 className="text-sm font-bold">{vidEditId ? "Düzenle" : "Yeni Video Listesi"}</h4>
              <input placeholder="Başlık *" value={vidTitle} onChange={(e) => setVidTitle(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              <input placeholder="YouTube Playlist Linki *" value={vidUrl} onChange={(e) => setVidUrl(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              {vidUrl && extractPlaylistId(vidUrl) && <p className="text-[10px] text-primary">✓ Playlist ID: {extractPlaylistId(vidUrl)}</p>}
              <textarea placeholder="Açıklama" value={vidDesc} onChange={(e) => setVidDesc(e.target.value)} rows={2} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground resize-none" />
              <input type="file" accept="image/*" onChange={(e) => setVidCover(e.target.files?.[0] || null)} className="w-full text-sm" />
              <div className="flex gap-2">
                {vidEditId && <button onClick={() => { setVidEditId(null); setVidTitle(""); setVidUrl(""); setVidDesc(""); }} className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">İptal</button>}
                <button onClick={handleSaveVideo} disabled={vidSaving || !vidTitle.trim() || !extractPlaylistId(vidUrl)} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                  {vidSaving ? "Kaydediliyor..." : vidEditId ? "Güncelle" : "Yayınla"}
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2">Mevcut ({playlists.length})</h4>
              <div className="space-y-2">
                {playlists.map((p) => (
                  <div key={p.id} className="rounded-xl border border-primary/10 bg-card p-3">
                    <div className="flex items-center gap-3">
                      {p.cover_image_url ? <img src={p.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center"><span className="material-symbols-outlined text-primary/30">playlist_play</span></div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{p.title}</p>
                        <span className={cn("text-[10px] font-bold", p.is_published ? "text-primary" : "text-muted-foreground")}>{p.is_published ? "Yayında" : "Taslak"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 pt-2 border-t border-primary/5">
                      <button onClick={() => { setVidEditId(p.id); setVidTitle(p.title); setVidUrl(p.youtube_playlist_url); setVidDesc(p.description || ""); }} className="flex-1 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">Düzenle</button>
                      <button onClick={() => togglePublishVideo(p.id, p.is_published)} className="flex-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">{p.is_published ? "Gizle" : "Yayınla"}</button>
                      <button onClick={() => deleteVideo(p.id)} className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">Sil</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== NOTIFICATIONS TAB ===== */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-3">
              <h4 className="text-sm font-bold">Yeni Bildirim Gönder</h4>
              <input placeholder="Başlık *" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              <textarea placeholder="Bildirim içeriği *" value={notifBody} onChange={(e) => setNotifBody(e.target.value)} rows={4} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground resize-none" />
              <input placeholder="Görsel URL (opsiyonel)" value={notifImage} onChange={(e) => setNotifImage(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              <input placeholder="Video URL (opsiyonel)" value={notifVideo} onChange={(e) => setNotifVideo(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              <button onClick={handleSendNotification} disabled={notifSaving || !notifTitle.trim() || !notifBody.trim()} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                {notifSaving ? "Gönderiliyor..." : "Bildirimi Gönder"}
              </button>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2">Gönderilen ({sentNotifs.length})</h4>
              <div className="space-y-2">
                {sentNotifs.map((n) => (
                  <div key={n.id} className="rounded-xl border border-primary/10 bg-card p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold">{n.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString("tr-TR")}</span>
                        <button onClick={() => deleteNotification(n.id)} className="text-destructive">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.body.substring(0, 100)}...</p>
                    {n.image_url && <span className="text-[10px] text-primary">📷 Görsel ekli</span>}
                    {n.video_url && <span className="text-[10px] text-primary ml-2">🎥 Video ekli</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
