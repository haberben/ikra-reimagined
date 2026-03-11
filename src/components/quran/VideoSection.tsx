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
  contributor_name?: string | null;
}

interface PlaylistVideo {
  id: string;
  playlist_id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  sort_order: number;
}

export default function VideoSection() {
  const [playlists, setPlaylists] = useState<VideoPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlaylist, setActivePlaylist] = useState<VideoPlaylist | null>(null);
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Per-video progress: { [playlistId]: videoId }
  const [lastWatched, setLastWatched] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_video_progress_v2") || "{}"); } catch { return {}; }
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

  const fetchVideos = async (playlistId: string) => {
    setLoadingVideos(true);
    const { data } = await supabase
      .from("playlist_videos")
      .select("*")
      .eq("playlist_id", playlistId)
      .order("sort_order", { ascending: true });
    if (data) {
      setVideos(data as PlaylistVideo[]);
      // If there's a last watched video, set it as active; otherwise first video
      const lastId = lastWatched[playlistId];
      if (lastId && data.some((v: any) => v.youtube_video_id === lastId)) {
        setActiveVideoId(lastId);
      } else if (data.length > 0) {
        setActiveVideoId((data[0] as PlaylistVideo).youtube_video_id);
      }
    }
    setLoadingVideos(false);
  };

  const openPlaylist = (p: VideoPlaylist) => {
    setActivePlaylist(p);
    setVideos([]);
    setActiveVideoId(null);
    fetchVideos(p.id);
  };

  const selectVideo = (videoId: string, playlistId: string) => {
    setActiveVideoId(videoId);
    const updated = { ...lastWatched, [playlistId]: videoId };
    setLastWatched(updated);
    localStorage.setItem("ikra_video_progress_v2", JSON.stringify(updated));
  };

  const publishedPlaylists = playlists.filter((p) => p.is_published);

  const getLastWatchedVideoTitle = (playlistId: string) => {
    // This needs videos loaded, so we use a simple approach
    return lastWatched[playlistId] ? "Devam et" : null;
  };

  return (
    <div className="px-4 pt-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Video Listeleri</h3>

      {activePlaylist ? (
        <div>
          <button onClick={() => { setActivePlaylist(null); setVideos([]); setActiveVideoId(null); }} className="flex items-center gap-1 mb-4 text-sm text-primary font-medium">
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
            {videos.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{videos.length} video</p>
            )}
          </div>

          {loadingVideos ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-[40px] text-muted-foreground/30">video_library</span>
              <p className="mt-2 text-sm text-muted-foreground">Henüz video eklenmedi</p>
              <p className="text-xs text-muted-foreground mt-1">Admin panelinden videoları senkronlayın</p>
            </div>
          ) : (
            <>
              {/* Active video player */}
              {activeVideoId && (
                <div className="rounded-xl overflow-hidden border border-primary/10 shadow-sm mb-4">
                  <div className="aspect-video">
                    <iframe
                      key={activeVideoId}
                      src={`https://www.youtube.com/embed/${activeVideoId}?rel=0`}
                      className="h-full w-full"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      title={videos.find(v => v.youtube_video_id === activeVideoId)?.title || ""}
                    />
                  </div>
                  <div className="p-3 bg-card">
                    <p className="text-sm font-bold line-clamp-2">
                      {videos.find(v => v.youtube_video_id === activeVideoId)?.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Video {(videos.findIndex(v => v.youtube_video_id === activeVideoId) + 1)} / {videos.length}
                    </p>
                  </div>
                </div>
              )}

              {/* Video list */}
              <div className="space-y-2">
                {videos.map((video, index) => {
                  const isActive = video.youtube_video_id === activeVideoId;
                  const isWatched = lastWatched[activePlaylist.id] === video.youtube_video_id;
                  return (
                    <button
                      key={video.id}
                      onClick={() => selectVideo(video.youtube_video_id, activePlaylist.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-primary/10 bg-card hover:bg-primary/5"
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="relative shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-muted">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-muted-foreground/30">smart_display</span>
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="material-symbols-outlined text-white text-[24px]">play_arrow</span>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <span className={cn(
                            "shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                            isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                          )}>
                            {index + 1}
                          </span>
                          <p className={cn(
                            "text-xs font-medium line-clamp-2 leading-snug",
                            isActive && "text-primary font-bold"
                          )}>
                            {video.title}
                          </p>
                        </div>
                        {isWatched && !isActive && (
                          <div className="flex items-center gap-1 mt-1.5 ml-8">
                            <span className="material-symbols-outlined text-[12px] text-accent">bookmark</span>
                            <span className="text-[10px] text-accent font-medium">Kaldığınız yer</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
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
                  onClick={() => openPlaylist(p)}
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
                      {lastWatched[p.id] && (
                        <span className="flex items-center gap-1 text-[10px] text-accent">
                          <span className="material-symbols-outlined text-[12px]">bookmark</span>
                          Devam et
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
