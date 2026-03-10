import { useState, useEffect, useRef } from "react";
import StickyHeader from "@/components/layout/StickyHeader";
import GoldButton from "@/components/GoldButton";
import { cn } from "@/lib/utils";

interface Reciter {
  id: number;
  name: string;
  letter?: string;
  moshaf?: { server: string; supieces?: string }[];
}

// Turkish name mappings for popular reciters
const RECITER_TURKISH_NAMES: Record<number, string> = {
  1: "Abdurrahman es-Sudeys",
  2: "Abdul Basit Abdussamed",
  3: "Maher el-Muaykili",
  4: "Saad el-Gamidi",
  5: "Mişari Raşid el-Afasi",
  6: "Ahmed el-Acemi",
  7: "Hani er-Rifai",
  8: "Halid el-Celil",
  9: "Faris Abbad",
  10: "Yaser ed-Doseri",
  11: "Abdullah Basfar",
  12: "Ebu Bekir eş-Şatiri",
  13: "Nasser el-Katami",
  14: "Abdulmuhsin el-Kasım",
  15: "Muhammed Eyyub",
  16: "Mahmud Halil el-Husari",
  17: "Muhammed Sıddık el-Minşavi",
  18: "Ali Abdurrahman el-Huzeyfi",
  19: "Abdullah el-Matrud",
  20: "İdris Ebker",
};

const JUZ_DATA = Array.from({ length: 30 }, (_, i) => ({
  number: i + 1,
  name: `${i + 1}. Cüz`,
}));

// Real videos from @kuranmektebi playlist PL9AtecotAGkQqGRBR7PwLzgtliMA3XhRV
const PLAYLIST_VIDEOS = [
  { id: "MTbLZij7oAs", title: "Ok Takipli Hatim - 1. Cüz", cuz: 1 },
  { id: "LZXcTAk1vFA", title: "Ok Takipli Hatim - 2. Cüz", cuz: 2 },
  { id: "LDdMFFGnXqY", title: "Ok Takipli Hatim - 3. Cüz", cuz: 3 },
  { id: "AJcTNzlekLU", title: "Ok Takipli Hatim - 4. Cüz", cuz: 4 },
  { id: "vVcVO01kNgU", title: "Ok Takipli Hatim - 5. Cüz", cuz: 5 },
  { id: "z8SX3_rv6ws", title: "Ok Takipli Hatim - 6. Cüz", cuz: 6 },
  { id: "JSS48YKwlOI", title: "Ok Takipli Hatim - 7. Cüz", cuz: 7 },
  { id: "dDtzLHC4U_4", title: "Ok Takipli Hatim - 8. Cüz", cuz: 8 },
];

