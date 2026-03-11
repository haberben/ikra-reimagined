import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from("favorites")
        .select("item_id")
        .eq("user_id", session.user.id);
      if (data) setFavoriteIds(new Set(data.map(f => f.item_id)));
    };
    load();
  }, []);

  const toggleFavorite = useCallback(async (itemId: string, itemType: string) => {
    if (!userId) return false;
    const isFav = favoriteIds.has(itemId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", userId).eq("item_id", itemId);
      setFavoriteIds(prev => { const s = new Set(prev); s.delete(itemId); return s; });
    } else {
      await supabase.from("favorites").insert({ user_id: userId, item_id: itemId, item_type: itemType });
      setFavoriteIds(prev => new Set(prev).add(itemId));
    }
    return !isFav;
  }, [userId, favoriteIds]);

  const isFavorite = useCallback((itemId: string) => favoriteIds.has(itemId), [favoriteIds]);

  return { toggleFavorite, isFavorite, isLoggedIn: !!userId };
}
