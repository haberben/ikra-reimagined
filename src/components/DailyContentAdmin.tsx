import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DailyContentItem {
  id: string;
  arabic_text: string;
  turkish_text: string;
  source: string | null;
  type: string;
  date: string;
}

export default function DailyContentAdmin({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<DailyContentItem[]>([]);
  const [type, setType] = useState<"ayet" | "hadis">("ayet");
  const [arabic, setArabic] = useState("");
  const [turkish, setTurkish] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("daily_content")
      .select("*")
      .order("date", { ascending: false })
      .limit(30);
    if (data) setItems(data);
  };

  const handleSave = async () => {
    if (!arabic.trim() || !turkish.trim()) return;
    setSaving(true);
    await supabase.from("daily_content").insert({
      type,
      arabic_text: arabic.trim(),
      turkish_text: turkish.trim(),
      source: source.trim() || null,
      date,
    });
    setArabic("");
    setTurkish("");
    setSource("");
    fetchItems();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/10 bg-card px-4 py-3">
        <h3 className="text-lg font-bold">Günlük İçerik Yönetimi</h3>
        <button onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setType("ayet")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold ${type === "ayet" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            Ayet
          </button>
          <button
            onClick={() => setType("hadis")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold ${type === "hadis" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            Hadis
          </button>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm bg-card" />
        <textarea placeholder="Arapça metin" value={arabic} onChange={(e) => setArabic(e.target.value)} className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm font-arabic min-h-[80px] bg-card" dir="rtl" />
        <textarea placeholder="Türkçe metin" value={turkish} onChange={(e) => setTurkish(e.target.value)} className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm min-h-[60px] bg-card" />
        <input placeholder="Kaynak (ör: Bakara, 255)" value={source} onChange={(e) => setSource(e.target.value)} className="w-full rounded-lg border border-primary/10 px-3 py-2 text-sm bg-card" />
        <button
          onClick={handleSave}
          disabled={saving || !arabic.trim() || !turkish.trim()}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>

        <div className="mt-6">
          <h4 className="text-sm font-bold mb-3">Son İçerikler ({items.length})</h4>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-primary/10 bg-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${item.type === "ayet" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                    {item.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.date}</span>
                </div>
                <p className="text-xs font-arabic mt-1" dir="rtl">{item.arabic_text.substring(0, 60)}...</p>
                <p className="text-xs text-muted-foreground mt-1">{item.turkish_text.substring(0, 80)}...</p>
                {item.source && <p className="text-[10px] text-primary/60 mt-1">{item.source}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
