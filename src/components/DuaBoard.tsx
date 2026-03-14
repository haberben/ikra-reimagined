import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface DuaRequest {
  id: string;
  user_id: string;
  prayer_text: string;
  is_approved: boolean;
  created_at: string;
  reaction_count?: number;
  has_reacted?: boolean;
  profiles?: { full_name: string | null; avatar_url: string | null; } | null;
}

export function DuaBoard() {
  const [duas, setDuas] = useState<DuaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDuaText, setNewDuaText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    fetchDuas();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUserId(session.user.id);
  };

  const fetchDuas = async () => {
    setLoading(true);
    try {
      // 1. Get approved duas
      const { data: requestsData, error: reqError } = await supabase
        .from("dua_requests" as any)
        .select(`
          id, user_id, prayer_text, is_approved, created_at
        `)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (reqError) throw reqError;

      const requestIds = (requestsData as any[])?.map((r: any) => r.id) || [];
      
      let allReactions: any[] = [];
      if (requestIds.length > 0) {
         const { data: rxData } = await supabase
           .from("dua_reactions" as any)
           .select("request_id, user_id")
           .in("request_id", requestIds);
         allReactions = (rxData as any[]) || [];
      }

      const enriched = ((requestsData as any[]) || []).map((r: any) => {
        const reactionsForThis = allReactions.filter(x => x.request_id === r.id);
        const hasReacted = currentUserId ? reactionsForThis.some(x => x.user_id === currentUserId) : false;
        
        return {
          ...r,
          reaction_count: reactionsForThis.length,
          has_reacted: hasReacted
        };
      });

      setDuas(enriched);
    } catch (err) {
      console.error("Dualar yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUserId) {
      toast.error("Dua isteğinde bulunmak için giriş yapmalısınız.");
      return;
    }
    if (!newDuaText.trim()) return;

    if (newDuaText.trim().length > 500) {
      toast.error("Dua isteği çok uzun (Maks. 500 karakter)");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("dua_requests" as any).insert({
        user_id: currentUserId,
        prayer_text: newDuaText.trim(),
        is_approved: false // explicit
      });

      if (error) throw error;
      
      toast.success("Dua isteğiniz alındı. Onaylandıktan sonra panoda yayınlanacaktır. 🤲");
      setNewDuaText("");
    } catch (error: any) {
      toast.error("Gönderilemedi: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleReaction = async (duaId: string, hasReacted: boolean) => {
    if (!currentUserId) {
      toast.error("Amin demek için giriş yapmalısınız.");
      return;
    }

    // Optimistic UI update
    setDuas(prev => prev.map(d => {
      if (d.id === duaId) {
        return {
          ...d,
          has_reacted: !hasReacted,
          reaction_count: (d.reaction_count || 0) + (hasReacted ? -1 : 1)
        };
      }
      return d;
    }));

    try {
      if (hasReacted) {
        // Remove reaction
        await supabase.from("dua_reactions")
          .delete()
          .eq("request_id", duaId)
          .eq("user_id", currentUserId);
      } else {
        // Add reaction
        await supabase.from("dua_reactions")
          .insert({ request_id: duaId, user_id: currentUserId });
      }
    } catch (e) {
      console.error("Reaksiyon hatası", e);
      // Revert on real error (for robustness could refetch)
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: tr });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col min-h-[50vh]">
      {/* Header Info */}
      <div className="px-4 py-6 bg-primary/5 mb-4 border-b border-primary/10">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
           <span className="material-symbols-outlined text-primary text-[28px]">diversity_1</span>
           Dua Kardeşliği
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
           "Müslümanın, din kardeşine gıyabında yaptığı dua kabul olunur." <br/>
           <span className="text-[11px] opacity-70">(Müslim, Zikir 87)</span>
        </p>
      </div>

      {/* Submit Input */}
      <div className="px-4 mb-8">
        <div className="bg-card border border-primary/20 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
             <span className="material-symbols-outlined text-[120px]">mosque</span>
          </div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
             <span className="material-symbols-outlined text-primary text-[18px]">edit_note</span>
             Dua İsteğinde Bulun
          </h3>
          <textarea
            value={newDuaText}
            onChange={(e) => setNewDuaText(e.target.value)}
            placeholder="Kendiniz veya sevdikleriniz için dua isteyin..."
            rows={3}
            className="w-full bg-background/50 border border-primary/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 relative z-10"
          />
          <div className="flex justify-between items-center mt-3 relative z-10">
            <span className="text-[10px] text-muted-foreground font-medium">
               Maks. 500 karakter. Dualar admin onayından sonra yayınlanır.
            </span>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !newDuaText.trim() || newDuaText.length > 500}
              className="bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 transition-all hover:bg-primary/90 flex items-center gap-2"
            >
              {isSubmitting ? "Gönderiliyor..." : "Gönder"}
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </div>
        </div>
      </div>

      {/* The List of Duas */}
      <div className="px-4 flex-1 pb-24">
         <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[20px]">forum</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Topluluk Duaları</h3>
         </div>

         {loading ? (
           <div className="py-12 flex justify-center">
             <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
           </div>
         ) : duas.length === 0 ? (
           <div className="py-12 text-center text-muted-foreground border border-dashed border-primary/20 rounded-2xl bg-primary/5">
             <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">volunteer_activism</span>
             <p className="text-sm font-medium">Henüz yayınlanmış bir dua isteği yok.</p>
             <p className="text-xs mt-1">İlk dua isteğinde bulunan sen ol!</p>
           </div>
         ) : (
           <div className="space-y-4">
             {duas.map((dua) => (
               <div key={dua.id} className="bg-card border border-primary/10 rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-colors group">
                 <div className="flex items-start justify-between gap-4">
                   <div className="flex-1">
                     <div className="flex items-center justify-between mb-2 pb-2 border-b border-primary/5">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                             {dua.profiles?.full_name ? dua.profiles.full_name.charAt(0) : "K"}
                           </div>
                           <span className="text-xs font-bold text-foreground/80">
                             {dua.profiles?.full_name || "Gizli Kardeşin"}
                           </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{getTimeAgo(dua.created_at)}</span>
                     </div>
                     <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                       "{dua.prayer_text}"
                     </p>
                   </div>
                 </div>

                 <div className="mt-4 pt-3 flex items-center justify-end border-t border-primary/5">
                   <button 
                     onClick={() => handleToggleReaction(dua.id, !!dua.has_reacted)}
                     className={cn(
                       "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                       dua.has_reacted 
                         ? "bg-primary text-primary-foreground shadow-md scale-105" 
                         : "bg-secondary text-foreground hover:bg-primary/10"
                     )}>
                     <span className="material-symbols-outlined text-[16px]">{dua.has_reacted ? "volunteer_activism" : "favorite_border"}</span>
                     Dua Ettim 
                     {dua.reaction_count !== undefined && dua.reaction_count > 0 && (
                        <span className="ml-1 opacity-80 border-l border-current pl-2">{dua.reaction_count}</span>
                     )}
                   </button>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
