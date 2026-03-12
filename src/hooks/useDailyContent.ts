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

    const fetchContent = async () => {
      setLoading(true);

      // Try today's content first
      const { data } = await supabase
        .from("daily_content")
        .select("*")
        .eq("date", today);

      if (data && data.length > 0) {
        setAyet(data.find((d) => d.type === "ayet") || null);
        setHadis(data.find((d) => d.type === "hadis") || null);
        setLoading(false);
        return;
      }

      // Fallback: get most recent content (for days without specific content)
      const { data: recentAyet } = await supabase
        .from("daily_content")
        .select("*")
        .eq("type", "ayet")
        .lte("date", today)
        .order("date", { ascending: false })
        .limit(1);

      const { data: recentHadis } = await supabase
        .from("daily_content")
        .select("*")
        .eq("type", "hadis")
        .lte("date", today)
        .order("date", { ascending: false })
        .limit(1);

      if (recentAyet && recentAyet.length > 0) setAyet(recentAyet[0]);
      if (recentHadis && recentHadis.length > 0) setHadis(recentHadis[0]);

      setLoading(false);
    };

    fetchContent();
  }, []);

  return { ayet, hadis, loading };
}
