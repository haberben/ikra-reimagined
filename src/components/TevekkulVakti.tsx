import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TevekkulData {
  id: string;
  content_text: string;
  source: string | null;
}

export function TevekkulVakti() {
  const [content, setContent] = useState<TevekkulData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already opened the daily quote
    const lastOpened = localStorage.getItem("ikra_tevekkul_opened");
    const today = new Date().toISOString().split("T")[0];

    const fetchQuote = async () => {
      try {
        const { data, error } = await supabase
          .from("tevekkul_vakti")
          .select("*");
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // In a real app, this could be strictly controlled by the date, 
          // but for now randomly select one so it's fresh every time we need one
          const randomItem = data[Math.floor(Math.random() * data.length)];
          setContent(randomItem);
        }
      } catch (err) {
        console.error("Tevekkül Vakti alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  const handleOpenClick = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("ikra_tevekkul_opened", today);
    setIsOpen(true);
  };

  const handleShare = async () => {
    if (!content) return;
    
    const textToShare = `✨ Tevekkül Vakti ✨\n\n"${content.content_text}"\n${content.source ? `\n— ${content.source}` : ""}\n\n🕌 İKRA Uygulaması`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tevekkül Vakti", text: textToShare });
      } catch (e) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(textToShare);
      toast.success("Panoya kopyalandı!");
    }
  };

  if (loading || !content) return null;

  return (
    <>
      <div className="px-4 mt-8 mb-4">
        {/* The Trigger Box */}
        <button 
          onClick={handleOpenClick}
          className="relative overflow-hidden w-full group rounded-2xl bg-gradient-to-r from-teal-600/20 via-teal-500/10 to-transparent border border-teal-500/20 p-5 text-left transition-all hover:border-teal-500/40">
           
           <div className="absolute top-0 right-0 -mt-4 -mr-4 text-teal-800/10 group-hover:text-teal-800/20 transition-colors">
              <span className="material-symbols-outlined text-[100px]">filter_vintage</span>
           </div>

           <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-600 animate-pulse">
                <span className="material-symbols-outlined pb-1">auto_awesome</span>
              </div>
              <div>
                 <h3 className="text-base font-bold text-teal-600 mb-0.5">Tevekkül Vakti</h3>
                 <p className="text-xs text-foreground/70 font-medium">Bugün senin için özel bir mesaj var, okumak için tıkla.</p>
              </div>
           </div>
        </button>
      </div>

      {/* The Fullscreen Modal Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
           <div className="absolute top-8 right-8">
              <button onClick={() => setIsOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary text-foreground transition-colors">
                 <span className="material-symbols-outlined">close</span>
              </button>
           </div>
           
           <div className="w-full max-w-sm text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/10 text-teal-500 mb-8 ring-4 ring-teal-500/5 shadow-2xl">
                 <span className="material-symbols-outlined text-[40px]">spa</span>
              </div>
              
              <h2 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-8">Tevekkül Vakti</h2>
              
              <p className="text-2xl font-serif leading-snug text-foreground mx-auto relative">
                <span className="absolute -top-6 -left-4 text-6xl text-teal-500/20 font-serif">"</span>
                {content.content_text}
                <span className="absolute -bottom-8 -right-4 text-6xl text-teal-500/20 font-serif rotate-180">"</span>
              </p>
              
              {content.source && (
                 <p className="mt-8 text-sm italic py-2 border-t border-b border-teal-500/10 text-muted-foreground font-medium inline-block px-12">
                   — {content.source}
                 </p>
              )}

              <div className="mt-16">
                 <button onClick={handleShare} className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-teal-600/10 hover:bg-teal-600/20 border border-teal-600/20 px-8 py-4 text-sm font-bold text-teal-600 transition-all active:scale-95 shadow-lg shadow-teal-500/5">
                    <span className="material-symbols-outlined">share</span>
                    Bu Güzelliği Paylaş
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}
