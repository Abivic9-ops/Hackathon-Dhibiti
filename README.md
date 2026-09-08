# Dhibiti

**Verify. Protect. Control.**

Dhibiti is a scam-detection and digital-safety companion built for the Kenyan market. It helps you verify suspicious SMS messages, calls, QR codes, links, and phone numbers before money or personal details change hands — and it gives you tools to protect your family and community.

## Features

- **Shield / Check** — Run any message, call description, phone number, Paybill, Till, link, or QR code through a deterministic rules engine that understands English, Kiswahili and Sheng.
- **Why we flagged this** — Each verdict explains, in plain language, the exact patterns that triggered it (urgency, secrecy, payment pressure, impersonation, credential requests, and more).
- **Safe Pay** — Verify a recipient and amount before sending, with an optional countdown lock for high-risk payments.
- **Family circles & group circles** — Share alerts with close family or your chama/SACCO so everyone stays protected.
- **Scam radar** — See what scams are trending in your area based on community reports.
- **Quarantine inbox** — Suspicious SMS are kept out of the way until you decide what to do.
- **Literacy lessons** — 60-second lessons that teach you how scams work and how to verify a real business.
- **Digital literacy & scam simulator** — Learn by example without the risk.
- **English / Kiswahili** — Fully localised for both languages.

## Tech Stack

- **React Native** via **Expo** (SDK 57)
- **TypeScript** (strict)
- **Expo Router** (file-based navigation)
- **Uniwind** + **Tailwind CSS v4** for styling (dark-mode first)
- **HeroUI Native** UI component library
- **React Native Reanimated** for animations
- **Zustand** for state management
- **AsyncStorage** for local persistence
- **react-native-maps** (native) / **pigeon-maps** (web)
- **Workbox** for the installable PWA / offline support
- **oxlint** / **oxfmt** for linting and formatting

## Getting Started

Requirements:

- Node.js `>= 20.19.4`
- npm

```sh
# Install dependencies
npm install

# Copy the environment template and fill in your values
cp .env.example .env

# Start the Expo development server
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `w` for web.

## Scripts

| Command | Description |
|---|---|
| `npm run android` | Run on Android (native build) |
| `npm run ios` | Run on iOS (native build) |
| `npm run lint` | Type-aware linting with oxlint |
| `npm run lint:css` | CSS linting |
| `npm run format` | Format with oxfmt |
| `npm run format:check` | Check formatting |
| `npm run build:pwa` | Export web and generate the PWA service worker |
| `npm run expo-check` | Verify dependency versions match Expo SDK |

## Project Structure

```text
app/          Expo Router screens (tabs, check flow, pay, family, groups, ...)
components/   Reusable UI components (Button, Card, Risk, Motion, ...)
hooks/        Custom React hooks (AsyncStorage, press feedback)
lib/          Core logic (detection engine, store, i18n, theme, types, seed data)
assets/       Static assets (splash background)
public/       Web/PWA assets (manifest, icons, index.html)
eslint-rules/ Custom lint rules
scripts/      Build/CLI helper scripts
```

## Configuration

Environment variables live in `.env` (see `.env.example`):

| Variable | Purpose |
|---|---|
| `DHIBITI_APP_VERSION` | App version override |
| `DHIBITI_IOS_BUNDLE_ID` | iOS bundle identifier (default `com.dhibiti.app`) |
| `DHIBITI_ANDROID_PACKAGE` | Android package (default `com.dhibiti.app`) |
| `DHIBITI_APP_STORE_APP_ID` | iOS App Store ID |

## Testing / Deployment

- **Preview locally**: `npx expo start`
- **Build web / PWA**: `npm run build:pwa`
- **Native builds**: `npx expo run:android` / `npx expo run:ios` (or use EAS Build)