export default function QuranPage() {
  const [subTab, setSubTab] = useState<"audio" | "video">("audio");
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [playingJuz, setPlayingJuz] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("https://www.mp3quran.net/api/v3/reciters?language=ar")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.reciters || []).slice(0, 20);
        setReciters(list);
        if (list.length > 0) setSelectedReciter(list[0]);
      })
      .catch(console.error);
  }, []);

  const playJuz = (juzNum: number) => {
    if (!selectedReciter?.moshaf?.[0]) return;
    const server = selectedReciter.moshaf[0].server;
    const padded = String(juzNum).padStart(3, "0");
    const url = `${server}${padded}.mp3`;

    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(console.error);
    setPlayingJuz(juzNum);
    setIsPlaying(true);
    setAudioProgress(0);

    // Save last read
    localStorage.setItem("ikra_last_read", JSON.stringify({
      surah: `${juzNum}. Cüz`,
      juz: juzNum,
      page: (juzNum - 1) * 20 + 1,
      reciterId: selectedReciter.id,
    }));

    audio.addEventListener("timeupdate", () => {
      if (audio.duration) setAudioProgress((audio.currentTime / audio.duration) * 100);
    });
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      if (juzNum < 30) playJuz(juzNum + 1);
    });
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const handleResume = () => {
    const lastRead = JSON.parse(localStorage.getItem("ikra_last_read") || '{"juz":1}');
    // If we have a saved reciter, try to select it
    if (lastRead.reciterId) {
      const found = reciters.find((r) => r.id === lastRead.reciterId);
      if (found) setSelectedReciter(found);
    }
    playJuz(lastRead.juz || 1);
  };

  const lastRead = JSON.parse(localStorage.getItem("ikra_last_read") || '{"surah":"el-Fâtiha","juz":1,"page":1}');

  const getReciterTurkishName = (r: Reciter) => {
    return RECITER_TURKISH_NAMES[r.id] || r.name;
  };

  return (
    <div className="pb-36">
      <StickyHeader title="İKRA" subtitle="QURAN LIBRARY" rightIcon="search" />

      {/* Sub tabs */}
      <div className="flex border-b border-primary/10">
        <button
          onClick={() => setSubTab("audio")}
          className={cn("flex-1 py-3 text-sm font-bold", subTab === "audio" ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}
        >
          Sesli Kur'an
        </button>
        <button
          onClick={() => setSubTab("video")}
          className={cn("flex-1 py-3 text-sm font-bold", subTab === "video" ? "border-b-2 border-primary text-primary" : "text-muted-foreground")}
        >
          Video
        </button>
      </div>

      {subTab === "audio" ? (
        <div className="px-4 pt-4">
          {/* Son Okunan */}
          <div className="relative overflow-hidden rounded-xl bg-primary p-5 text-primary-foreground">
            <div className="absolute right-2 top-2 opacity-10">
              <span className="material-symbols-outlined text-[80px]">menu_book</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-accent text-[16px]">bookmark</span>
              <span className="text-accent font-medium">Last Read • Son Okunan</span>
            </div>
            <h3 className="mt-2 text-2xl font-bold">{lastRead.surah}</h3>
            <p className="mt-1 text-sm opacity-70">
              Juz {lastRead.juz} • Page {lastRead.page} • {lastRead.juz}. Cüz
            </p>
            <GoldButton className="mt-4 text-foreground" icon="play_arrow" onClick={handleResume}>
              DEVAM ET
            </GoldButton>
          </div>

          {/* Hafızlar */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                Reciters • Hafızlar
              </h3>
              <button className="text-xs font-medium text-accent">Tümünü Gör</button>
            </div>
            <div className="mt-3 flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {reciters.map((r) => {
                const isSelected = selectedReciter?.id === r.id;
                const turkishName = getReciterTurkishName(r);
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReciter(r)}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                  >
                    <div className={cn(
                      "relative flex h-20 w-20 items-center justify-center rounded-full border-2",
                      isSelected ? "border-accent" : "border-primary/20"
                    )}>
                      <span className="material-symbols-outlined text-[32px] text-primary">person</span>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                          <span className="material-symbols-outlined text-[14px] text-primary-foreground">check</span>
                        </div>
                      )}
                    </div>
                    <span className="w-20 text-center text-[10px] font-medium leading-tight">
                      {turkishName}
                    </span>
                    <span className="w-20 truncate text-center text-[8px] text-muted-foreground font-arabic">
                      {r.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cüz Listesi */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                Juz Selection • Cüz Listesi
              </h3>
              <button className="p-1">
                <span className="material-symbols-outlined text-muted-foreground">sort</span>
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {JUZ_DATA.map((juz) => {
                const isActive = playingJuz === juz.number;
                return (
                  <div
                    key={juz.number}
                    className="flex items-center gap-3 rounded-xl border border-primary/10 bg-card p-3 shadow-sm"
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold",
                      isActive ? "bg-primary text-accent" : "bg-primary/10 text-primary"
                    )}>
                      {juz.number}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{juz.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Sayfa {(juz.number - 1) * 20 + 1} - {juz.number * 20}
                      </p>
                    </div>
                    <button className="p-2 text-muted-foreground">
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                    <button
                      onClick={() => isActive && isPlaying ? togglePlay() : playJuz(juz.number)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isActive && isPlaying ? "pause" : "play_arrow"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Video tab */
        <div className="px-4 pt-4">
          <div className="mb-4 rounded-xl border border-primary/10 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">playlist_play</span>
              <h3 className="text-sm font-bold">Ok Takipli Hatim — @kuranmektebi</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Diyanet İşleri Başkanlığı ok takipli Kur'an-ı Kerim ve Meali
            </p>
          </div>

          <div className="space-y-4">
            {PLAYLIST_VIDEOS.map((v) => (
              <div key={v.id} className="rounded-xl border border-primary/10 bg-card overflow-hidden shadow-sm">
                {playingVideoId === v.id ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0`}
                      className="h-full w-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title={v.title}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setPlayingVideoId(v.id)}
                    className="relative aspect-video w-full bg-primary/5"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                      alt={v.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90">
                        <span className="material-symbols-outlined text-primary-foreground text-[28px]">play_arrow</span>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                      {v.cuz}. Cüz
                    </div>
                  </button>
                )}
                <div className="p-3">
                  <p className="font-bold text-sm">{v.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">@kuranmektebi</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persistent Audio Player */}
      {playingJuz && (
        <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-primary/10 bg-card/95 backdrop-blur-md px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">
                {selectedReciter ? getReciterTurkishName(selectedReciter) : "Hafız"}
              </p>
              <p className="text-[10px] text-muted-foreground">{playingJuz}. Cüz</p>
            </div>
            <div className="flex-1 h-1 rounded-full bg-primary/10 overflow-hidden">
              <div className="h-full gold-gradient transition-all" style={{ width: `${audioProgress}%` }} />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => playingJuz > 1 && playJuz(playingJuz - 1)} className="p-1">
                <span className="material-symbols-outlined text-[20px]">skip_previous</span>
              </button>
              <button onClick={togglePlay} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="material-symbols-outlined text-[18px]">{isPlaying ? "pause" : "play_arrow"}</span>
              </button>
              <button onClick={() => playingJuz < 30 && playJuz(playingJuz + 1)} className="p-1">
                <span className="material-symbols-outlined text-[20px]">skip_next</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
