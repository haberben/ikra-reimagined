import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DailyContent {
  id: string;
  arabic_text: string;
  turkish_text: string;
  source: string | null;
  type: string;
  date: string;
  contributor_name?: string | null;
}

export function useDailyContent() {
  const [ayet, setAyet] = useState<DailyContent | null>(null);
  const [hadis, setHadis] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    // Day-of-year index for consistent daily rotation
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);

    const fetchContent = async () => {
      setLoading(true);

      // Try today's date-specific content first
      const { data } = await supabase
        .from("daily_content")
        .select("*")
        .eq("date", today);

      if (data && data.length > 0) {
        const d_ayet = data.find((d) => d.type === "ayet");
        const d_hadis = data.find((d) => d.type === "hadis");
        if (d_ayet) {
          setAyet(d_ayet);
          localStorage.setItem("ikra_daily_ayet", d_ayet.turkish_text);
        }
        if (d_hadis) {
          setHadis(d_hadis);
          localStorage.setItem("ikra_daily_hadis", d_hadis.turkish_text);
        }
        setLoading(false);
        return;
      }

      // Fallback: fetch ALL records and rotate by day (covers dateless seed records)
      const { data: allAyets } = await supabase
        .from("daily_content")
        .select("*")
        .eq("type", "ayet")
        .order("created_at", { ascending: true });

      const { data: allHadis } = await supabase
        .from("daily_content")
        .select("*")
        .eq("type", "hadis")
        .order("created_at", { ascending: true });

      if (allAyets && allAyets.length > 0) {
        const item = allAyets[dayOfYear % allAyets.length];
        setAyet(item);
        localStorage.setItem("ikra_daily_ayet", item.turkish_text);
      }
      if (allHadis && allHadis.length > 0) {
        const item = allHadis[dayOfYear % allHadis.length];
        setHadis(item);
        localStorage.setItem("ikra_daily_hadis", item.turkish_text);
      }

      setLoading(false);
    };

    fetchContent();
  }, []);

  return { ayet, hadis, loading };
}
