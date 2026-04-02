import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StickyHeader from "@/components/layout/StickyHeader";
import GoldButton from "@/components/GoldButton";
import { cn } from "@/lib/utils";

interface HatimGroup {
  id: string;
  name: string;
  invite_code: string;
  is_public: boolean;
  created_by: string | null;
  completed_at: string | null;
}

interface JuzSlot {
  id: string;
  juz_number: number;
  claimed_by: string | null;
  claimed_by_name: string | null;
  completed_at: string | null;
  group_id: string;
}

const CUZ_NAMES = [
  "Alif Lam Mim","Sayakul","Tilkal Rusul","Len Tenaalu","Vel Muhsanat",
  "La Yuhibbullah","Ve İza Semi'u","Ve Lev Ennena","Kalellmeleu","Va'lemu",
  "Ya'tezirune","Ve Ma Min Dabbetin","Ve Ma Uberriu","Rubema","Subhanellezi",
  "Kal Elem","İkterabe","Kad Eflaha","Ve Kalellezine","Emmen Halaka",
  "Utlu Ma Uhiye","Ve Men Yaknüt","Ve Mali","Femmen Ezlemu","İleyhi Yureddu",
  "Ha Mim","Kale Femma Hatbuküm","Kad Semi'allah","Tebarekellezi","Amme"
];

interface HatimPageProps {
  onMenuOpen: () => void;
  onNotifications: () => void;
}

