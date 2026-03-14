import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface IslamicFact {
  id: string;
  fact_text: string;
  source: string | null;
}

export function DailyFactCard() {
  const [fact, setFact] = useState<IslamicFact | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed today
    const lastDismissed = localStorage.getItem("ikra_fact_dismissed_date");
    const today = new Date().toISOString().split("T")[0];
    if (lastDismissed === today) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    const fetchFact = async () => {
      try {
        const { data, error } = await supabase
          .from("islamic_facts" as any)
          .select("*");
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Select a random fact for today
          const randomFact = data[Math.floor(Math.random() * data.length)] as any;
          setFact(randomFact);
        }
      } catch (err) {
        console.error("Bilgi çekilemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFact();
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("ikra_fact_dismissed_date", today);
    setDismissed(true);
  };

  if (loading || dismissed || !fact) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 mt-4 mb-2 shadow-sm animate-fade-in">
      <div className="absolute top-0 right-0 p-3">
         <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
         </button>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <span className="material-symbols-outlined text-[24px]">lightbulb</span>
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight text-primary mb-1">
            BUNU BİLİYOR MUYDUNUZ?
          </h3>
          <p className="text-sm text-foreground/90 leading-relaxed font-medium">
            {fact.fact_text}
          </p>
          {fact.source && (
            <p className="mt-2 text-xs text-muted-foreground font-medium italic">
              — {fact.source}
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex justify-end gap-2">
         {/* Share button can be added here easily */}
         <button 
           onClick={() => {
              if (navigator.share) {
                  navigator.share({
                      title: "İKRA - İslam Bilgisi",
                      text: fact.fact_text,
                  });
              } else {
                  toast.success("Bilgi kopyalandı!");
                  navigator.clipboard.writeText(fact.fact_text);
              }
           }}
           className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-lg">
            <span className="material-symbols-outlined text-[16px]">share</span>
            Paylaş
         </button>
      </div>
    </div>
  );
}
