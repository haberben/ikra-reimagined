import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }).auth.getUser();
    
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) throw new Error("Admin access required");

    const { arabic_text, turkish_text, source, type, style } = await req.json();

    const styleDesc = style || "dark elegant";
    const prompt = `Create a beautiful Islamic phone wallpaper (9:16 portrait ratio, 1080x1920). 
Style: ${styleDesc} background with luxurious golden calligraphy effects, subtle golden shimmer and light reflections.
The wallpaper should have:
- A rich, sophisticated background (dark green, deep black, or midnight blue)
- Elegant golden ornamental Islamic geometric patterns as subtle borders
- The Arabic text "${arabic_text}" written in beautiful golden Thuluth or Naskh calligraphy style at the center, with a golden glow effect
- Below the Arabic text, the Turkish translation "${turkish_text}" in a smaller, elegant white or cream serif font
- ${source ? `Source attribution "${source}" in small golden text at the bottom` : ""}
- Subtle golden light rays and bokeh effects for depth
- Overall feeling: majestic, spiritual, serene
Do NOT include any human figures. Make the text clearly readable.`;

    console.log("Generating wallpaper with prompt:", prompt.substring(0, 100));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit aşıldı, lütfen biraz bekleyin." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredi yetersiz." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error("No image generated");
    }

    // Extract base64 and upload to storage
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `wp_${type}_${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("wallpapers")
      .upload(fileName, imageBytes, { contentType: "image/png" });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("wallpapers").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // Insert into wallpapers table
    const category = type === "ayet" ? "Günün Ayeti" : "Hadis-i Şerifler";
    const { error: insertError } = await supabase.from("wallpapers").insert({
      arabic_text: arabic_text || null,
      turkish_text: turkish_text || null,
      category,
      image_url: publicUrl,
      sort_order: 0,
      created_by_user_id: user.id,
    });

    if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

    return new Response(JSON.stringify({ 
      success: true, 
      image_url: publicUrl,
      message: "Wallpaper başarıyla oluşturuldu!" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-wallpaper error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
