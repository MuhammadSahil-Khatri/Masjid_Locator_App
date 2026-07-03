# Masjid Locator App

A premium, feature-rich cross-platform mobile application designed to help Muslim communities locate nearby mosques, access live and highly accurate prayer times, read announcements, and find the Qibla direction. 

Built using **React Native**, **Expo**, and **TypeScript**, the app integrates with **Supabase** for user authentication, database services, and real-time updates.

---

## 🕋 Key Features

*   **Nearby Mosque Search**: Dynamic search with map visualization to discover nearby masjids and retrieve their locations, contact details, and directions.
*   **Live Prayer Times**: Fetched dynamically using the user's geographical location via the AlAdhan API, featuring a countdown timer to the next prayer and daily timelines.
*   **Qibla Compass**: Real-time Qibla bearing calculation utilizing mobile sensors (magnetometer) to guide worshippers accurately.
*   **Daily Hadith**: Interactive daily Hadith section with support for English and Urdu translations, plus built-in share and copy-to-clipboard functionality.
*   **Mosque Announcements**: Real-time community announcements and updates direct from mosque administrators.
*   **Simulator Master Panel**: An interactive development panel to toggle between personas (`Worshipper`, `Sub-Admin`, `Super-Admin`) to test features and dashboard permissions seamlessly.
*   **Visual Adaptations**: Support for Urdu (RTL) layout rendering, English layout, slate/dark mode styling, and high contrast options.

---

## 🛠️ Technology Stack

*   **Framework**: [Expo](https://expo.dev/) (React Native Managed Workflow)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database & Auth**: [Supabase](https://supabase.com/)
*   **Data Fetching**: [TanStack React Query](https://tanstack.com/query/latest)
*   **Form Management**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
*   **Icons**: [Lucide React Native](https://lucide.dev/)
*   **Map Integration**: [React Native Maps](https://github.com/react-native-maps/react-native-maps)
*   **Local Caching**: MMKV Storage & AsyncStorage

---

## 📂 Project Structure

```text
Masjid_Locator_App/
├── assets/                  # App images, logos, and compass assets
├── dist/                    # Static web builds (ignored in git)
├── src/
│   ├── App.tsx              # Main entry point and provider setup
│   ├── components/          # Reusable UI & card components
│   │   ├── cards/           # Feature card designs (MasjidCard, etc.)
│   │   ├── common/          # Global components (Header, Toasts)
│   │   └── ui/              # Atom-level design system elements (Button, Input, Text)
│   ├── context/             # Global states (AppContext, AuthContext)
│   ├── data/                # Hardcoded/Mock data for fallback scenarios
│   ├── hooks/               # Custom React hooks (location, sensors, queries)
│   ├── lib/                 # Core configurations (Supabase Client client-side setup)
│   ├── navigation/          # Custom router and main app navigators
│   ├── screens/             # Screen layouts (Home, Search, Details, Settings, Auth)
│   ├── services/            # API & local database logic
│   ├── theme/               # Centralized colors, typography, and spacing tokens
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Helper utilities (location calculations, Qibla mathematics)
├── app.json                 # Expo native application configuration
├── eas.json                 # EAS build configuration profiles
├── package.json             # Scripts & dependencies
├── supabase_schema.sql      # Database tables and constraints initialization SQL
└── tsconfig.json            # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Expo Go](https://expo.dev/expo-go) app installed on your physical device, or an Android/iOS emulator configured.

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/MuhammadSahil-Khatri/Masjid_Locator_App.git
    cd Masjid_Locator_App
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env` file in the root directory and copy variables from `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Populate the Supabase connection keys:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    EXPO_PUBLIC_SUPABASE_KEY=your-anon-publishable-key
    ```

### Running the Application

*   **Start the development server**:
    ```bash
    npm start
    ```
*   **Run on Android**:
    ```bash
    npm run android
    ```
*   **Run on iOS**:
    ```bash
    npm run ios
    ```

Scan the QR code displayed in the terminal with your device's camera (iOS) or the Expo Go app (Android) to load the project.

---

## 🔒 Database & Backend Setup

The Supabase database structure can be set up in your Supabase SQL Editor using the schema defined in `supabase_schema.sql`. It configures the following tables:
*   `profiles`: User profiles linked to auth users.
*   `masjids`: Metadata of mosques including lat/lng coordinate pointers.
*   `prayer_times`: Stored times/updates for respective masjids.
*   `announcements`: Notifications and updates published by administrators.
*   `events`: RSVP-enabled events hosted by masjids.
*   `rsvps`: Event registration records linking worshippers to events.
*   `feedback`: User-submitted queries and feedback logs.

---

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.
