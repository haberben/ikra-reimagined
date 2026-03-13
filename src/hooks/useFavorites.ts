import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any;

    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from("favorites")
          .select("item_id")
          .eq("user_id", session.user.id);
        if (data) setFavoriteIds(new Set(data.map(f => f.item_id)));
      } else {
        setUserId(null);
        setFavoriteIds(new Set());
      }
    };

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserId(session.user.id);
        loadSession();
      } else {
        setUserId(null);
        setFavoriteIds(new Set());
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  const toggleFavorite = useCallback(async (itemId: string, itemType: string) => {
    if (!userId) {
      toast.error("Favorilere eklemek için lütfen giriş yapın");
      window.dispatchEvent(new CustomEvent("open-profile"));
      return false;
    }
    const isFav = favoriteIds.has(itemId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", userId).eq("item_id", itemId);
      setFavoriteIds(prev => { const s = new Set(prev); s.delete(itemId); return s; });
      toast.success("Favorilerden çıkarıldı");
    } else {
      await supabase.from("favorites").insert({ user_id: userId, item_id: itemId, item_type: itemType });
      setFavoriteIds(prev => new Set(prev).add(itemId));
      toast.success("Favorilere eklendi");
    }
    return !isFav;
  }, [userId, favoriteIds]);

  const isFavorite = useCallback((itemId: string) => favoriteIds.has(itemId), [favoriteIds]);

  return { toggleFavorite, isFavorite, isLoggedIn: !!userId };
}
