import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VideoPlaylist {
  id: string;
  title: string;
  description: string | null;
  youtube_playlist_id: string;
  youtube_playlist_url: string;
  cover_image_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

const ADMIN_PASSWORD = "ikra2024";

function extractPlaylistId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get("list");
  } catch {
    // Try direct ID
    if (url.startsWith("PL") || url.length > 10) return url;
    return null;
  }
}

export default function VideoSection() {
  const [playlists, setPlaylists] = useState<VideoPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [activePlaylist, setActivePlaylist] = useState<VideoPlaylist | null>(null);
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);

  // Admin form state
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCoverFile, setFormCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Last watched tracking
  const [lastWatched, setLastWatched] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_video_progress") || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("video_playlists")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setPlaylists(data as VideoPlaylist[]);
    setLoading(false);
  };

  const handleSave = async () => {
    const playlistId = extractPlaylistId(formUrl);
    if (!playlistId || !formTitle.trim()) return;

    setSaving(true);
    let coverUrl: string | null = null;

    if (formCoverFile) {
      const ext = formCoverFile.name.split(".").pop();
      const path = `covers/${Date.now()}.${ext}`;
      const { data: uploadData } = await supabase.storage
        .from("video-covers")
        .upload(path, formCoverFile);
      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from("video-covers")
          .getPublicUrl(uploadData.path);
        coverUrl = urlData.publicUrl;
      }
    }

    if (editingId) {
      await supabase
        .from("video_playlists")
        .update({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          youtube_playlist_url: formUrl.trim(),
          youtube_playlist_id: playlistId,
          ...(coverUrl ? { cover_image_url: coverUrl } : {}),
        })
        .eq("id", editingId);
    } else {
      await supabase
        .from("video_playlists")
        .insert({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          youtube_playlist_url: formUrl.trim(),
          youtube_playlist_id: playlistId,
          cover_image_url: coverUrl,
          is_published: true,
          sort_order: playlists.length,
        });
    }

    resetForm();
    setSaving(false);
    fetchPlaylists();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("video_playlists").delete().eq("id", id);
    fetchPlaylists();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("video_playlists").update({ is_published: !current }).eq("id", id);
    fetchPlaylists();
  };

  const startEdit = (p: VideoPlaylist) => {
    setEditingId(p.id);
    setFormTitle(p.title);
    setFormUrl(p.youtube_playlist_url);
    setFormDescription(p.description || "");
    setFormCoverFile(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormTitle("");
    setFormUrl("");
    setFormDescription("");
    setFormCoverFile(null);
  };

  const saveVideoProgress = (playlistId: string, videoIndex: number) => {
    const updated = { ...lastWatched, [playlistId]: videoIndex };
    setLastWatched(updated);
    localStorage.setItem("ikra_video_progress", JSON.stringify(updated));
  };

  const publishedPlaylists = playlists.filter((p) => p.is_published);

  return (
    <div className="px-4 pt-4">
      {/* Admin toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Video Listeleri</h3>
        <button onClick={() => setShowAdmin(true)} className="text-xs text-muted-foreground">
          <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
        </button>
      </div>

      {/* Playlist View or Playlist Detail */}
      {activePlaylist ? (
        <div>
          {/* Back button */}
          <button onClick={() => { setActivePlaylist(null); setPlayingVideoIndex(null); }} className="flex items-center gap-1 mb-4 text-sm text-primary font-medium">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Geri Dön
          </button>

          {/* Playlist header */}
          <div className="rounded-xl border border-primary/10 bg-card p-4 shadow-sm mb-4">
            {activePlaylist.cover_image_url && (
              <img src={activePlaylist.cover_image_url} alt={activePlaylist.title} className="w-full h-40 object-cover rounded-lg mb-3" />
            )}
            <h3 className="text-lg font-bold">{activePlaylist.title}</h3>
            {activePlaylist.description && (
              <p className="text-sm text-muted-foreground mt-1">{activePlaylist.description}</p>
            )}
            {lastWatched[activePlaylist.id] !== undefined && (
              <div className="mt-2 flex items-center gap-2 text-xs text-accent">
                <span className="material-symbols-outlined text-[14px]">history</span>
                <span>Son izlenen: Video {lastWatched[activePlaylist.id] + 1}</span>
              </div>
            )}
          </div>

          {/* YouTube Playlist Embed */}
          <div className="rounded-xl overflow-hidden border border-primary/10 shadow-sm">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/videoseries?list=${activePlaylist.youtube_playlist_id}&rel=0${lastWatched[activePlaylist.id] !== undefined ? `&index=${lastWatched[activePlaylist.id]}` : ""}`}
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={activePlaylist.title}
              />
            </div>
          </div>

          {/* Progress tracking buttons */}
          <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {Array.from({ length: 30 }, (_, i) => (
              <button
                key={i}
                onClick={() => saveVideoProgress(activePlaylist.id, i)}
                className={cn(
                  "shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                  lastWatched[activePlaylist.id] === i
                    ? "bg-accent text-foreground"
                    : i <= (lastWatched[activePlaylist.id] ?? -1)
                      ? "bg-primary/20 text-primary"
                      : "bg-primary/5 text-muted-foreground"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Kaldığınız videoyu işaretleyin</p>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            </div>
          ) : publishedPlaylists.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[48px] text-muted-foreground/30">video_library</span>
              <p className="mt-2 text-sm text-muted-foreground">Henüz video listesi eklenmedi</p>
              <p className="text-xs text-muted-foreground mt-1">Admin panelinden ekleyebilirsiniz</p>
            </div>
          ) : (
            <div className="space-y-3">
              {publishedPlaylists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePlaylist(p)}
                  className="w-full text-left rounded-xl border border-primary/10 bg-card overflow-hidden shadow-sm transition-colors hover:bg-primary/5"
                >
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.title} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-primary/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[48px] text-primary/20">playlist_play</span>
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">{p.title}</h4>
                      {lastWatched[p.id] !== undefined && (
                        <span className="flex items-center gap-1 text-[10px] text-accent">
                          <span className="material-symbols-outlined text-[12px]">play_circle</span>
                          Video {lastWatched[p.id] + 1}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                </button>
              )))}
            </div>
          )}
        </>
      )}

      {/* Admin Password Modal */}
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
              <button onClick={() => { setShowAdmin(false); setAdminPassword(""); }} className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm">İptal</button>
              <button
                onClick={() => { if (adminPassword === ADMIN_PASSWORD) setAdminAuthed(true); }}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground font-bold"
              >
                Giriş
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showAdmin && adminAuthed && (
        <div className="fixed inset-0 z-50 overflow-auto bg-background">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/10 bg-card px-4 py-3">
            <h3 className="text-lg font-bold">Video Yönetimi</h3>
            <button onClick={() => { setShowAdmin(false); setAdminAuthed(false); resetForm(); }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Add/Edit form */}
            <div className="rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
              <h4 className="text-sm font-bold mb-3">
                {editingId ? "Listeyi Düzenle" : "Yeni Video Listesi Ekle"}
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Başlık *</label>
                  <input
                    placeholder="Örn: Ok Takipli Hatim"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">YouTube Playlist Linki *</label>
                  <input
                    placeholder="https://youtube.com/playlist?list=PL..."
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm mt-1"
                  />
                  {formUrl && extractPlaylistId(formUrl) && (
                    <p className="text-[10px] text-primary mt-1">
                      ✓ Playlist ID: {extractPlaylistId(formUrl)}
                    </p>
                  )}
                  {formUrl && !extractPlaylistId(formUrl) && (
                    <p className="text-[10px] text-destructive mt-1">
                      ✗ Geçerli bir YouTube playlist linki girin
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Açıklama</label>
                  <textarea
                    placeholder="Liste hakkında kısa açıklama..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm mt-1 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kapak Görseli</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormCoverFile(e.target.files?.[0] || null)}
                    className="w-full text-sm mt-1"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {editingId && (
                    <button onClick={resetForm} className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm">
                      İptal
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || !formTitle.trim() || !extractPlaylistId(formUrl)}
                    className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
                  >
                    {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Yayınla"}
                  </button>
                </div>
              </div>
            </div>

            {/* Existing playlists */}
            <div>
              <h4 className="text-sm font-bold mb-3">Mevcut Listeler ({playlists.length})</h4>
              <div className="space-y-2">
                {playlists.map((p) => (
                  <div key={p.id} className="rounded-xl border border-primary/10 bg-card p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary/30">playlist_play</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.youtube_playlist_id}</p>
                      </div>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", p.is_published ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                        {p.is_published ? "Yayında" : "Taslak"}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2 pt-2 border-t border-primary/5">
                      <button onClick={() => startEdit(p)} className="flex-1 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                        Düzenle
                      </button>
                      <button onClick={() => togglePublish(p.id, p.is_published)} className="flex-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
                        {p.is_published ? "Gizle" : "Yayınla"}
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
