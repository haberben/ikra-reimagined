import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const MOODS = [
  { id: "Üzgün", label: "Üzgün", icon: "sentiment_sad", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "Stresli", label: "Stresli", icon: "mood_bad", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "Şükreden", label: "Şükreden", icon: "volunteer_activism", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  { id: "Kararsız", label: "Kararsız", icon: "device_unknown", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "Yalnız", label: "Yalnız", icon: "person", color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" },
  { id: "Öfkeli", label: "Öfkeli", icon: "local_fire_department", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
];

export function MoodDiscovery() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleMoodSelect = async (moodId: string) => {
    setSelectedMood(moodId);
    setLoading(true);
    setContent(null);

    try {
      const { data, error } = await supabase
        .from("mood_contents" as any)
        .select("*")
        .eq("mood", moodId);

      if (error) throw error;

      if (data && data.length > 0) {
        // Pick a random one
        const randomItem = data[Math.floor(Math.random() * data.length)];
        setContent(randomItem);
      }
    } catch (err) {
      console.error("Duygu durumu içerikleri çekilemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 mb-4">
      <div className="flex items-center gap-2 mb-3 px-4">
        <span className="material-symbols-outlined text-primary text-[20px]">self_improvement</span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Nasıl Hissediyorsunuz?</h3>
      </div>

      {/* Mood Selector Chips */}
      <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide">
        {MOODS.map((m) => {
          const isSelected = selectedMood === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleMoodSelect(m.id)}
              className={cn(
                "flex shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 transition-all",
                isSelected
                  ? `bg-primary text-primary-foreground border-primary shadow-md scale-105`
                  : `bg-card text-foreground ${m.border} ${m.bg} hover:border-primary/40`
              )}
            >
              <span className={cn("material-symbols-outlined text-[18px]", isSelected ? "text-primary-foreground" : m.color)}>
                {m.icon}
              </span>
              <span className="text-sm font-bold">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Display Area */}
      {selectedMood && (
        <div className="px-4 mt-4 animate-fade-in">
          {loading ? (
            <div className="rounded-xl border border-primary/10 bg-card p-6 flex justify-center items-center shadow-sm">
              <span className="material-symbols-outlined animate-spin text-primary text-[28px]">sync</span>
            </div>
          ) : content ? (
            <div className="relative rounded-2xl border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent p-5 shadow-sm">
              <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest text-primary/60 bg-primary/10 px-2 py-1 rounded-full">
                {content.type === "ayet" ? "Ayet-i Kerime" : "Hadis-i Şerif"}
              </span>

              {content.arabic_text && (
                 <p className="mt-6 font-arabic text-xl leading-loose text-foreground" dir="rtl">
                   {content.arabic_text}
                 </p>
              )}
              
              <p className={cn("text-sm font-medium leading-relaxed text-foreground/90", content.arabic_text ? "mt-4" : "mt-6")}>
                "{content.turkish_text}"
              </p>
              
              {content.source && (
                <p className="mt-3 text-xs font-medium italic text-muted-foreground text-right border-t border-primary/10 pt-3">
                  — {content.source}
                </p>
              )}

              {/* Retry Button to get another verse for the same mood */}
              <div className="mt-4 flex justify-end">
                 <button 
                  onClick={(e) => { e.stopPropagation(); handleMoodSelect(selectedMood); }}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  Farklı Göster
                 </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-primary/10 bg-card p-6 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Bu duygu durumu için henüz bir içerik bulunamadı.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
