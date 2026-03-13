# 🚀 İkra Uygulaması Genel İnceleme ve Yeni Özellik Önerileri

Aşağıda uygulamanın mevcut durumuna dair genel analizim ve uygulamanıza ekleyebileceğimiz "harika" (cool) yeni özelliklere dair önerilerimi bulabilirsiniz.

## 🟢 Mevcut Durum Analizi (Neler Çok İyi?)
1. **Görsel Tasarım ve UI:** Uygulamanın tasarımı gerçekten çok premium duruyor. Dark mode ikonları, altın rengi detaylar (GoldButton) ve namaz vakitlerindeki progress bar (ilerleme çubuğu) çok şık.
2. **Bildirim Yönetimi:** `NotificationsPage` içindeki bildirim özelleştirmeleri (5 dk önce, 15 dk önce vs.) ve Ezan/Sessiz seçeneği profesyonel bir uygulama hissi veriyor.
3. **Senkronizasyon (Supabase):** "Hatim", "Günün Ayeti/Hadisi" ve "Admin Bildirimleri" gibi tüm özellikler anlık senkronizasyonla çok iyi bağlanmış.
4. **GPS Namaz Vakitleri:** Yeni eklediğimiz özellik sayesinde kullanıcılar ilçelerine/mahallelerine kadar hassas verileri alabilecek, bu çok önemli bir artı.

---

## 💡 Harika (Cool) Yeni Özellik Önerileri

Uygulamayı bir üst seviyeye taşımak ve markette öne çıkmasını sağlamak için şu özellikleri ekleyebiliriz (İstediğinizi seçebilirsiniz):

### 1- Ramazan'a Özel "İftar Sayacı" ve "İmsakiye Modu" 🌙
- **Ne yapar?** Yaklaşan Ramazan ayı için ana sayfada dev bir "İftara Ne Kadar Kaldı?" sayacı çıkar.
- **Cool Detay:** İftar vaktine 1 saat kala ekranda hafif bir animasyon (fener/yıldız) belirebilir ve iftarı açarken edilecek dua karta yansır.

### 2- İslami Sınav / Bilgi Yarışması (Oyunlaştırma) 🎮
- **Ne yapar?** "Keşfet" bölümüne kısa dini testler eklenebilir. 
- **Cool Detay:** "Peygamberler Tarihi", "Kuran Bilgisi" gibi 5 soruluk testler sayesinde kullanıcılar uygulamada daha fazla vakit geçirir ve puan toplar. Puanlarını profil kısmında görebilirler.

### 3- Zikirmatik İyileştirmeleri (Titreşim (Haptic) & Hedef) 📿
- **Ne yapar?** Eğer henüz ekli değilse, her zikir çekildiğinde telefonu hafifçe titretecek bir sistem (`Haptics`) eklenir. Ekrana bakmadan zikir çekilmesini sağlar.
- **Cool Detay:** Kullanıcı "Bugün 100 Estağfurullah çekeceğim" diye hedef girer, hedef dolduğunda ekranda altın renkli bir tebrik animasyonu çıkar.

### 4- Kaza Namazı Takipçisi (Çetele) 📝
- **Ne yapar?** Kullanıcıların kılmadıkları namazları kaydedip, kıldıkça "eksi" (-) düşürmelerini sağlayan bir ekran.
- **Cool Detay:** "1 Yıllık Kaza Borcum Var" deyip hedef belirleyebilirler, kıldıkça ilerleme çubuğu (progress bar) yeşile doğru dolar.

### 5- Yakınımdaki Camiler (Harita Entegrasyonu) 🕌
- **Ne yapar?** Madem GPS konumunu aldık, "Yakınımdaki Camiler" diye bir buton koyarız. Tıkladığında Google Haritalar'ı açıp en yakın 5 camiyi listeler. (Özellikle seyahat edenler için çok faydalı).

---

Yukarıdakilerden gözünüze çarpan, *"Bunu hemen yapalım çok güzel olur"* dediğiniz bir özellik var mı? Yoksa şu haliyle mükemmel, direkt "Build (Çıktı)" almaya geçelim mi?
