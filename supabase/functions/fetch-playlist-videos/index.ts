import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user is admin/moderator
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Auth failed");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"]);
    if (!roleData || roleData.length === 0) throw new Error("Not authorized");

    const { playlistId, youtubePlaylistId } = await req.json();
    if (!playlistId || !youtubePlaylistId) throw new Error("Missing playlist info");

    // Fetch YouTube RSS feed
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${youtubePlaylistId}`;
    const rssResponse = await fetch(rssUrl);
    if (!rssResponse.ok) throw new Error("Failed to fetch YouTube RSS feed");
    const rssText = await rssResponse.text();

    // Parse video entries from RSS XML
    const entries: { videoId: string; title: string; thumbnail: string }[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(rssText)) !== null) {
      const entry = match[1];
      const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>(.*?)<\/title>/);
      if (videoIdMatch && titleMatch) {
        const videoId = videoIdMatch[1];
        entries.push({
          videoId,
          title: titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
          thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        });
      }
    }

    if (entries.length === 0) throw new Error("No videos found in playlist");

    // Note: RSS returns newest first, reverse for chronological order
    entries.reverse();

    // Upsert videos
    const videosToInsert = entries.map((e, i) => ({
      playlist_id: playlistId,
      youtube_video_id: e.videoId,
      title: e.title,
      thumbnail_url: e.thumbnail,
      sort_order: i,
    }));

    // Delete old videos and insert fresh
    await adminClient.from("playlist_videos").delete().eq("playlist_id", playlistId);
    const { error: insertError } = await adminClient.from("playlist_videos").insert(videosToInsert);
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, count: entries.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
