import { useState } from "react";
import { TURKISH_CITIES, DEFAULT_CITY } from "@/data/cities";
import GoldButton from "@/components/GoldButton";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [name, setName] = useState("");

  const handleFinish = () => {
    localStorage.setItem("ikra_city", city);
    localStorage.setItem("ikra_name", name);
    localStorage.setItem("ikra_onboarded", "true");
    onComplete();
  };

  const slides = [
    // Slide 1: Welcome
    <div key={0} className="flex flex-col items-center justify-center gap-8 px-8 text-center">
      <div className="islamic-pattern flex h-40 w-40 items-center justify-center rounded-full bg-primary">
        <span className="text-5xl font-bold tracking-widest text-primary-foreground">İKRA</span>
      </div>
      <p className="font-arabic text-3xl text-primary" dir="rtl">
        بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
      </p>
      <p className="text-sm text-muted-foreground">
        Namaz vakitleri, Kur'an-ı Kerim ve hatim uygulaması
      </p>
      <GoldButton onClick={() => setStep(1)} fullWidth>
        Başlayalım
      </GoldButton>
    </div>,

    // Slide 2: City picker
    <div key={1} className="flex flex-col gap-6 px-6">
      <div className="text-center">
        <span className="material-symbols-outlined text-[48px] text-primary">location_city</span>
        <h2 className="mt-2 text-xl font-bold">Şehrinizi Seçin</h2>
        <p className="text-sm text-muted-foreground">Namaz vakitlerini doğru gösterelim</p>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-primary/10 bg-card px-4 py-3">
        <span className="material-symbols-outlined text-muted-foreground text-[20px] shrink-0">location_on</span>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full appearance-none bg-transparent text-sm font-medium focus:outline-none"
        >
          {TURKISH_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="material-symbols-outlined text-muted-foreground text-[18px] shrink-0">expand_more</span>
      </div>
      <GoldButton onClick={() => setStep(2)} fullWidth>
        Devam Et
      </GoldButton>
    </div>,

    // Slide 3: Name input
    <div key={2} className="flex flex-col gap-6 px-6">
      <div className="text-center">
        <span className="material-symbols-outlined text-[48px] text-primary">person</span>
        <h2 className="mt-2 text-xl font-bold">Adınız</h2>
        <p className="text-sm text-muted-foreground">Hatim özelliği için kullanılacak</p>
      </div>
      <input
        type="text"
        placeholder="Adınızı girin..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-primary/10 bg-card px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <GoldButton onClick={handleFinish} fullWidth>
        Tamamla
      </GoldButton>
    </div>,
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      {/* Progress dots */}
      <div className="mb-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-8 bg-primary" : "w-2 bg-primary/20"
            }`}
          />
        ))}
      </div>
      {slides[step]}
    </div>
  );
}
