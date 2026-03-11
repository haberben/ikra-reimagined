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

export default function VideoSection() {
  const [playlists, setPlaylists] = useState<VideoPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlaylist, setActivePlaylist] = useState<VideoPlaylist | null>(null);

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

  const saveVideoProgress = (playlistId: string, videoIndex: number) => {
    const updated = { ...lastWatched, [playlistId]: videoIndex };
    setLastWatched(updated);
    localStorage.setItem("ikra_video_progress", JSON.stringify(updated));
  };

  const publishedPlaylists = playlists.filter((p) => p.is_published);

  return (
    <div className="px-4 pt-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Video Listeleri</h3>

      {activePlaylist ? (
        <div>
          <button onClick={() => setActivePlaylist(null)} className="flex items-center gap-1 mb-4 text-sm text-primary font-medium">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Geri Dön
          </button>

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
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
