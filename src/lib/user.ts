import { supabase } from "@/integrations/supabase/client";

/**
 * Gets or creates a stable user identity.
 * On mobile/native, we attempt to use device info if available.
 * Otherwise, we use a robust fingerprinting method + localStorage.
 */
export async function getStableUserId(): Promise<string> {
  const cachedId = localStorage.getItem("ikra_stable_id");
  if (cachedId) return cachedId;

  // Attempt to generate a fingerprint
  const fingerprint = [
    navigator.userAgent,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.language
  ].join("|");
  
  // Use a simple hash or just random UUID for the unique part
  const randomPart = crypto.randomUUID();
  const stableId = `user_${btoa(fingerprint).slice(0, 8)}_${randomPart}`;
  
  localStorage.setItem("ikra_stable_id", stableId);
  return stableId;
}

/**
 * Syncs the current user profile (name, city) with Supabase based on the stable ID.
 */
export async function syncUserProfile(name: string, city: string) {
  const userId = await getStableUserId();
  
  try {
    const { error } = await supabase
      .from("user_profiles")
      .upsert({ 
        device_id: userId, 
        full_name: name, 
        city: city,
        last_active: new Date().toISOString()
      }, { onConflict: "device_id" });
      
    if (error) console.error("Profile sync error:", error);
  } catch (e) {
    console.error("Profile sync exception:", e);
  }
}
