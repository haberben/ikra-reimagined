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
      const { data } = await supabase
        .from("daily_content")
        .select("*")
        .eq("date", today);

      if (data) {
        setAyet(data.find((d) => d.type === "ayet") || null);
        setHadis(data.find((d) => d.type === "hadis") || null);
      }
      setLoading(false);
    };

    fetchContent();
  }, []);

  return { ayet, hadis, loading };
}
