import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Load YouTube IFrame API once
let ytApiLoaded = false;
let ytApiPromise: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if (ytApiLoaded && window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (window.YT?.Player) { ytApiLoaded = true; resolve(); return; }
    const existing = document.getElementById("yt-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      prev?.();
      resolve();
    };
    // If API already loaded between checks
    const check = setInterval(() => {
      if (window.YT?.Player) { ytApiLoaded = true; clearInterval(check); resolve(); }
    }, 200);
    setTimeout(() => clearInterval(check), 10000);
  });
  return ytApiPromise;
}

declare global {
  interface Window { YT: any; }
}

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
  const [searchQuery, setSearchQuery] = useState("");

  // Per-video progress: { [playlistId]: videoId }
  const [lastWatched, setLastWatched] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_video_progress_v2") || "{}"); } catch { return {}; }
  });

  // Watched videos: { [playlistId]: string[] of videoIds }
  const [watchedVideos, setWatchedVideos] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem("ikra_watched_videos") || "{}"); } catch { return {}; }
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
    setSearchQuery("");
    fetchVideos(p.id);
  };

  const selectVideo = (videoId: string, playlistId: string) => {
    setActiveVideoId(videoId);
    const updated = { ...lastWatched, [playlistId]: videoId };
    setLastWatched(updated);
    localStorage.setItem("ikra_video_progress_v2", JSON.stringify(updated));
  };

  const toggleWatched = (e: React.MouseEvent, videoId: string, playlistId: string) => {
    e.stopPropagation();
    const current = watchedVideos[playlistId] || [];
    const isWatched = current.includes(videoId);
    const updated = {
      ...watchedVideos,
      [playlistId]: isWatched
        ? current.filter((id) => id !== videoId)
        : [...current, videoId],
    };
    setWatchedVideos(updated);
    localStorage.setItem("ikra_watched_videos", JSON.stringify(updated));
  };

  const isVideoWatched = (videoId: string, playlistId: string) => {
    return (watchedVideos[playlistId] || []).includes(videoId);
  };

  const getWatchedCount = (playlistId: string) => {
    return (watchedVideos[playlistId] || []).length;
  };

  const publishedPlaylists = playlists.filter((p) => p.is_published);

  const filteredVideos = searchQuery.trim()
    ? videos.filter((v) => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : videos;

  return (
    <div className="px-4 pt-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Video Listeleri</h3>

      {activePlaylist ? (
        <div>
          <button onClick={() => { setActivePlaylist(null); setVideos([]); setActiveVideoId(null); setSearchQuery(""); }} className="flex items-center gap-1 mb-4 text-sm text-primary font-medium">
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
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs text-muted-foreground">{videos.length} video</p>
                {getWatchedCount(activePlaylist.id) > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>
                    <span className="text-xs text-primary font-medium">
                      {getWatchedCount(activePlaylist.id)}/{videos.length} izlendi
                    </span>
                  </div>
                )}
              </div>
            )}
            {/* Progress bar */}
            {videos.length > 0 && getWatchedCount(activePlaylist.id) > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-primary/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${(getWatchedCount(activePlaylist.id) / videos.length) * 100}%` }}
                />
              </div>
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
                <VideoPlayer
                  videoId={activeVideoId}
                  videos={videos}
                  playlist={activePlaylist}
                  isVideoWatched={isVideoWatched}
                  toggleWatched={toggleWatched}
                  onNext={() => {
                    const idx = videos.findIndex(v => v.youtube_video_id === activeVideoId);
                    if (idx < videos.length - 1) {
                      const nextVideo = videos[idx + 1];
                      selectVideo(nextVideo.youtube_video_id, activePlaylist.id);
                      // Mark current as watched
                      if (!isVideoWatched(activeVideoId, activePlaylist.id)) {
                        toggleWatched({ stopPropagation: () => {} } as React.MouseEvent, activeVideoId, activePlaylist.id);
                      }
                    }
                  }}
                  onPrev={() => {
                    const idx = videos.findIndex(v => v.youtube_video_id === activeVideoId);
                    if (idx > 0) {
                      selectVideo(videos[idx - 1].youtube_video_id, activePlaylist.id);
                    }
                  }}
                />
              )}

              {/* Search bar */}
              {videos.length > 5 && (
                <div className="relative mb-3">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Video ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl bg-primary/5 py-2.5 pl-9 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <span className="material-symbols-outlined text-muted-foreground text-[18px]">close</span>
                    </button>
                  )}
                </div>
              )}

              {/* Filter chips */}
              {videos.length > 3 && (
                <div className="flex gap-2 mb-3 text-xs">
                  <span className="text-muted-foreground">
                    {filteredVideos.length} video
                    {searchQuery && ` (arama: "${searchQuery}")`}
                  </span>
                </div>
              )}

              {/* Video list */}
              <div className="space-y-2">
                {filteredVideos.map((video, index) => {
                  const isActive = video.youtube_video_id === activeVideoId;
                  const isLastWatched = lastWatched[activePlaylist.id] === video.youtube_video_id;
                  const watched = isVideoWatched(video.youtube_video_id, activePlaylist.id);
                  const originalIndex = videos.findIndex((v) => v.id === video.id);
                  return (
                    <div
                      key={video.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-primary/10 bg-card hover:bg-primary/5"
                      )}
                    >
                      {/* Main clickable area */}
                      <button
                        onClick={() => selectVideo(video.youtube_video_id, activePlaylist.id)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        {/* Thumbnail */}
                        <div className="relative shrink-0 w-24 aspect-video rounded-lg overflow-hidden bg-muted">
                          {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-muted-foreground/30">smart_display</span>
                            </div>
                          )}
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <span className="material-symbols-outlined text-white text-[20px]">play_arrow</span>
                            </div>
                          )}
                          {watched && !isActive && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <span className="material-symbols-outlined text-primary-foreground text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <span className={cn(
                              "shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
                              isActive ? "bg-primary text-primary-foreground" :
                              watched ? "bg-primary/20 text-primary" :
                              "bg-primary/10 text-primary"
                            )}>
                              {originalIndex + 1}
                            </span>
                            <p className={cn(
                              "text-xs font-medium line-clamp-2 leading-snug",
                              isActive && "text-primary font-bold",
                              watched && !isActive && "text-muted-foreground"
                            )}>
                              {video.title}
                            </p>
                          </div>
                          {isLastWatched && !isActive && (
                            <div className="flex items-center gap-1 mt-1 ml-7">
                              <span className="material-symbols-outlined text-[11px] text-accent">bookmark</span>
                              <span className="text-[9px] text-accent font-medium">Kaldığınız yer</span>
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Watch toggle button */}
                      <button
                        onClick={(e) => toggleWatched(e, video.youtube_video_id, activePlaylist.id)}
                        className="shrink-0 p-1.5"
                        title={watched ? "İzlenmedi olarak işaretle" : "İzlendi olarak işaretle"}
                      >
                        <span
                          className={cn(
                            "material-symbols-outlined text-[20px] transition-colors",
                            watched ? "text-primary" : "text-muted-foreground/40"
                          )}
                          style={watched ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                          {watched ? "check_circle" : "radio_button_unchecked"}
                        </span>
                      </button>
                    </div>
                  );
                })}

                {filteredVideos.length === 0 && searchQuery && (
                  <div className="text-center py-6">
                    <span className="material-symbols-outlined text-[32px] text-muted-foreground/30">search_off</span>
                    <p className="text-sm text-muted-foreground mt-1">"{searchQuery}" ile eşleşen video bulunamadı</p>
                  </div>
                )}
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
              {publishedPlaylists.map((p) => {
                const watchedCount = getWatchedCount(p.id);
                return (
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
                        <div className="flex items-center gap-2">
                          {watchedCount > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-primary">
                              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              {watchedCount}
                            </span>
                          )}
                          {lastWatched[p.id] && (
                            <span className="flex items-center gap-1 text-[10px] text-accent">
                              <span className="material-symbols-outlined text-[12px]">bookmark</span>
                              Devam et
                            </span>
                          )}
                        </div>
                      </div>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                      )}
                      {p.contributor_name && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="material-symbols-outlined text-[11px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                          <span className="text-[9px] text-muted-foreground italic">{p.contributor_name} katkısıyla</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
