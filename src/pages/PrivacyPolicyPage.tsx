import { useNavigate } from "react-router-dom";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-card/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold tracking-widest">Gizlilik Politikası</h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6 pb-20 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p className="text-xs">Son güncelleme: 12 Mart 2026</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Giriş</h2>
          <p>
            İKRA uygulaması ("Uygulama"), kullanıcılarının gizliliğine önem verir. Bu gizlilik
            politikası, uygulamayı kullanırken hangi verilerin toplandığını, nasıl kullanıldığını ve
            nasıl korunduğunu açıklar.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Toplanan Veriler</h2>
          <p>Uygulama, aşağıdaki verileri toplayabilir:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Konum bilgisi:</strong> Namaz vakitlerini ve kıble
              yönünü doğru hesaplayabilmek için şehir tercihiniz kullanılır. GPS konumunuz
              sunucularımıza gönderilmez; yalnızca cihazınızda yerel olarak işlenir.
            </li>
            <li>
              <strong className="text-foreground">Bildirim izni:</strong> Namaz vakti hatırlatmaları
              ve günlük içerik bildirimleri göndermek için bildirim izninizi talep ederiz. Bu izni
              istediğiniz zaman cihaz ayarlarından kapatabilirsiniz.
            </li>
            <li>
              <strong className="text-foreground">Depolama izni:</strong> Duvar kağıtlarını ve
              görselleri cihazınıza indirebilmeniz için depolama erişimi istenir.
            </li>
            <li>
              <strong className="text-foreground">Kullanıcı tercihleri:</strong> Tema seçimi, şehir
              tercihi ve favori içerikleriniz cihazınızda yerel olarak saklanır.
            </li>
            <li>
              <strong className="text-foreground">Hesap bilgileri:</strong> Hatim grupları ve içerik
              önerileri gibi özellikler için e-posta adresiniz ve görünen adınız saklanır.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Verilerin Kullanımı</h2>
          <p>Toplanan veriler yalnızca şu amaçlarla kullanılır:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Namaz vakitlerini doğru şekilde hesaplamak ve göstermek</li>
            <li>Zamanında bildirimler göndermek</li>
            <li>Favori içeriklerinizi ve tercihlerinizi kaydetmek</li>
            <li>Hatim gruplarını yönetmek ve takip etmek</li>
            <li>Uygulama deneyimini iyileştirmek</li>
          </ul>
          <p>
            Verileriniz hiçbir koşulda reklam amaçlı kullanılmaz veya üçüncü taraflara satılmaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Üçüncü Taraf Hizmetler</h2>
          <p>Uygulama, aşağıdaki üçüncü taraf hizmetlerini kullanmaktadır:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Lovable Cloud (Veritabanı & Kimlik Doğrulama):</strong>{" "}
              Kullanıcı hesapları, hatim grupları, bildirimler ve içerik verileri güvenli bulut
              sunucularında saklanır. Veriler şifreleme ile korunur.
            </li>
            <li>
              <strong className="text-foreground">YouTube API:</strong> Kur'an tilaveti ve dini içerik
              videoları YouTube üzerinden sunulmaktadır. YouTube'un kendi gizlilik politikası için:{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Gizlilik Politikası
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Veri Güvenliği</h2>
          <p>
            Verilerinizin güvenliği bizim için önemlidir. Endüstri standardı güvenlik önlemleri
            (SSL/TLS şifreleme, güvenli veritabanı erişimi, satır düzeyinde güvenlik politikaları)
            kullanılmaktadır. Ancak, internet üzerinden hiçbir iletim yönteminin %100 güvenli
            olmadığını hatırlatmak isteriz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Çocukların Gizliliği</h2>
          <p>
            Uygulama, 13 yaşın altındaki çocuklardan bilerek kişisel bilgi toplamaz. Ebeveynler
            veya veliler, çocuklarının bilgi paylaştığını fark ederlerse bizimle iletişime
            geçebilirler.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">7. Kullanıcı Hakları</h2>
          <p>Kullanıcılar olarak şu haklara sahipsiniz:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hesabınızı ve verilerinizi silme talebinde bulunma</li>
            <li>Bildirim ve konum izinlerini istediğiniz zaman kapatma</li>
            <li>Hangi verilerinizin saklandığını öğrenme</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">8. Değişiklikler</h2>
          <p>
            Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler uygulama
            içinden bildirilecektir. Uygulamayı kullanmaya devam etmeniz, güncellenmiş politikayı
            kabul ettiğiniz anlamına gelir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">9. İletişim</h2>
          <p>
            Gizlilik politikası hakkında sorularınız veya talepleriniz için bizimle iletişime
            geçebilirsiniz:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">E-posta:</strong>{" "}
              <a href="mailto:destek@ikra.app" className="text-primary underline">
                destek@ikra.app
              </a>
            </li>
            <li>
              <strong className="text-foreground">Uygulama içi:</strong> Menü → İçerik Öner
              bölümünden bize ulaşabilirsiniz.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
