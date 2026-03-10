import { useState } from "react";
import StickyHeader from "@/components/layout/StickyHeader";
import GoldButton from "@/components/GoldButton";
import { cn } from "@/lib/utils";

interface JuzSlot {
  number: number;
  claimedBy: string | null;
  claimedByName: string | null;
  completed: boolean;
}

const CUZ_NAMES = [
  "Alif Lam Mim","Sayakul","Tilkal Rusul","Len Tenaalu","Vel Muhsanat",
  "La Yuhibbullah","Ve İza Semi'u","Ve Lev Ennena","Kalellmeleu","Va'lemu",
  "Ya'tezirune","Ve Ma Min Dabbetin","Ve Ma Uberriu","Rubema","Subhanellezi",
  "Kal Elem","İkterabe","Kad Eflaha","Ve Kalellezine","Emmen Halaka",
  "Utlu Ma Uhiye","Ve Men Yaknüt","Ve Mali","Femmen Ezlemu","İleyhi Yureddu",
  "Ha Mim","Kale Femma Hatbuküm","Kad Semi'allah","Tebarekellezi","Amme"
];

function generateInitialJuz(): JuzSlot[] {
  return Array.from({ length: 30 }, (_, i) => ({
    number: i + 1,
    claimedBy: i < 5 ? `user_${i}` : null,
    claimedByName: i < 5 ? ["Ahmet", "Fatma", "Mehmet", "Ayşe", "Ali"][i] : null,
    completed: i < 2,
  }));
}

export default function HatimPage() {
  const [tab, setTab] = useState<"global" | "ozel">("global");
  const [juzSlots, setJuzSlots] = useState<JuzSlot[]>(generateInitialJuz);
  const [showClaimModal, setShowClaimModal] = useState<number | null>(null);
  const [claimName, setClaimName] = useState(localStorage.getItem("ikra_name") || "");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const claimed = juzSlots.filter((j) => j.claimedBy).length;
  const completed = juzSlots.filter((j) => j.completed).length;
  const userName = localStorage.getItem("ikra_name") || "";

  const handleClaim = (juzNum: number) => {
    setJuzSlots((prev) =>
      prev.map((j) =>
        j.number === juzNum
          ? { ...j, claimedBy: "self", claimedByName: claimName || userName }
          : j
      )
    );
    setShowClaimModal(null);
  };

  const handleComplete = (juzNum: number) => {
    setJuzSlots((prev) =>
      prev.map((j) => (j.number === juzNum ? { ...j, completed: true } : j))
    );
    const newCompleted = juzSlots.filter((j) => j.completed).length + 1;
    if (newCompleted >= 30) setShowConfetti(true);
  };

  const createGroup = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
    setShowCreateGroup(false);
  };

  return (
    <div className="pb-20">
      <StickyHeader title="İKRA" subtitle="ORTAK HATİM" />

      {/* Tabs */}
      <div className="flex border-b border-primary/10">
        <button
          onClick={() => setTab("global")}
          className={cn("flex-1 py-3 text-sm font-bold", tab === "global" ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}
        >
          Global Hatim
        </button>
        <button
          onClick={() => setTab("ozel")}
          className={cn("flex-1 py-3 text-sm font-bold", tab === "ozel" ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}
        >
          Özel Hatim
        </button>
      </div>

      {tab === "global" ? (
        <div className="px-4 pt-4">
          {/* Progress card */}
          <div className="rounded-xl bg-primary p-4 text-primary-foreground">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Mevcut Hatim Durumu</h3>
              <span className="text-xs opacity-70">{claimed} katılımcı</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
              <div
                className="h-full rounded-full gold-gradient transition-all"
                style={{ width: `${(claimed / 30) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs opacity-80">
              {claimed} Cüz Alındı / {30 - claimed} Cüz Kalan
            </p>
          </div>

          {/* Hatim No */}
          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Cüz Seçimi</h3>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">Hatim #1</span>
          </div>

          {/* Juz grid */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {juzSlots.map((juz) => {
              const isMine = juz.claimedBy === "self";
              const isClaimed = !!juz.claimedBy;

              return (
                <div
                  key={juz.number}
                  className={cn(
                    "rounded-xl p-3",
                    isMine
                      ? "border-2 border-accent bg-card shadow-md shadow-accent/20"
                      : isClaimed
                        ? "border border-primary/10 bg-card"
                        : "border border-dashed border-primary/20 bg-emerald-50/50 dark:bg-emerald-950/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-full border-2",
                      isClaimed ? "border-accent bg-accent/10" : "border-primary/20"
                    )}>
                      <span className={cn("text-sm font-bold", isClaimed ? "text-accent" : "text-muted-foreground")}>
                        {juz.number}
                      </span>
                      {isClaimed && (
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                          <span className="material-symbols-outlined text-primary-foreground text-[10px]">check</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{CUZ_NAMES[juz.number - 1]}</p>
                      {isClaimed && (
                        <p className="text-[10px] uppercase text-primary truncate">{juz.claimedByName}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    {isMine && !juz.completed ? (
                      <button
                        onClick={() => handleComplete(juz.number)}
                        className="w-full rounded-full bg-accent px-3 py-1.5 text-[10px] font-bold uppercase text-foreground"
                      >
                        ✓ Okudum
                      </button>
                    ) : isMine && juz.completed ? (
                      <span className="block text-center text-[10px] font-bold text-primary">✓ Tamamlandı</span>
                    ) : !isClaimed ? (
                      <button
                        onClick={() => setShowClaimModal(juz.number)}
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
        </div>
      ) : (
        /* Özel Hatim */
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
                className="flex-1 rounded-xl border border-primary/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
                Katıl
              </button>
            </div>
          </div>

          {inviteCode && (
            <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <p className="text-sm font-bold">Davet Kodunuz:</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-lg bg-card px-4 py-2 font-mono text-lg font-bold tracking-widest">{inviteCode}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteCode)}
                  className="rounded-lg bg-primary/10 p-2"
                >
                  <span className="material-symbols-outlined text-primary text-[20px]">content_copy</span>
                </button>
                <button
                  onClick={() => window.open(`https://wa.me/?text=İKRA Hatim davet kodum: ${inviteCode}`, "_blank")}
                  className="rounded-lg bg-green-600 p-2"
                >
                  <span className="material-symbols-outlined text-white text-[20px]">share</span>
                </button>
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
              className="w-full rounded-lg border border-primary/10 px-4 py-2 text-sm"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowClaimModal(null)} className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm">İptal</button>
              <button
                onClick={() => handleClaim(showClaimModal)}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Cüz Al
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6">
            <h3 className="mb-4 text-lg font-bold">Özel Hatim Grubu</h3>
            <input placeholder="Grup adı" className="mb-3 w-full rounded-lg border border-primary/10 px-4 py-2 text-sm" />
            <select className="mb-3 w-full rounded-lg border border-primary/10 px-4 py-2 text-sm">
              <option>Herkese Açık</option>
              <option>Gizli</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowCreateGroup(false)} className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm">İptal</button>
              <button onClick={createGroup} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowConfetti(false)}>
          <div className="text-center">
            <p className="text-6xl">🎉</p>
            <h2 className="mt-4 text-2xl font-bold text-white">Hatim Tamamlandı!</h2>
            <p className="mt-2 text-lg text-white/80">Allah kabul etsin 🤲</p>
          </div>
        </div>
      )}
    </div>
  );
}
