# 🕋 Masjid Locator App — User Guide & Screen Breakdown

A welcoming, easy-to-use mobile app designed for Muslim worshippers. The **Masjid Locator App** helps you find nearby mosques, view accurate daily prayer times, navigate with a real-time Qibla compass, read uplifting daily Ahadith, and stay connected with community events and mosque announcements.

---

## 📖 Table of Contents
1. [About the App](#-about-the-app)
2. [Language Support (English & Urdu)](#-language-support-english--urdu)
3. [Screen-by-Screen User Guide](#-screen-by-screen-user-guide)
   - [1. App Launch & Welcome](#1-app-launch--welcome)
     - [1.1 Splash Screen](#11-splash-screen)
     - [1.2 Welcome Screen](#12-welcome-screen)
     - [1.3 Sign In, Register & Password Recovery](#13-sign-in-register--password-recovery)
   - [2. Daily Prayer & Companion Suite](#2-daily-prayer--companion-suite)
     - [2.1 Home Screen](#21-home-screen)
     - [2.2 Full Prayer Times Screen](#22-full-prayer-times-screen)
     - [2.3 Qibla Compass Screen](#23-qibla-compass-screen)
   - [3. Mosque Discovery & Navigation](#3-mosque-discovery--navigation)
     - [3.1 Search & Interactive Mosque Map](#31-search--interactive-mosque-map)
     - [3.2 Nearest Mosques Directory](#32-nearest-mosques-directory)
     - [3.3 Mosque Profile & Details](#33-mosque-profile--details)
   - [4. Islamic Knowledge & Announcements](#4-islamic-knowledge--announcements)
     - [4.1 Daily Hadith & Wisdom](#41-daily-hadith--wisdom)
     - [4.2 Announcement Categories](#42-announcement-categories)
     - [4.3 Category Announcements Feed & Full Notice View](#43-category-announcements-feed--full-notice-view)
   - [5. Profile & Settings](#5-profile--settings)
     - [5.1 Settings Screen](#51-settings-screen)
     - [5.2 Edit Profile Screen](#52-edit-profile-screen)
     - [5.3 Change Password Screen](#53-change-password-screen)
   - [6. Mosque Admin & Super Admin Features](#6-mosque-admin--super-admin-features)
     - [6.1 Mosque Admin Panel](#61-mosque-admin-panel)
     - [6.2 Super Admin Management Suite](#62-super-admin-management-suite)
4. [Community Announcement Categories Reference](#-community-announcement-categories-reference)
5. [Helpful Tips for Everyday Use](#-helpful-tips-for-everyday-use)
6. [Developer Quickstart](#-developer-quickstart)

---

## 🌟 About the App

The **Masjid Locator App** is built to make your daily worship effortless, whether you are at home, at work, or traveling in an unfamiliar city:

- **Never Miss a Prayer**: View accurate prayer times based on your current location, complete with a live countdown to the next prayer.
- **Find Any Mosque Near You**: See nearby mosques on an interactive map or a distance-sorted list, and get one-tap directions via Google Maps or Apple Maps.
- **Know Mosque Facilities in Advance**: Easily check if a mosque has a dedicated women's prayer hall, wheelchair ramps, wudu area, parking, or air conditioning.
- **Find the Kaaba (Qibla)**: Rotate your phone to find the exact direction of the Kaaba in Makkah with a smooth, calibrated compass.
- **Daily Inspiration**: Read an authentic Hadith every day with clear Arabic text, English and Urdu translations, and practical life lessons.
- **Stay Connected with Your Local Mosque**: Receive announcements about Friday sermons, lectures, fundraising, madarsa updates, and funeral (Janaza) notices.

---

## 🌐 Language Support (English & Urdu)

The app is fully bilingual and supports **English** and **اردو (Urdu)**:
- You can switch languages at any time using the quick language toggle (`EN` | `UR`) at the top of the Home screen or in Settings.
- When Urdu is selected, the entire app adapts to **Right-to-Left (RTL)** layout naturally: text aligns right, cards and arrows flip smoothly, and all menus display in clear, easy-to-read Urdu.

---

## 📱 Screen-by-Screen User Guide

---

### 1. App Launch & Welcome

#### 1.1 Splash Screen
- **What it is**: The introductory screen that appears when you tap to open the app.
- **What you see**:
  - The beautiful green Masjid Locator emblem and logo animation.
  - A warm Islamic welcome greeting.
- **How it works**: In just 1–2 seconds, the app checks if you are already signed in and prepares today's prayer times so you never have to wait. If you are signed in, it takes you straight to your Home dashboard; otherwise, it opens the Welcome screen.

---

#### 1.2 Welcome Screen
- **What it is**: A clean, friendly greeting screen designed for first-time users or visitors who have signed out.
- **What you see**:
  - A peaceful Islamic mosque illustration and inspiring welcoming text.
  - Two clear buttons: **"Get Started"** (or **"Sign In"**) and **"Create Account"**.
- **How to use it**:
  - Tap **Sign In** if you already have an account.
  - Tap **Create Account** if you are new to the app.

---

#### 1.3 Sign In, Register & Password Recovery
- **What it is**: Your secure gateway to your personal account.
- **What you see**:
  - A simple tab switcher at the top: **Sign In** and **Create Account**.
  - **Sign In Tab**:
    - Email address and password fields.
    - An **eye icon** to show or hide your password as you type.
    - **"Remember Me"** toggle to keep you conveniently logged in.
    - **"Forgot Password?"** button.
  - **Create Account Tab**:
    - Your full name, email address, and new password.
    - Password confirmation to prevent typing mistakes.
  - **Forgot Password**:
    - Enter your email address to receive a secure password reset link directly in your inbox.
- **Helpful Tip**: Once you sign in, your login session is securely remembered so you don't have to enter your password every time you open the app.

---

### 2. Daily Prayer & Companion Suite

#### 2.1 Home Screen (Bottom Tab 1: Home)
- **What it is**: Your central daily worship dashboard. Everything you need for the day is gathered here in one glance.
- **What you see**:
  - **Header Card**:
    - A warm Islamic greeting (*Assalam-o-Alaikum* / *السلام علیکم*) with your name.
    - Today's **Hijri Islamic date** (e.g., *28 Muharram 1448*) alongside the Gregorian date.
    - A live digital clock ticking in real-time.
    - A prominent countdown badge telling you exactly how much time is left for the next prayer (e.g., *"Asr in 1h 42m"*).
    - Quick shortcuts: Circular Qibla button and Language Switcher (`EN` / `UR`).
  - **Daily Prayer Times Strip**:
    - Shows all 6 daily time slots: **Fajr**, **Sunrise (Shuruq)**, **Dhuhr**, **Asr**, **Maghrib**, and **Isha**.
    - The prayer currently in progress is **highlighted with an active glow**, making it instantly obvious which prayer window you are currently in.
    - Tapping this strip opens the full detailed Prayer Times screen.
  - **Quick Action Buttons**:
    - 🕌 **Prayer Times**: Opens the complete multi-day prayer timetable.
    - 📖 **Hadith**: Opens today's selected Hadith and reflections.
    - 🧭 **Qibla**: Launches the Kaaba direction compass.
    - 🎓 **Madarsa**: Shows the latest updates from local Islamic schools.
  - **Announcements Preview**:
    - A curated preview of recent mosque notices.
    - A **"See All"** button that takes you directly to the full announcements directory.
- **How to use it**: Swipe down anywhere on the Home screen (pull-to-refresh) to sync the latest prayer times and community news.

---

#### 2.2 Full Prayer Times Screen
- **What it is**: A comprehensive, day-by-day timetable for all obligatory daily prayers.
- **What you see**:
  - **Date Navigation Bar**: Arrows (`< Previous Day` and `Next Day >`) allowing you to look back at past dates or plan ahead for upcoming days.
  - Both Islamic Hijri and Gregorian calendar dates clearly listed.
  - Individual cards for each prayer (**Fajr**, **Sunrise**, **Dhuhr**, **Asr**, **Maghrib**, **Isha**) with custom icons and exact times.
  - A live indicator showing which prayer is currently active and the remaining countdown.
  - Clear note of the calculation method used (such as University of Islamic Sciences, Karachi or Muslim World League).
- **How to use it**: Tap the arrow buttons to browse the prayer schedule for tomorrow, this weekend, or next week. It works seamlessly even when you are temporarily offline!

---

#### 2.3 Qibla Compass Screen
- **What it is**: A smart, accurate 360-degree compass pointing directly to the Holy Kaaba in Makkah, Saudi Arabia.
- **What you see**:
  - A smoothly rotating golden and emerald compass dial.
  - A distinct Kaaba icon and pointer needle indicating the exact direction you should face.
  - Live degree readout (for example, `264° West`).
  - The exact geographical distance from your location to the Kaaba in kilometers.
  - Sensor health & calibration status (Low, Medium, or High accuracy).
- **How to use it**:
  1. Hold your phone flat in the palm of your hand, away from large metal objects or magnetic phone cases.
  2. If the compass needs calibration, gently rotate your phone in a figure-8 motion.
  3. Turn your body until the pointer needle aligns with the Kaaba symbol. You are now facing the Qibla!

---

### 3. Mosque Discovery & Navigation

#### 3.1 Search & Interactive Mosque Map (Bottom Tab 3: Search)
- **What it is**: An interactive geographic map showing every mosque registered in your area.
- **What you see**:
  - **Live Map View**: Centers around your current location with a blue marker, surrounded by custom green mosque pins.
  - **Search Bar**: Type any mosque name, area, or street to find it instantly.
  - **Distance Filter**: Filter mosques within 2 km, 5 km, 10 km, or 25 km of your location.
  - **Facility Filter Chips**: Tap to find mosques that match your specific needs:
    - 💧 **Wudu Area**: Dedicated ablution facilities.
    - ♿ **Wheelchair Accessible**: Step-free access and ramps.
    - 🧕 **Women's Prayer Area**: Dedicated private prayer space for sisters.
    - ❄️ **Air Conditioned**: Temperature-controlled prayer halls.
    - 🚗 **Parking Available**: On-site or nearby vehicle parking.
    - ⚰️ **Janaza Facility**: Equipped for funeral prayers and arrangements.
  - **Map / List View Switcher**: Easily toggle between seeing mosques on the visual map or viewing them in a tidy list.
- **How to use it**: Tap any green mosque pin on the map. A preview card will pop up at the bottom showing the mosque's name, distance, and a button to view full details.

---

#### 3.2 Nearest Mosques Directory (Bottom Tab 4: Masjids)
- **What it is**: A clean, distance-sorted list of mosques, showing the closest options first.
- **What you see**:
  - Each mosque card clearly displays:
    - Mosque Name and full street address.
    - Exact distance from you (e.g., *"0.4 km away"* or *"1.2 km away"*).
    - Total worshipper capacity (e.g., *"Capacity: 1,500"*).
    - Amenity badges (Women's section, Parking, Wheelchair, etc.).
    - A prominent **"Directions"** button.
    - A **"View Details"** button.
- **How to use it**:
  - Tap **"Directions"** to immediately open your phone's built-in navigation (Google Maps or Apple Maps) with step-by-step turn guidance.
  - Tap anywhere on the card to open the complete mosque profile.

---

#### 3.3 Mosque Profile & Details (Mosque Bottom Sheet)
- **What it is**: A detailed, slide-up profile window giving you everything you need to know about a specific mosque without navigating away.
- **What you see**:
  - High-quality photo banner of the mosque exterior/interior.
  - Full address and verified worshipper capacity.
  - Two top action buttons:
    - 🧭 **Directions**: Opens navigation directly to the mosque entrance.
    - 📤 **Share**: Lets you send the mosque name, address, and location link to family and friends through WhatsApp, Messages, or social apps.
  - Two dedicated information tabs:
    1. **Prayers Tab**:
       - Displays the specific Jama'at (congregational / Iqamah) prayer times for this mosque.
       - Day navigation arrows (`<` / `>`) to view schedules up to a week in advance.
    2. **Announcements Tab**:
       - A live feed of events, Friday sermon announcements, or lectures posted specifically by this mosque.
- **How to use it**: Swipe down on the top handle bar or tap the `X` button at any time to return to your previous screen.

---

### 4. Islamic Knowledge & Announcements

#### 4.1 Daily Hadith & Wisdom (Daily Hadith Screen)
- **What it is**: A quiet space for daily spiritual reflection, presenting an authenticated Hadith every day.
- **What you see**:
  - **Topic Badge**: Categories like *Character & Manners*, *Sincerity*, *Prayer*, *Charity*, and *Family*.
  - **Arabic Text**: Displayed in large, beautiful Quranic calligraphy typography.
  - **Bilingual Translation Switch**: Easily toggle the translation between **English** and **Urdu**.
  - **Authentic Reference**: Full attribution (e.g., *Sahih al-Bukhari, Book 2, Hadith 11*).
  - **Key Lessons & Commentary**: Practical, easy-to-understand takeaways explaining how to apply the Hadith in daily life.
  - **Action Buttons**:
    - 📋 **Copy**: Copies the Arabic text, translation, and reference to your clipboard in one tap.
    - 📤 **Share**: Generates a formatted message ready to share with friends, family, or WhatsApp study groups.

---

#### 4.2 Announcement Categories (Bottom Tab 2: Announcements)
- **What it is**: A community hub that organizes all mosque notices into 8 clear, visual categories.
- **What you see**: 8 beautifully illustrated category cards:
  1. 💰 **Funding Programs** (`فنڈنگ پروگرامز`): Mosque donations, charity drives, and community welfare funds.
  2. 🏗️ **Masjid Under Construction** (`زیر تعمیر مسجد`): Mosque renovation updates, expansion projects, and repair progress.
  3. 🎙️ **Taqreer / Speeches** (`تقریر`): Islamic lectures, seminars, and talks by guest scholars.
  4. 🕌 **Jummah Khutbah** (`جمعہ خطبہ`): Friday sermon topics, guest Khatibs, and prayer times.
  5. 📅 **Daily Programs** (`روزانہ کے پروگرام`): Regular Dars-e-Quran, Hadith circles, and daily study halaqas.
  6. 🎪 **Mega Programs** (`بڑے پروگرام`): Annual conferences, Eid gatherings, and Seerah programs.
  7. 🕊️ **Janaza / Funerals** (`جنازہ`): Funeral prayer timings, deceased information, and cemetery locations.
  8. 📚 **Madarsa Updates** (`مدرسہ کی تازہ معلومات`): Student admissions, Hifz completions, and examination schedules.
- **How to use it**: Tap any category card to view all current notices belonging to that topic.

---

#### 4.3 Category Announcements Feed & Full Notice View
- **What it is**: The list of all announcements under a chosen topic, plus the full-screen view for any notice you select.
- **What you see**:
  - **Feed View**:
    - Each notice card shows the announcement title, the organizing mosque's name, publication date, and a preview snippet.
    - An image thumbnail if the mosque attached an event flyer.
  - **Full Detail Notice**:
    - Tapping any card opens the complete announcement.
    - Full-resolution event flyer or photo (pinch to zoom).
    - Detailed event description, dates, and timings.
    - Mosque contact details and direct **Share** button.
- **Helpful Tip**: If there are currently no active announcements in a category, a friendly illustration will let you know that everything is up to date.

---

### 5. Profile & Settings

#### 5.1 Settings Screen (Bottom Tab 5: Settings)
- **What it is**: Your account control center, personalization hub, and support center.
- **What you see**:
  - **Profile Summary Header**: Your profile photo, display name, email, and member badge (e.g. *Worshipper*, *Mosque Admin*, or *Super Admin*).
  - **Log Out Button**: A clear button below your profile that asks for confirmation before safely logging you out.
  - **Account Settings**:
    - **Edit Profile**: Update your personal details.
    - **Change Password**: Update your login credentials.
  - **App Preferences**:
    - **Language Selector**: Choose between **English** and **اردو (Urdu)**. Changing language updates all screens instantly without restarting the app.
  - **Help & Support**:
    - **Send Feedback**: Send questions, feature suggestions, or issue reports directly to the app support team.
    - **Privacy Policy & Terms of Service**: Read our commitments to user privacy and data security.
  - **Admin Portals (Role-Protected)**:
    - If you are a designated Mosque Admin or Super Admin, special management buttons appear here. For regular worshippers, these are kept hidden so the screen remains clean and simple.

---

#### 5.2 Edit Profile Screen
- **What it is**: A simple form to keep your personal profile information up to date.
- **What you see**:
  - Your profile photo with a camera badge. Tap it to pick a new photo from your phone's gallery.
  - Form fields for your **Display Name**, **Phone Number**, and **City**.
  - A **"Save Changes"** button.
- **How to use it**: Edit your name or details and tap Save. Your new name will immediately appear on the Home screen greeting.

---

#### 5.3 Change Password Screen
- **What it is**: A secure screen to change your account password whenever you need.
- **What you see**:
  - **Current Password** field.
  - **New Password** field with an interactive password strength indicator.
  - **Confirm New Password** field to ensure there are no typos.
  - Password eye toggles on every field so you can verify what you typed.
  - **"Update Password"** button.
- **How to use it**: Enter your old password, type your new secure password twice, and tap Update Password. You'll receive a confirmation message that your account is secure.

---

### 6. Mosque Admin & Super Admin Features

*(These screens are only visible to authorized mosque administrators and platform caretakers)*

#### 6.1 Mosque Admin Panel
- **Purpose**: Empowers local mosque committees and Imams to keep their mosque's information fresh and accurate for their community.
- **Key Capabilities**:
  - **Assigned Mosque Profile**: Update mosque address, contact phone numbers, capacity, and upload new photos.
  - **Amenity Management**: Check or uncheck amenities (e.g., turn on "Women's Prayer Area" or "Wheelchair Access").
  - **Custom Prayer Timings**: Set the specific Jama'at / Iqamah times followed by your congregation.
  - **Post Community Announcements**: Publish flyers, funeral notifications, or Ramadan schedules directly to the worshippers who follow your mosque.

---

#### 6.2 Super Admin Management Suite
- **Purpose**: Comprehensive platform administration to maintain quality and security across all registered mosques and cities.
- **Key Capabilities**:
  - **Manage Mosques**: Register new mosques, review community submissions, and update geographic coordinates.
  - **Manage Admins**: Assign verified mosque committee members to their specific mosques.
  - **Manage Hadith**: Curate, review, and schedule the daily Ahadith, ensuring verified citations and high-quality translations in English and Urdu.
  - **Manage Announcements**: Broadcast city-wide or emergency notices and moderate community submissions.
  - **Manage Worshippers**: Keep the community safe, moderate user accounts, and review submitted user feedback.

---

## 🏷️ Community Announcement Categories Reference

| Category | Urdu Name | Icon / Symbol | What You Will Find Here |
| :--- | :--- | :---: | :--- |
| **Funding Programs** | فنڈنگ پروگرامز | 💰 Charity Coin | Masjid construction funds, charity appeals, Ramadan donation drives, and utility support. |
| **Masjid Under Construction** | زیر تعمیر مسجد | 🏗️ Minaret & Brick | Progress reports on new mosque builds, hall expansions, carpet replacements, and renovations. |
| **Taqreer / Speeches** | تقریر | 🎙️ Scholar Mic | Guest scholar lectures, weekend Islamic workshops, youth seminars, and public gatherings. |
| **Jummah Khutbah** | جمعہ خطبہ | 🕌 Minbar / Pulpit | Weekly Friday sermon topics, visiting Khatib names, and prayer shift timings. |
| **Daily Programs** | روزانہ کے پروگرام | 📅 Open Book | Daily Dars-e-Quran circles, post-Fajr Hadith readings, and regular evening halaqas. |
| **Mega Programs** | بڑے پروگرام | 🎪 Grand Stage | Annual Islamic conferences, Eid gatherings, Seerah symposiums, and community banquets. |
| **Janaza / Funerals** | جنازہ | 🕊️ Janaza Bier | Timely funeral prayer alerts, deceased names, Janaza prayer times, and graveyard details. |
| **Madarsa Updates** | مدرسہ کی تازہ معلومات | 📚 Quran Tablet | New student admissions, Hifz graduation celebrations, exam schedules, and holiday dates. |

---

## 💡 Helpful Tips for Everyday Use

1. **Keep Location Services On**: For the most accurate prayer times and automatic sorting of the closest mosques, ensure location permission is allowed while using the app.
2. **Offline Prayer Times**: The app caches prayer times for several days in advance. If you lose internet connection in a basement or while traveling, your prayer times and Qibla compass will continue to work smoothly.
3. **Calibrating Your Qibla Compass**: If the compass needle seems sluggish, gently move your phone in a horizontal figure-8 pattern in the air for 3 seconds. Avoid holding your phone near magnetic car mounts or heavy metal objects.
4. **Instant Directions**: On any mosque card, tapping the "Directions" button launches Google Maps or Apple Maps with step-by-step navigation directly to the mosque entrance.
5. **Sharing Daily Hadith**: Tap the share button on the Daily Hadith screen to easily send inspiring reminders to family and friends on WhatsApp or social media.

---

## 💻 Developer Quickstart

For developers running or testing the app locally:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (.env)
cp .env.example .env

# 3. Start the Expo development bundler
npx expo start

# 4. Run with tunnel (for testing on physical mobile devices)
npx expo start --tunnel
```

---

*Alhamdulillah — May this app benefit the Muslim community worldwide and bring peace and ease to your daily prayers.*
