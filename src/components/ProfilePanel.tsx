import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type AdminTab = "wallpaper" | "daily" | "video" | "notifications" | "suggestions" | "users" | "facts" | "moods" | "tevekkul" | "dualar";

interface AdminPanelProps {
  onClose: () => void;
}

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

export default function ProfilePanel({ onClose }: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
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

  // AI Wallpaper generator state
  const [aiArabic, setAiArabic] = useState("");
  const [aiTurkish, setAiTurkish] = useState("");
  const [aiSource, setAiSource] = useState("");
  const [aiType, setAiType] = useState<"ayet" | "hadis">("ayet");
  const [aiStyle, setAiStyle] = useState("dark elegant");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiContentList, setAiContentList] = useState<any[]>([]);
  const [aiSelectedContent, setAiSelectedContent] = useState<string>("");

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
  const [syncingPlaylistId, setSyncingPlaylistId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<Record<string, string>>({});

  // Suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Facts state
  const [facts, setFacts] = useState<any[]>([]);
  const [factText, setFactText] = useState("");
  const [factSource, setFactSource] = useState("");
  const [factSaving, setFactSaving] = useState(false);

  // Moods state
  const [moodContents, setMoodContents] = useState<any[]>([]);
  const [moodCategory, setMoodCategory] = useState("Üzgün");
  const [moodType, setMoodType] = useState<"ayet" | "hadis">("ayet");
  const [moodTurkish, setMoodTurkish] = useState("");
  const [moodArabic, setMoodArabic] = useState("");
  const [moodSource, setMoodSource] = useState("");
  const [moodSaving, setMoodSaving] = useState(false);

  // Tevekkul Vakti state
  const [tevekkulItems, setTevekkulItems] = useState<any[]>([]);
  const [tevekkulText, setTevekkulText] = useState("");
  const [tevekkulSource, setTevekkulSource] = useState("");
  const [tevekkulSaving, setTevekkulSaving] = useState(false);

  // Dualar state
  const [duaRequests, setDuaRequests] = useState<any[]>([]);
  const [dualarLoading, setDualarLoading] = useState(false);

  // Notification state
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifImage, setNotifImage] = useState("");
  const [notifVideo, setNotifVideo] = useState("");
  const [notifSaving, setNotifSaving] = useState(false);
  const [sentNotifs, setSentNotifs] = useState<any[]>([]);

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsLoggedIn(true);
      setCurrentUserId(session.user.id);
      
      const displayName = session.user.user_metadata?.full_name || session.user.email || "";
      setUserEmail(displayName);

      await supabase.rpc("assign_admin_if_eligible");
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const hasAdmin = roles?.some((r: any) => r.role === "admin");
      const hasMod = roles?.some((r: any) => r.role === "moderator");
      setIsAdmin(!!hasAdmin);
      setIsModerator(!!hasMod);
      if (hasAdmin || hasMod) loadAllData();
    }
    setLoading(false);
  };

  const handleAuth = async () => {
    setAuthError("");
    if (authMode === "signup") {
      if (!name.trim()) { setAuthError("Lütfen adınızı girin."); return; }
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: name.trim()
          }
        }
      });
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
    setIsModerator(false);
    onClose();
  };

  const loadAllData = () => {
    fetchWallpapers();
    fetchDailyContent();
    fetchPlaylists();
    fetchNotifications();
    fetchSuggestions();
    fetchUsers();
    fetchFacts();
    fetchMoods();
    fetchTevekkul();
    fetchDuaRequests();
  };

  // ============ USERS ============
  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (profiles) setUsers(profiles);
    const { data: roles } = await supabase.from("user_roles").select("*");
    if (roles) setUserRoles(roles);
  };

  const getUserRole = (userId: string) => {
    const role = userRoles.find((r: any) => r.user_id === userId);
    return role?.role || "user";
  };

  const grantRole = async (userId: string, role: string) => {
    await supabase.from("user_roles").insert({ user_id: userId, role } as any);
    fetchUsers();
  };

  const revokeRole = async (userId: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId).neq("role", "admin");
    fetchUsers();
  };

  const toggleBan = async (userId: string, currentBan: boolean) => {
    await supabase.from("profiles").update({ is_banned: !currentBan } as any).eq("user_id", userId);
    fetchUsers();
  };

  // ============ WALLPAPERS ============
  const fetchWallpapers = async () => {
    const { data } = await supabase.from("wallpapers").select("*").order("sort_order").order("uploaded_at", { ascending: false });
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
        sort_order: wallpapers.length,
        created_by_user_id: currentUserId,
      } as any);
      setWpArabic(""); setWpTurkish(""); setWpFile(null);
      fetchWallpapers();
    }
    setWpSaving(false);
  };

  const deleteWallpaper = async (id: string) => {
    await supabase.from("wallpapers").delete().eq("id", id);
    fetchWallpapers();
  };

  const moveWallpaper = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= wallpapers.length) return;
    const a = wallpapers[index];
    const b = wallpapers[swapIndex];
    await Promise.all([
      supabase.from("wallpapers").update({ sort_order: swapIndex } as any).eq("id", a.id),
      supabase.from("wallpapers").update({ sort_order: index } as any).eq("id", b.id),
    ]);
    fetchWallpapers();
  };

  // ============ AI WALLPAPER GENERATOR ============
  const fetchContentForGenerator = async () => {
    const { data } = await supabase.from("daily_content").select("id, type, arabic_text, turkish_text, source").order("date", { ascending: false }).limit(200);
    if (data) setAiContentList(data);
  };

  const handleSelectContent = (id: string) => {
    setAiSelectedContent(id);
    const item = aiContentList.find((c: any) => c.id === id);
    if (item) {
      setAiArabic(item.arabic_text);
      setAiTurkish(item.turkish_text);
      setAiSource(item.source || "");
      setAiType(item.type);
    }
  };

  const handleGenerateWallpaper = async () => {
    if (!aiArabic.trim() || !aiTurkish.trim()) return;
    setAiGenerating(true);
    setAiResult(null);
    setAiError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturum bulunamadı");

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-wallpaper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          arabic_text: aiArabic.trim(),
          turkish_text: aiTurkish.trim(),
          source: aiSource.trim() || null,
          type: aiType,
          style: aiStyle,
        }),
      });

      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Üretim başarısız");

      setAiResult(result.image_url);
      fetchWallpapers();
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiGenerating(false);
    }
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
      source: dcSource.trim() || null, date: dcDate, created_by_user_id: currentUserId,
    } as any);
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
        created_by_user_id: currentUserId,
      } as any);
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

  const moveVideo = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= playlists.length) return;
    const a = playlists[index];
    const b = playlists[swapIndex];
    await Promise.all([
      supabase.from("video_playlists").update({ sort_order: swapIndex }).eq("id", a.id),
      supabase.from("video_playlists").update({ sort_order: index }).eq("id", b.id),
    ]);
    fetchPlaylists();
  };

  const syncPlaylistVideos = async (playlistId: string, youtubePlaylistId: string) => {
    setSyncingPlaylistId(playlistId);
    setSyncResult(prev => ({ ...prev, [playlistId]: "" }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("fetch-playlist-videos", {
        body: { playlistId, youtubePlaylistId },
      });
      if (res.error) throw res.error;
      const result = res.data as any;
      if (result.error) throw new Error(result.error);
      setSyncResult(prev => ({ ...prev, [playlistId]: `✅ ${result.count} video senkronlandı` }));
    } catch (err: any) {
      setSyncResult(prev => ({ ...prev, [playlistId]: `❌ ${err.message}` }));
    }
    setSyncingPlaylistId(null);
  };

  // ============ NOTIFICATIONS ============
  const fetchNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    if (data) setSentNotifs(data);
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setNotifSaving(true);
    
    // 1. Save to database
    await supabase.from("notifications").insert({
      title: notifTitle.trim(), body: notifBody.trim(),
      image_url: notifImage.trim() || null, video_url: notifVideo.trim() || null,
      created_by_user_id: currentUserId,
    } as any);

    // 2. Trigger the Push Notification Edge Function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            title: notifTitle.trim(),
            body: notifBody.trim(),
            imageUrl: notifImage.trim() || null
          })
        });
      }
    } catch (e) {
      console.error("Failed to send push notification:", e);
    }

    setNotifTitle(""); setNotifBody(""); setNotifImage(""); setNotifVideo("");
    fetchNotifications();
    setNotifSaving(false);
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    fetchNotifications();
  };

  // ============ FACTS ============
  const fetchFacts = async () => {
    const { data } = await supabase.from("islamic_facts" as any).select("*").order("created_at", { ascending: false });
    if (data) setFacts(data);
  };

  const handleSaveFact = async () => {
    if (!factText.trim()) return;
    setFactSaving(true);
    await supabase.from("islamic_facts" as any).insert({
      fact_text: factText.trim(),
      source: factSource.trim() || null
    } as any);
    setFactText("");
    setFactSource("");
    fetchFacts();
    setFactSaving(false);
  };

  const deleteFact = async (id: string) => {
    await supabase.from("islamic_facts" as any).delete().eq("id", id);
    fetchFacts();
  };

  // ============ MOODS ============
  const fetchMoods = async () => {
    const { data } = await supabase.from("mood_contents" as any).select("*").order("created_at", { ascending: false });
    if (data) setMoodContents(data);
  };

  const handleSaveMood = async () => {
    if (!moodTurkish.trim()) return;
    setMoodSaving(true);
    await supabase.from("mood_contents" as any).insert({
      mood: moodCategory,
      type: moodType,
      turkish_text: moodTurkish.trim(),
      arabic_text: moodArabic.trim() || null,
      source: moodSource.trim() || null
    } as any);
    setMoodTurkish(""); setMoodArabic(""); setMoodSource("");
    fetchMoods();
    setMoodSaving(false);
  };

  const deleteMood = async (id: string) => {
    await supabase.from("mood_contents" as any).delete().eq("id", id);
    fetchMoods();
  };

  // ============ TEVEKKÜL VAKTİ ============
  const fetchTevekkul = async () => {
    const { data } = await supabase.from("tevekkul_vakti" as any).select("*").order("created_at", { ascending: false });
    if (data) setTevekkulItems(data);
  };

  const handleSaveTevekkul = async () => {
    if (!tevekkulText.trim()) return;
    setTevekkulSaving(true);
    await supabase.from("tevekkul_vakti" as any).insert({
      content_text: tevekkulText.trim(),
      source: tevekkulSource.trim() || null
    } as any);
    setTevekkulText(""); setTevekkulSource("");
    fetchTevekkul();
    setTevekkulSaving(false);
  };

  const deleteTevekkul = async (id: string) => {
    await supabase.from("tevekkul_vakti" as any).delete().eq("id", id);
    fetchTevekkul();
  };

  // ============ SUGGESTIONS ============
  const fetchSuggestions = async () => {
    setSuggestionsLoading(true);
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSuggestions(data);
    setSuggestionsLoading(false);
  };

  const approveSuggestion = async (s: any) => {
    try {
      // Create the content based on category
      if (s.category === "ayet" || s.category === "hadis") {
        await supabase.from("daily_content").insert({
          type: s.category,
          arabic_text: s.arabic_text || "",
          turkish_text: s.turkish_text || "",
          source: s.source || null,
          created_by_user_id: currentUserId,
          contributor_name: s.user_display_name,
        } as any);
      } else if (s.category === "wallpaper" && s.image_url) {
        await supabase.from("wallpapers").insert({
          image_url: s.image_url,
          category: "Günün Ayeti",
          created_by_user_id: currentUserId,
          contributor_name: s.user_display_name,
        } as any);
      } else if (s.category === "playlist" && s.youtube_url) {
        const playlistId = extractPlaylistId(s.youtube_url);
        if (playlistId) {
          await supabase.from("video_playlists").insert({
            title: s.title || "Önerilen Playlist",
            youtube_playlist_url: s.youtube_url,
            youtube_playlist_id: playlistId,
            is_published: true,
            sort_order: playlists.length,
            created_by_user_id: currentUserId,
            contributor_name: s.user_display_name,
          } as any);
        }
      }
      // Update suggestion status
      await supabase.from("suggestions").update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUserId,
      } as any).eq("id", s.id);
      fetchSuggestions();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectSuggestion = async (id: string, note?: string) => {
    const defaultNote = "Değerli katkınız için çok teşekkür ederiz 🤲 Önerinizi inceledik ancak şu an için yayınlayamıyoruz. Lütfen yeni önerilerinizi paylaşmaya devam edin, desteğiniz bizim için çok kıymetli! 💛";
    await supabase.from("suggestions").update({
      status: "rejected",
      admin_note: note || defaultNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: currentUserId,
    } as any).eq("id", id);
    fetchSuggestions();
  };

  // ============ DUA REQUESTS ============
  const fetchDuaRequests = async () => {
    setDualarLoading(true);
    const { data } = await supabase
       .from("dua_requests" as any)
      .select(`
        id, user_id, prayer_text, is_approved, created_at,
        profiles ( full_name, avatar_url )
      `)
      .order("created_at", { ascending: false });
    if (data) setDuaRequests(data);
    setDualarLoading(false);
  };

  const toggleDuaApproval = async (id: string, currentStatus: boolean) => {
    await supabase.from("dua_requests" as any).update({ is_approved: !currentStatus } as any).eq("id", id);
    fetchDuaRequests();
  };

  const deleteDuaRequest = async (id: string) => {
    if (!window.confirm("Bu dua isteğini silmek istediğinizden emin misiniz?")) return;
    await supabase.from("dua_requests").delete().eq("id", id);
    fetchDuaRequests();
  };

  // Helper: can user delete/edit this item?
  const canModify = (item: any) => {
    return isAdmin || isModerator;
  };

  // ============ RENDER ============
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Giriş Yap / Kayıt Ol</h2>
            <button onClick={onClose}>
              <span className="material-symbols-outlined text-muted-foreground">close</span>
            </button>
          </div>
          <div className="space-y-3">
            {authMode === "signup" && (
              <input type="text" placeholder="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-primary/10 bg-card px-4 py-3 text-sm text-foreground" />
            )}
            <input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-primary/10 bg-card px-4 py-3 text-sm text-foreground" />
            <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-primary/10 bg-card px-4 py-3 text-sm text-foreground" />
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

  const TABS: { key: AdminTab; label: string; icon: string; adminOnly?: boolean }[] = [
    { key: "dualar", label: "Dualar", icon: "diversity_1" },
    { key: "tevekkul", label: "Tevekkül", icon: "filter_vintage" },
    { key: "moods", label: "Duygular", icon: "self_improvement" },
    { key: "facts", label: "Günün Bilgisi", icon: "lightbulb" },
    { key: "wallpaper", label: "Duvar Kağıdı", icon: "wallpaper" },
    { key: "daily", label: "Ayet/Hadis", icon: "menu_book" },
    { key: "video", label: "Videolar", icon: "video_library" },
    { key: "notifications", label: "Bildirimler", icon: "notifications" },
    { key: "suggestions", label: "Öneriler", icon: "lightbulb" },
    { key: "users", label: "Kullanıcılar", icon: "group", adminOnly: true },
  ];

  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin);

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-primary/10 bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-lg font-bold">Profilim</h3>
          <button onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm block">{userEmail}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAdmin ? "Yönetici (Admin)" : isModerator ? "Moderatör" : "Kullanıcı"}
              </p>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg">Çıkış Yap</button>
          </div>
        </div>

        {(isAdmin || isModerator) && (
          <div className="flex overflow-x-auto scrollbar-hide border-t border-primary/10">
            {visibleTabs.map((t) => (
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
        )}
      </div>

      <div className="p-4">
        {!(isAdmin || isModerator) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
            <span className="material-symbols-outlined text-primary text-[48px] mb-4">verified_user</span>
            <p className="text-sm font-medium">Profilinize hoş geldiniz.</p>
            <p className="text-xs text-muted-foreground mt-1">Uygulamadaki tüm özellikleri artık sorunsuz kullanabilirsiniz.</p>
          </div>
        ) : (
          <>
            {/* ===== TABS CONTENT START ===== */}
        {/* ===== WALLPAPER TAB ===== */}
        {activeTab === "wallpaper" && (
          <div className="space-y-4">
            {/* AI Wallpaper Generator */}
            <div className="rounded-xl border-2 border-accent/30 bg-gradient-to-b from-accent/5 to-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">auto_awesome</span>
                <h4 className="text-sm font-bold text-accent">AI Wallpaper Üretici</h4>
              </div>
              <p className="text-[10px] text-muted-foreground">Ayet veya hadis seçin, AI altın kaligrafi wallpaper üretsin.</p>

              {/* Load content button */}
              {aiContentList.length === 0 ? (
                <button
                  onClick={fetchContentForGenerator}
                  className="w-full rounded-lg bg-accent/10 border border-accent/20 px-4 py-2 text-sm font-medium text-accent"
                >
                  <span className="material-symbols-outlined text-[16px] align-middle mr-1">download</span>
                  Ayet/Hadis Listesini Yükle
                </button>
              ) : (
                <select
                  value={aiSelectedContent}
                  onChange={(e) => handleSelectContent(e.target.value)}
                  className="w-full rounded-lg border border-accent/20 bg-card px-3 py-2 text-sm text-foreground"
                >
                  <option value="">— İçerik seçin —</option>
                  {aiContentList.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      [{c.type === "ayet" ? "Ayet" : "Hadis"}] {c.turkish_text.substring(0, 60)}...
                    </option>
                  ))}
                </select>
              )}

              <input placeholder="Arapça metin" value={aiArabic} onChange={(e) => setAiArabic(e.target.value)} className="w-full rounded-lg border border-accent/20 bg-card px-3 py-2 text-sm text-foreground font-arabic" dir="rtl" />
              <input placeholder="Türkçe metin" value={aiTurkish} onChange={(e) => setAiTurkish(e.target.value)} className="w-full rounded-lg border border-accent/20 bg-card px-3 py-2 text-sm text-foreground" />
              <input placeholder="Kaynak (opsiyonel)" value={aiSource} onChange={(e) => setAiSource(e.target.value)} className="w-full rounded-lg border border-accent/20 bg-card px-3 py-2 text-sm text-foreground" />

              <div className="flex gap-2">
                <button onClick={() => setAiType("ayet")} className={cn("flex-1 rounded-lg py-2 text-xs font-bold", aiType === "ayet" ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground")}>Ayet</button>
                <button onClick={() => setAiType("hadis")} className={cn("flex-1 rounded-lg py-2 text-xs font-bold", aiType === "hadis" ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground")}>Hadis</button>
              </div>

              <select value={aiStyle} onChange={(e) => setAiStyle(e.target.value)} className="w-full rounded-lg border border-accent/20 bg-card px-3 py-2 text-sm text-foreground">
                <option value="dark elegant">Koyu & Zarif (Siyah/Yeşil)</option>
                <option value="golden luxury on black">Altın Lüks (Siyah Arka Plan)</option>
                <option value="midnight blue with gold">Gece Mavisi & Altın</option>
                <option value="emerald green with gold shimmer">Zümrüt Yeşili & Altın Işıltı</option>
                <option value="white marble with gold">Beyaz Mermer & Altın</option>
                <option value="royal purple with gold">Mor & Altın</option>
              </select>

              <button
                onClick={handleGenerateWallpaper}
                disabled={aiGenerating || !aiArabic.trim() || !aiTurkish.trim()}
                className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-accent-foreground disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {aiGenerating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Üretiliyor... (30-60 sn)
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    Wallpaper Üret
                  </>
                )}
              </button>

              {aiError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                  {aiError}
                </div>
              )}

              {aiResult && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-accent">✅ Başarıyla üretildi!</p>
                  <img src={aiResult} alt="Generated wallpaper" className="w-full rounded-lg border border-accent/20" />
                </div>
              )}
            </div>

            {/* Manual upload */}
            <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-3">
              <h4 className="text-sm font-bold">Manuel Yükleme</h4>
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
                {wallpapers.map((w, i) => (
                  <div key={w.id} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-card p-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveWallpaper(i, "up")} disabled={i === 0} className="text-muted-foreground disabled:opacity-20">
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      </button>
                      <button onClick={() => moveWallpaper(i, "down")} disabled={i === wallpapers.length - 1} className="text-muted-foreground disabled:opacity-20">
                        <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      </button>
                    </div>
                    <img src={w.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{w.turkish_text || w.category}</p>
                      <p className="text-[10px] text-muted-foreground">{w.category}</p>
                    </div>
                    {canModify(w) && (
                      <button onClick={() => deleteWallpaper(w.id)} className="text-destructive">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
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
                      <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", item.type === "ayet" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent-foreground")}>{item.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{item.date}</span>
                        {canModify(item) && (
                          <button onClick={() => deleteDaily(item.id)} className="text-destructive">
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        )}
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

        {/* ===== FACTS TAB ===== */}
        {activeTab === "facts" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-3">
              <h4 className="text-sm font-bold">Yeni Bilgi Ekle ("Bunu Biliyor Muydun?")</h4>
              <textarea placeholder="Bilgi metni *" value={factText} onChange={(e) => setFactText(e.target.value)} rows={3} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground resize-none" />
              <input placeholder="Kaynak (opsiyonel)" value={factSource} onChange={(e) => setFactSource(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              <button onClick={handleSaveFact} disabled={factSaving || !factText.trim()} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                {factSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2">Mevcut Bilgiler ({facts.length})</h4>
              <div className="space-y-2">
                {facts.map((f) => (
                  <div key={f.id} className="rounded-xl border border-primary/10 bg-card p-3">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-medium text-foreground pr-4 line-clamp-3">{f.fact_text}</p>
                      <button onClick={() => deleteFact(f.id)} className="text-destructive shrink-0">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                    {f.source && <p className="text-[10px] text-muted-foreground mt-1">— {f.source}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== MOODS TAB ===== */}
        {activeTab === "moods" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-3">
              <h4 className="text-sm font-bold">Yeni Duygu Durumu İçeriği Ekle</h4>
              <select value={moodCategory} onChange={(e) => setMoodCategory(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground">
                <option value="Üzgün">Üzgün</option>
                <option value="Stresli">Stresli</option>
                <option value="Şükreden">Şükreden</option>
                <option value="Kararsız">Kararsız</option>
                <option value="Umutsuz">Umutsuz</option>
                <option value="Yalnız">Yalnız</option>
                <option value="Öfkeli">Öfkeli</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => setMoodType("ayet")} className={cn("flex-1 rounded-lg py-2 text-xs font-bold", moodType === "ayet" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>Ayet</button>
                <button onClick={() => setMoodType("hadis")} className={cn("flex-1 rounded-lg py-2 text-xs font-bold", moodType === "hadis" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>Hadis</button>
              </div>
              <input placeholder="Arapça metin (opsiyonel)" value={moodArabic} onChange={(e) => setMoodArabic(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground font-arabic" dir="rtl" />
              <textarea placeholder="Türkçe Meali *" value={moodTurkish} onChange={(e) => setMoodTurkish(e.target.value)} rows={3} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground resize-none" />
              <input placeholder="Kaynak (opsiyonel)" value={moodSource} onChange={(e) => setMoodSource(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              
              <button onClick={handleSaveMood} disabled={moodSaving || !moodTurkish.trim()} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                {moodSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2">Mevcut İçerikler ({moodContents.length})</h4>
              <div className="space-y-2">
                {moodContents.map((m) => (
                  <div key={m.id} className="rounded-xl border border-primary/10 bg-card p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] font-bold uppercase bg-accent/10 text-accent-foreground px-2 py-0.5 rounded-full">{m.mood}</span>
                        <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", m.type === "ayet" ? "bg-primary/10 text-primary" : "bg-gray-500/10 text-gray-500")}>{m.type}</span>
                      </div>
                      <button onClick={() => deleteMood(m.id)} className="text-destructive shrink-0">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                    {m.arabic_text && <p className="text-xs font-arabic mt-2" dir="rtl">{m.arabic_text.substring(0, 60)}...</p>}
                    <p className="text-[11px] font-medium text-muted-foreground mt-1 leading-relaxed">"{m.turkish_text}"</p>
                    {m.source && <p className="text-[10px] text-muted-foreground mt-1 text-right">— {m.source}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== TEVEKKÜL VAKTİ TAB ===== */}
        {activeTab === "tevekkul" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                 <span className="material-symbols-outlined text-teal-500">filter_vintage</span>
                 Yeni Tevekkül Motivatörü Ekle
              </h4>
              <textarea placeholder="Motivasyon metni, ayet veya hadis *" value={tevekkulText} onChange={(e) => setTevekkulText(e.target.value)} rows={3} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground resize-none" />
              <input placeholder="Kaynak (Örn: Müzzemmil 9)" value={tevekkulSource} onChange={(e) => setTevekkulSource(e.target.value)} className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2 text-sm text-foreground" />
              
              <button onClick={handleSaveTevekkul} disabled={tevekkulSaving || !tevekkulText.trim()} className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {tevekkulSaving ? "Ekleniyor..." : "Tevekkül Notu Ekle"}
              </button>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2">Mevcut Liste ({tevekkulItems.length})</h4>
              <div className="space-y-2">
                {tevekkulItems.map((t) => (
                  <div key={t.id} className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 relative pr-10">
                    <button onClick={() => deleteTevekkul(t.id)} className="absolute top-3 right-3 text-destructive hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                    <p className="text-xs font-semibold text-foreground/90 mt-1 leading-relaxed">"{t.content_text}"</p>
                    {t.source && <p className="text-[10px] text-teal-600/80 mt-1.5 font-bold">— {t.source}</p>}
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
                {playlists.map((p, i) => (
                  <div key={p.id} className="rounded-xl border border-primary/10 bg-card p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveVideo(i, "up")} disabled={i === 0} className="text-muted-foreground disabled:opacity-20">
                          <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                        </button>
                        <button onClick={() => moveVideo(i, "down")} disabled={i === playlists.length - 1} className="text-muted-foreground disabled:opacity-20">
                          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                        </button>
                      </div>
                      {p.cover_image_url ? <img src={p.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center"><span className="material-symbols-outlined text-primary/30">playlist_play</span></div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{p.title}</p>
                        <span className={cn("text-[10px] font-bold", p.is_published ? "text-primary" : "text-muted-foreground")}>{p.is_published ? "Yayında" : "Taslak"}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-primary/5">
                      {canModify(p) && (
                        <button onClick={() => { setVidEditId(p.id); setVidTitle(p.title); setVidUrl(p.youtube_playlist_url); setVidDesc(p.description || ""); }} className="flex-1 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">Düzenle</button>
                      )}
                      {canModify(p) && (
                        <button onClick={() => togglePublishVideo(p.id, p.is_published)} className="flex-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium">{p.is_published ? "Gizle" : "Yayınla"}</button>
                      )}
                      {canModify(p) && (
                        <button
                          onClick={() => syncPlaylistVideos(p.id, p.youtube_playlist_id)}
                          disabled={syncingPlaylistId === p.id}
                          className="flex-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <span className={cn("material-symbols-outlined text-[14px]", syncingPlaylistId === p.id && "animate-spin")}>
                            {syncingPlaylistId === p.id ? "progress_activity" : "sync"}
                          </span>
                          {syncingPlaylistId === p.id ? "Senkronlanıyor..." : "Videoları Senkronla"}
                        </button>
                      )}
                      {canModify(p) && (
                        <button onClick={() => deleteVideo(p.id)} className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">Sil</button>
                      )}
                    </div>
                    {syncResult[p.id] && (
                      <p className="text-[10px] mt-1 px-1">{syncResult[p.id]}</p>
                    )}
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
                        {canModify(n) && (
                          <button onClick={() => deleteNotification(n.id)} className="text-destructive">
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        )}
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

        {/* ===== SUGGESTIONS TAB ===== */}
        {activeTab === "suggestions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold">Gelen Öneriler</h4>
              <button onClick={fetchSuggestions} className="text-xs text-primary font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                Yenile
              </button>
            </div>

            {suggestionsLoading ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-[40px] text-muted-foreground/30">lightbulb</span>
                <p className="text-sm text-muted-foreground mt-2">Henüz öneri gelmedi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s) => {
                  const isPending = s.status === "pending";
                  const isApproved = s.status === "approved";
                  return (
                    <div key={s.id} className={cn(
                      "rounded-xl border bg-card p-4",
                      isPending ? "border-yellow-500/30" : isApproved ? "border-primary/20" : "border-destructive/20"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                            s.category === "ayet" ? "bg-primary/10 text-primary" :
                            s.category === "hadis" ? "bg-accent/10 text-accent-foreground" :
                            s.category === "wallpaper" ? "bg-purple-500/10 text-purple-600" :
                            "bg-blue-500/10 text-blue-600"
                          )}>
                            {s.category}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            isPending ? "bg-yellow-500/10 text-yellow-600" :
                            isApproved ? "bg-primary/10 text-primary" :
                            "bg-destructive/10 text-destructive"
                          )}>
                            {isPending ? "Bekliyor" : isApproved ? "Onaylandı" : "Reddedildi"}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString("tr-TR")}
                        </span>
                      </div>

                      {/* User info */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-[16px] text-muted-foreground">person</span>
                        <span className="text-xs font-medium">{s.user_display_name}</span>
                      </div>

                      {/* Content preview */}
                      {s.arabic_text && (
                        <p className="text-xs font-arabic mb-1" dir="rtl">{s.arabic_text.substring(0, 100)}...</p>
                      )}
                      {s.turkish_text && (
                        <p className="text-xs text-muted-foreground mb-1">{s.turkish_text.substring(0, 120)}...</p>
                      )}
                      {s.source && (
                        <p className="text-[10px] text-primary mb-1">📖 {s.source}</p>
                      )}
                      {s.youtube_url && (
                        <p className="text-[10px] text-blue-500 mb-1 truncate">🔗 {s.youtube_url}</p>
                      )}
                      {s.image_url && (
                        <img src={s.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                      )}
                      {s.title && (
                        <p className="text-xs font-bold mb-1">{s.title}</p>
                      )}
                      {s.description && (
                        <p className="text-xs text-muted-foreground mb-1">{s.description}</p>
                      )}

                      {/* Actions */}
                      {isPending && (
                        <div className="flex gap-2 mt-3 pt-2 border-t border-primary/5">
                          <button
                            onClick={() => approveSuggestion(s)}
                            className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Onayla & Yayınla
                          </button>
                          <button
                            onClick={() => rejectSuggestion(s.id, "Uygun görülmedi")}
                            className="flex-1 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                            Reddet
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== USERS TAB ===== */}
        {activeTab === "users" && isAdmin && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold">Kayıtlı Kullanıcılar ({users.length})</h4>
            <div className="space-y-2">
              {users.map((u) => {
                const role = getUserRole(u.user_id);
                const isCurrentUser = u.user_id === currentUserId;
                return (
                  <div key={u.id} className="rounded-xl border border-primary/10 bg-card p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{u.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                            role === "admin" ? "bg-primary/10 text-primary" :
                            role === "moderator" ? "bg-accent/10 text-accent-foreground" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {role === "admin" ? "Admin" : role === "moderator" ? "Moderatör" : "Kullanıcı"}
                          </span>
                          {u.is_banned && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Banlı</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Kayıt: {new Date(u.created_at).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>
                    {!isCurrentUser && role !== "admin" && (
                      <div className="flex gap-2 pt-2 border-t border-primary/5">
                        {role !== "moderator" ? (
                          <button onClick={() => grantRole(u.user_id, "moderator")} className="flex-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                            Moderatör Yap
                          </button>
                        ) : (
                          <button onClick={() => revokeRole(u.user_id)} className="flex-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-foreground">
                            Yetkiyi Kaldır
                          </button>
                        )}
                        <button onClick={() => toggleBan(u.user_id, u.is_banned)} className={cn(
                          "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium",
                          u.is_banned ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                        )}>
                          {u.is_banned ? "Ban Kaldır" : "Banla"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== DUALAR TAB ===== */}
        {activeTab === "dualar" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground mb-4">Topluluk Dua İstekleri</h3>
            
            {dualarLoading ? (
               <div className="py-8 text-center"><span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span></div>
            ) : duaRequests.length === 0 ? (
               <div className="py-8 text-center text-muted-foreground text-sm">Henüz dua isteği yok.</div>
            ) : (
               <div className="space-y-3">
                 {duaRequests.map(dua => (
                   <div key={dua.id} className={cn(
                     "rounded-xl border p-4 shadow-sm relative",
                     dua.is_approved ? "bg-card border-primary/20" : "bg-card/50 border-orange-500/30"
                   )}>
                      {!dua.is_approved && (
                        <div className="absolute -top-2.5 -right-2.5 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 animate-pulse">
                           Onay Bekliyor
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                        <span className="text-xs font-bold text-foreground/80">{dua.profiles?.full_name || "Gizli Kullanıcı"}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(dua.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium leading-relaxed mb-4">"{dua.prayer_text}"</p>
                      
                      <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                        <button 
                          onClick={() => toggleDuaApproval(dua.id, dua.is_approved)}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5",
                            dua.is_approved ? "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20" : "bg-primary text-primary-foreground shadow-sm"
                          )}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {dua.is_approved ? "visibility_off" : "check_circle"}
                          </span>
                          {dua.is_approved ? "Yayından Kaldır" : "Onayla ve Yayınla"}
                        </button>
                        <button 
                          onClick={() => deleteDuaRequest(dua.id)}
                          className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold transition-colors flex items-center"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
