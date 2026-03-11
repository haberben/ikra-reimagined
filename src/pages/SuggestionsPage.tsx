import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StickyHeader from "@/components/layout/StickyHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SuggestionsPageProps {
  onBack: () => void;
}

type Category = "wallpaper" | "playlist" | "ayet" | "hadis";

const CATEGORY_OPTIONS: { value: Category; label: string; icon: string }[] = [
  { value: "ayet", label: "Ayet", icon: "auto_stories" },
  { value: "hadis", label: "Hadis", icon: "format_quote" },
  { value: "wallpaper", label: "Duvar Kağıdı", icon: "wallpaper" },
  { value: "playlist", label: "Video Playlist", icon: "playlist_play" },
];

export default function SuggestionsPage({ onBack }: SuggestionsPageProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState("");

  const [category, setCategory] = useState<Category>("ayet");
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("ikra_name") || "");
  const [arabicText, setArabicText] = useState("");
  const [turkishText, setTurkishText] = useState("");
  const [source, setSource] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [mySuggestions, setMySuggestions] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
      setUserId(session?.user?.id || null);
      if (session?.user) fetchMySuggestions(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session?.user);
    setUserId(session?.user?.id || null);
    if (session?.user) fetchMySuggestions(session.user.id);
    setLoading(false);
  };

  const handleAuth = async () => {
    setAuthError("");
    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else toast.success("Kayıt başarılı! E-postanızı doğrulayın.");
    }
  };

  const fetchMySuggestions = async (uid: string) => {
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data) setMySuggestions(data);
  };

  const handleSubmit = async () => {
    if (!userId) return;
    if (!displayName.trim()) { toast.error("Adınızı girin"); return; }

    // Validate based on category
    if ((category === "ayet" || category === "hadis") && (!arabicText.trim() || !turkishText.trim())) {
      toast.error("Arapça ve Türkçe metin gerekli"); return;
    }
    if (category === "playlist" && !youtubeUrl.trim()) {
      toast.error("YouTube playlist linki gerekli"); return;
    }
    if (category === "wallpaper" && !imageUrl.trim()) {
      toast.error("Görsel URL'si gerekli"); return;
    }

    setSending(true);
    const { error } = await supabase.from("suggestions").insert({
      user_id: userId,
      user_display_name: displayName.trim(),
      category,
      title: title.trim() || null,
      description: description.trim() || null,
      arabic_text: arabicText.trim() || null,
      turkish_text: turkishText.trim() || null,
      source: source.trim() || null,
      youtube_url: youtubeUrl.trim() || null,
      image_url: imageUrl.trim() || null,
    } as any);

    if (error) {
      toast.error("Gönderilemedi: " + error.message);
    } else {
      toast.success("Öneriniz gönderildi! İncelendikten sonra yayınlanacak 🎉");
      // Reset form
      setArabicText(""); setTurkishText(""); setSource("");
      setYoutubeUrl(""); setImageUrl(""); setTitle(""); setDescription("");
      fetchMySuggestions(userId);
    }
    setSending(false);
  };

  const statusLabel = (s: string) => {
    if (s === "pending") return { text: "Bekliyor", color: "bg-yellow-500/10 text-yellow-600" };
    if (s === "approved") return { text: "Onaylandı ✅", color: "bg-primary/10 text-primary" };
    return { text: "Reddedildi", color: "bg-destructive/10 text-destructive" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <StickyHeader title="İKRA" subtitle="ÖNERİLER" onLeftClick={onBack} leftIcon="arrow_back" />

      <div className="px-4 pt-4">
        {/* Hero */}
        <div className="rounded-xl bg-primary p-5 text-primary-foreground mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-accent">lightbulb</span>
            <h2 className="text-lg font-bold">İçerik Öner</h2>
          </div>
          <p className="text-sm opacity-80">
            Beğendiğiniz bir ayet, hadis, duvar kağıdı veya video playlist önerebilirsiniz. 
            Onaylandığında adınızla birlikte yayınlanır 💛
          </p>
        </div>

        {!isLoggedIn ? (
          <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-3">
            <p className="text-sm font-bold text-center">Öneri göndermek için giriş yapın</p>
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
        ) : (
          <>
            {/* Category selection */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCategory(opt.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors",
                    category === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-primary/10 bg-card text-muted-foreground"
                  )}
                >
                  <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">edit_note</span>
                {category === "ayet" ? "Ayet Öner" : category === "hadis" ? "Hadis Öner" : category === "wallpaper" ? "Duvar Kağıdı Öner" : "Video Playlist Öner"}
              </h4>

              <input
                placeholder="Adınız Soyadınız *"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); localStorage.setItem("ikra_name", e.target.value); }}
                className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2.5 text-sm text-foreground"
              />

              {(category === "ayet" || category === "hadis") && (
                <>
                  <textarea
                    placeholder="Arapça metin *"
                    value={arabicText}
                    onChange={(e) => setArabicText(e.target.value)}
                    className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2.5 text-sm text-foreground font-arabic min-h-[80px]"
                    dir="rtl"
                  />
                  <textarea
                    placeholder="Türkçe metin *"
                    value={turkishText}
                    onChange={(e) => setTurkishText(e.target.value)}
                    className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2.5 text-sm text-foreground min-h-[60px]"
                  />
                  <input
                    placeholder="Kaynak (ör: Bakara Suresi, 255. Ayet)"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2.5 text-sm text-foreground"
                  />
                </>
              )}

              {category === "playlist" && (
                <>
                  <input
                    placeholder="Playlist başlığı *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2.5 text-sm text-foreground"
                  />
                  <input
                    placeholder="YouTube Playlist Linki *"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2.5 text-sm text-foreground"
                  />
                  <textarea
                    placeholder="Açıklama (opsiyonel)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2.5 text-sm text-foreground resize-none"
                  />
                </>
              )}

              {category === "wallpaper" && (
                <>
                  <input
                    placeholder="Görsel URL'si *"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2.5 text-sm text-foreground"
                  />
                  <textarea
                    placeholder="Açıklama (opsiyonel — hangi ayet/hadis vs.)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-primary/10 bg-card px-3 py-2.5 text-sm text-foreground resize-none"
                  />
                </>
              )}

              <button
                onClick={handleSubmit}
                disabled={sending}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">send</span>
                )}
                {sending ? "Gönderiliyor..." : "Öneriyi Gönder"}
              </button>
            </div>

            {/* My suggestions */}
            {mySuggestions.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Önerilerim</h4>
                <div className="space-y-2">
                  {mySuggestions.map((s) => {
                    const st = statusLabel(s.status);
                    return (
                      <div key={s.id} className="rounded-xl border border-primary/10 bg-card p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold capitalize">{s.category}</span>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", st.color)}>{st.text}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {s.turkish_text || s.title || s.youtube_url || s.image_url}
                        </p>
                        {s.admin_note && (
                          <p className="text-[10px] text-muted-foreground mt-1 italic">Not: {s.admin_note}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(s.created_at).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