export default function HatimPage({ onMenuOpen, onNotifications }: HatimPageProps) {
  const [tab, setTab] = useState<"global" | "ozel">("global");
  const [globalGroup, setGlobalGroup] = useState<HatimGroup | null>(null);
  const [juzSlots, setJuzSlots] = useState<JuzSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState<number | null>(null);
  const [claimName, setClaimName] = useState(localStorage.getItem("ikra_name") || "");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [privateGroups, setPrivateGroups] = useState<HatimGroup[]>([]);
  const [activePrivateGroup, setActivePrivateGroup] = useState<HatimGroup | null>(null);
  const [privateJuz, setPrivateJuz] = useState<JuzSlot[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const userNameValue = localStorage.getItem("ikra_name") || "";
  const [expandedArchive, setExpandedArchive] = useState<string | null>(null);
  const [archivedSlots, setArchivedSlots] = useState<JuzSlot[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<HatimGroup[]>([]);
  const isAdmin = (userNameValue.toLowerCase() === "admin" || localStorage.getItem("ikra_admin") === "true");

  const userId = localStorage.getItem("ikra_user_id") || (() => {
    const id = crypto.randomUUID();
    localStorage.setItem("ikra_user_id", id);
    return id;
  })();

  useEffect(() => {
    loadGlobalHatim();
    loadPrivateGroups();
    loadArchivedHatims();
    if (isAdmin) cleanupOldHatims();
  }, [claimName, isAdmin]);

  const cleanupOldHatims = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    try {
      const { data: oldGroups } = await supabase
        .from("hatim_groups")
        .select("id")
        .eq("is_public", true)
        .lt("completed_at", thirtyDaysAgo.toISOString());

      if (oldGroups && oldGroups.length > 0) {
        const ids = oldGroups.map(g => g.id);
        await supabase.from("hatim_juz").delete().in("group_id", ids);
        await supabase.from("hatim_groups").delete().in("id", ids);
        console.log("Old global hatims cleaned up.");
      }
    } catch {}
  };

  const loadGlobalHatim = async () => {
    setLoading(true);
    // Find the current active (non-completed) public group
    let { data: groups } = await supabase
      .from("hatim_groups").select("*").eq("is_public", true)
      .is("completed_at", null).order("created_at", { ascending: false }).limit(1);
    
    let group = groups?.[0] || null;
    
    // If no active group exists, create one
    if (!group) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: newGroup } = await supabase
        .from("hatim_groups").insert({ name: `Global Hatim #${Date.now().toString().slice(-3)}`, invite_code: code, is_public: true }).select().single();
      group = newGroup;
      if (group) {
        const juzRows = Array.from({ length: 30 }, (_, i) => ({ group_id: group!.id, juz_number: i + 1 }));
        await supabase.from("hatim_juz").insert(juzRows);
      }
    }

    if (group) {
      setGlobalGroup(group);
      await loadJuz(group.id, true);
    }
    setLoading(false);
  };

  const loadArchivedHatims = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data } = await supabase
      .from("hatim_groups")
      .select("*")
      .eq("is_public", true)
      .not("completed_at", "is", null)
      .gt("completed_at", thirtyDaysAgo.toISOString())
      .order("completed_at", { ascending: true }); // Ascending to help calculate sequence
    
    if (data) setArchivedGroups(data);
  };

  const loadJuz = async (groupId: string, setLoadingState: boolean) => {
    if (setLoadingState) setLoading(true);
    const { data } = await supabase.from("hatim_juz").select("*").eq("group_id", groupId).order("juz_number");
    if (data) {
      if (activePrivateGroup?.id === groupId) setPrivateJuz(data);
      else setJuzSlots(data);
    }
    if (setLoadingState) setLoading(false);
  };

  const loadPrivateGroups = async () => {
    const savedGroups = JSON.parse(localStorage.getItem("ikra_my_groups") || "[]");
    if (savedGroups.length > 0) {
      const { data } = await supabase.from("hatim_groups").select("*").in("id", savedGroups);
      if (data) setPrivateGroups(data);
    }
  };

  const handleClaim = async (juzNum: number, groupId: string, isPrivate: boolean) => {
    const slots = isPrivate ? privateJuz : juzSlots;
    const slot = slots.find(j => j.juz_number === juzNum);
    if (!slot) return;
    await supabase.from("hatim_juz").update({ claimed_by: userId, claimed_by_name: claimName || userNameValue, claimed_at: new Date().toISOString() }).eq("id", slot.id);
    setShowClaimModal(null);
    loadJuz(groupId, false);
  };

  const handleUnclaim = async (juzNum: number, groupId: string, isPrivate: boolean) => {
    const slots = isPrivate ? privateJuz : juzSlots;
    const slot = slots.find(j => j.juz_number === juzNum);
    if (!slot) return;
    await supabase.from("hatim_juz")
      .update({ claimed_by: null, claimed_by_name: null, claimed_at: null, completed_at: null })
      .eq("id", slot.id);
    loadJuz(groupId, false);
  };

  const handleResetGroup = async (groupId: string) => {
    if (!confirm("Tüm hatimi sıfırlamak istediğinize emin misiniz?")) return;
    await supabase.from("hatim_juz")
      .update({ claimed_by: null, claimed_by_name: null, claimed_at: null, completed_at: null })
      .eq("group_id", groupId);
    loadJuz(groupId, false);
  };

  const handleComplete = async (juzNum: number, groupId: string, isPrivate: boolean) => {
    const slots = isPrivate ? privateJuz : juzSlots;
    const slot = slots.find(j => j.juz_number === juzNum);
    if (!slot) return;
    await supabase.from("hatim_juz").update({ completed_at: new Date().toISOString() }).eq("id", slot.id);
    loadJuz(groupId, false);
    
    // Check if whole hatim is finished
    const { data: updatedSlots } = await supabase.from("hatim_juz").select("completed_at").eq("group_id", groupId);
    const completedCount = updatedSlots?.filter(j => j.completed_at).length || 0;
    
    if (completedCount >= 30) {
      setShowConfetti(true);
      await supabase.from("hatim_groups").update({ completed_at: new Date().toISOString() }).eq("id", groupId);
      // Trigger reload to pick up new group
      setTimeout(() => {
        loadGlobalHatim();
        loadArchivedHatims();
      }, 3000);
    }
  };

  const handleUncomplete = async (juzNum: number, groupId: string, isPrivate: boolean) => {
    const slots = isPrivate ? privateJuz : juzSlots;
    const slot = slots.find(j => j.juz_number === juzNum);
    if (!slot) return;
    await supabase.from("hatim_juz").update({ completed_at: null }).eq("id", slot.id);
    loadJuz(groupId, false);
  };

  const handleManualArchive = async (groupId: string) => {
    if (!confirm("Bu hatimi şu anki haliyle bitirip arşive almak istediğinize emin misiniz?")) return;
    
    setLoading(true);
    // Mark as completed
    await supabase.from("hatim_groups").update({ completed_at: new Date().toISOString() }).eq("id", groupId);
    
    // Confetti effect
    setShowConfetti(true);
    
    // Picker up new group
    setTimeout(() => {
      loadGlobalHatim();
      loadArchivedHatims();
      setLoading(false);
    }, 2000);
  };

  const createGroup = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: newGroup } = await supabase
      .from("hatim_groups").insert({ name: groupName || "Özel Hatim", invite_code: code, is_public: false, created_by: userId }).select().single();
    if (newGroup) {
      const juzRows = Array.from({ length: 30 }, (_, i) => ({ group_id: newGroup.id, juz_number: i + 1 }));
      await supabase.from("hatim_juz").insert(juzRows);
      const saved = JSON.parse(localStorage.getItem("ikra_my_groups") || "[]");
      saved.push(newGroup.id);
      localStorage.setItem("ikra_my_groups", JSON.stringify(saved));
      setInviteCode(code);
      setShowCreateGroup(false);
      setGroupName("");
      loadPrivateGroups();
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    const { data } = await supabase.from("hatim_groups").select("*").eq("invite_code", joinCode.trim().toUpperCase()).single();
    if (data) {
      const saved = JSON.parse(localStorage.getItem("ikra_my_groups") || "[]");
      if (!saved.includes(data.id)) { saved.push(data.id); localStorage.setItem("ikra_my_groups", JSON.stringify(saved)); }
      setJoinCode("");
      loadPrivateGroups();
    }
  };

  const openPrivateGroup = async (group: HatimGroup) => {
    setActivePrivateGroup(group);
    const { data } = await supabase.from("hatim_juz").select("*").eq("group_id", group.id).order("juz_number");
    if (data) setPrivateJuz(data);
  };

  const renderJuzGrid = (slots: JuzSlot[], groupId: string, isPrivate: boolean) => {
    const claimed = slots.filter(j => j.claimed_by).length;
    const completed = slots.filter(j => j.completed_at).length;

    return (
      <>
        <div className="rounded-xl bg-primary p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Hatim Durumu</h3>
            <div className="flex gap-2">
              <span className="text-xs opacity-70">{claimed} katılımcı</span>
              {isAdmin && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleResetGroup(groupId)}
                    className="bg-destructive/20 hover:bg-destructive/40 text-[10px] px-2 py-0.5 rounded-md"
                  >
                    Sıfırla
                  </button>
                  <button 
                    onClick={() => handleManualArchive(groupId)}
                    className="bg-accent/20 hover:bg-accent/40 text-[10px] px-2 py-0.5 rounded-md"
                  >
                    Bitir ve Arşivle
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
            <div className="h-full rounded-full gold-gradient transition-all" style={{ width: `${(completed / 30) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs opacity-80">{completed} Tamamlandı / {claimed} Alındı / {30 - claimed} Kalan</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Cüz Seçimi</h3>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {slots.map((juz) => {
            const isMine = juz.claimed_by === userId;
            const isClaimed = !!juz.claimed_by;
            const isCompleted = !!juz.completed_at;

            return (
              <div
                key={juz.id}
                className={cn(
                  "rounded-xl p-3",
                  isCompleted ? "border border-primary/20 bg-primary/5 opacity-70" :
                  isMine ? "border-2 border-accent bg-card shadow-md shadow-accent/20" :
                  isClaimed ? "border border-primary/10 bg-card" :
                  "border border-dashed border-primary/20 bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2",
                    isCompleted ? "border-primary bg-primary/10" :
                    isClaimed ? "border-accent bg-accent/10" : "border-primary/20"
                  )}>
                    <span className={cn("text-sm font-bold", isClaimed ? "text-accent" : "text-muted-foreground")}>{juz.juz_number}</span>
                    {isCompleted && (
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <span className="material-symbols-outlined text-primary-foreground text-[10px]">check</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{CUZ_NAMES[juz.juz_number - 1]}</p>
                    {isClaimed && <p className="text-[10px] uppercase text-primary truncate">{juz.claimed_by_name}</p>}
                  </div>
                </div>

                <div className="mt-2">
                  {isAdmin && isClaimed ? (
                     <button
                       onClick={() => handleUnclaim(juz.juz_number, groupId, isPrivate)}
                       className="w-full rounded-full bg-destructive/10 px-3 py-1.5 text-[10px] font-bold uppercase text-destructive mb-1"
                     >
                       ✕ Cüzü Boşalt
                     </button>
                  ) : null}
                  
                  {isCompleted && isMine ? (
                    <button
                      onClick={() => handleUncomplete(juz.juz_number, groupId, isPrivate)}
                      className="w-full rounded-full bg-muted px-3 py-1.5 text-[10px] font-bold uppercase text-muted-foreground"
                    >
                      ↩ Geri Al
                    </button>
                  ) : isCompleted ? (
                    <span className="block text-center text-[10px] font-bold text-primary">✓ Tamamlandı</span>
                  ) : isMine ? (
                    <button
                      onClick={() => handleComplete(juz.juz_number, groupId, isPrivate)}
                      className="w-full rounded-full bg-accent px-3 py-1.5 text-[10px] font-bold uppercase text-foreground"
                    >
                      ✓ Okudum
                    </button>
                  ) : !isClaimed ? (
                    <button
                      onClick={() => setShowClaimModal(juz.juz_number)}
                      className="w-full rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase text-primary-foreground"
                    >
                      Cüz Seç
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="pb-20">
      <StickyHeader title="İKRA" subtitle="ORTAK HATİM" onLeftClick={onMenuOpen} onRightClick={onNotifications} />

      <div className="flex border-b border-primary/10">
        <button onClick={() => { setTab("global"); setActivePrivateGroup(null); }} className={cn("flex-1 py-3 text-sm font-bold", tab === "global" ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}>
          Global Hatim
        </button>
        <button onClick={() => setTab("ozel")} className={cn("flex-1 py-3 text-sm font-bold", tab === "ozel" ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}>
          Özel Hatim
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
        </div>
      ) : tab === "global" ? (
        <div className="px-4 pt-4">
          {globalGroup && renderJuzGrid(juzSlots, globalGroup.id, false)}
          
          {archivedGroups.length > 0 && (
            <div className="mt-8 border-t border-primary/10 pt-4 pb-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Geçmiş Hatimler</h3>
              <div className="space-y-2">
                {archivedGroups.map((g, idx) => (
                   <div key={g.id} className="rounded-xl bg-secondary/30 p-3 overflow-hidden">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={async () => {
                          if (expandedArchive === g.id) {
                            setExpandedArchive(null);
                          } else {
                            const { data } = await supabase.from("hatim_juz").select("*").eq("group_id", g.id).order("juz_number");
                            if (data) setArchivedSlots(data);
                            setExpandedArchive(g.id);
                          }
                        }}
                      >
                        <div>
                          <p className="text-xs font-bold">Hatim #{idx + 1}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(g.completed_at!).toLocaleDateString("tr-TR")} tamamlandı
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">DOLDU</span>
                          <span className="material-symbols-outlined text-muted-foreground text-[18px]">
                            {expandedArchive === g.id ? "expand_less" : "expand_more"}
                          </span>
                        </div>
                      </div>
                      
                      {expandedArchive === g.id && (
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-primary/5 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                           {archivedSlots.map((j) => (
                             <div key={j.id} className="flex flex-col rounded-lg bg-card/50 p-2 border border-primary/5">
                               <p className="text-center text-[10px] font-bold text-primary">Cüz {j.juz_number}</p>
                               <p className="text-center text-[9px] truncate text-muted-foreground">{j.claimed_by_name || "Bilinmiyor"}</p>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activePrivateGroup ? (
        <div className="px-4 pt-4">
          <button onClick={() => setActivePrivateGroup(null)} className="flex items-center gap-1 mb-4 text-sm text-primary font-medium">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Geri Dön
          </button>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{activePrivateGroup.name}</h3>
            <button
              onClick={() => { navigator.clipboard.writeText(activePrivateGroup.invite_code); }}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
            >
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
              {activePrivateGroup.invite_code}
            </button>
          </div>
          {renderJuzGrid(privateJuz, activePrivateGroup.id, true)}
        </div>
      ) : (
        <div className="px-4 pt-4">
          <GoldButton fullWidth icon="group_add" onClick={() => setShowCreateGroup(true)}>
            Özel Hatim Grubu Oluştur
          </GoldButton>

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-bold">Davet Koduyla Katıl</h3>
            <div className="flex gap-2">
              <input
                placeholder="Davet kodu girin..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 rounded-xl border border-primary/10 bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={handleJoinGroup} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
                Katıl
              </button>
            </div>
          </div>

          {inviteCode && (
            <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <p className="text-sm font-bold">Davet Kodunuz:</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-lg bg-card px-4 py-2 font-mono text-lg font-bold tracking-widest">{inviteCode}</span>
                <button onClick={() => navigator.clipboard.writeText(inviteCode)} className="rounded-lg bg-primary/10 p-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">content_copy</span>
                </button>
                <button onClick={() => window.open(`https://wa.me/?text=İKRA Hatim davet kodum: ${inviteCode}`, "_blank")} className="rounded-lg bg-green-600 p-2">
                  <span className="material-symbols-outlined text-white text-[20px]">share</span>
                </button>
              </div>
            </div>
          )}

          {privateGroups.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Gruplarım</h3>
              <div className="space-y-2">
                {privateGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => openPrivateGroup(g)}
                    className="w-full text-left rounded-xl border border-primary/10 bg-card p-4 shadow-sm hover:bg-primary/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{g.name}</p>
                        <p className="text-xs text-muted-foreground">Kod: {g.invite_code}</p>
                      </div>
                      <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Claim Modal */}
      {showClaimModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6">
            <h3 className="mb-2 text-lg font-bold">{showClaimModal}. Cüz</h3>
            <p className="mb-4 text-sm text-muted-foreground">Bu cüzü almak için adınızı girin</p>
            <input
              placeholder="Adınız"
              value={claimName}
              onChange={(e) => setClaimName(e.target.value)}
              className="w-full rounded-lg border border-primary/10 bg-card px-4 py-2 text-sm text-foreground"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowClaimModal(null)} className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">İptal</button>
              <button
                onClick={() => {
                  const groupId = activePrivateGroup?.id || globalGroup?.id;
                  if (groupId) handleClaim(showClaimModal, groupId, !!activePrivateGroup);
                }}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Seç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6">
            <h3 className="mb-4 text-lg font-bold">Özel Hatim Oluştur</h3>
            <input
              placeholder="Grup adı"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-lg border border-primary/10 bg-card px-4 py-2 text-sm text-foreground"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowCreateGroup(false)} className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">İptal</button>
              <button onClick={createGroup} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {showConfetti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowConfetti(false)}>
          <div className="rounded-xl bg-card p-8 text-center">
            <span className="text-6xl">🎉</span>
            <h3 className="mt-4 text-xl font-bold">Hatim Tamamlandı!</h3>
            <p className="mt-2 text-sm text-muted-foreground">Allah kabul etsin</p>
          </div>
        </div>
      )}
    </div>
  );
}
