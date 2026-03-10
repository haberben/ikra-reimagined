

# İKRA — Namaz Vakitleri & Kur'an-ı Kerim

A full-featured Islamic prayer times and Quran app built as a mobile-first PWA with Turkish UI and Arabic text support.

---

## Phase 1: Foundation & Design System

- Configure Tailwind with exact color tokens (primary #064c39, accent-gold #d4af37, background-light #f6f8f7, background-dark #10221d)
- Add Manrope + Amiri + Noto Sans Arabic fonts via Google Fonts
- Add Material Symbols Outlined icon font
- Create reusable components: AppCard, GoldButton, BottomNav, StickyHeader
- Set up PWA manifest.json and basic service worker for offline caching
- Add "Ana Ekrana Ekle" install prompt banner

## Phase 2: Onboarding Flow

- 3-slide onboarding (Islamic pattern header + logo, city picker with 81 Turkish provinces, name input)
- Store selections in localStorage, skip on subsequent visits

## Phase 3: Tab 1 — Ana Sayfa (Home)

- Dark green header with Islamic geometric pattern overlay, İKRA title, menu + notification bell
- Hijri date from Aladhan API
- Main prayer card overlapping header (-mt-8): current prayer name, countdown timer, progress bar, 4-column mini grid (İmsak, Güneş, Öğle, İkindi)
- Günün Ayeti section with Arabic (RTL, Amiri font) + Turkish translation
- 2×2 Keşfet grid (Hatim, Duvar Kağıdı, Kıble Bulucu, Zikirmatik)
- Live prayer times from Aladhan API based on saved city

## Phase 4: Tab 2 — Vakitler (Prayer Times)

- City search/selector for 81 Turkish provinces
- 5 prayer time cards with active state highlighting (data from Aladhan API)
- Notification settings per prayer: toggle switch + time offset selector
- Günün Mesajları section: Ayet + Hadis cards with Islamic pattern header bar
- Kıble compass using DeviceOrientationEvent with animated needle

## Phase 5: Tab 3 — Kur'an

- Son Okunan (Last Read) card in dark green with gold "DEVAM ET" button
- Hafızlar horizontal scroll with reciter avatars and gold borders (from mp3quran API)
- 30 Cüz list with play/download buttons (from mp3quran API)
- Persistent audio player bar (above bottom nav) with progress, play/pause, prev/next, sleep timer
- Video sub-tab: 6 categories from @kuranmektebi with YouTube iframe embeds

## Phase 6: Tab 4 — Galeri (Wallpapers)

- Search bar + horizontal category pills (Tümü, Günün Ayeti, Hadis, Hat Sanatı, Manzara)
- 2-column wallpaper grid (9:16 aspect ratio) with gradient overlay, Arabic text, download button, "AYARLA" set button
- Admin upload panel (password: "ikra2024") for managing wallpapers
- Mock data for now (Supabase storage later)

## Phase 7: Tab 5 — Ortak Hatim

- Global Hatim tab: progress card, 2-column grid of 30 juz boxes (selected/available/yours states)
- Claiming flow with name modal
- Özel Hatim tab: create group (name, public/private, 6-char invite code), join by code, WhatsApp share
- Completion confetti animation + congratulations message
- Mock data for now (Supabase real-time later)

## Phase 8: Notifications Screen

- Accessible from bell icon
- Namaz Hatırlatıcıları with per-prayer toggle switches + time offset selectors
- Günün Mesajları: Ayet + Hadis cards matching exact Bildirim design

---

**All screens mobile-first (375px primary), Turkish language throughout, Arabic text always RTL with Amiri font. Data from live APIs where specified, mock data for Supabase-dependent features.**

