# RetryX → Solana dApp Store (APK)

This project is a normal **Expo / React Native** Android app. The Solana dApp Store accepts a **signed APK** the same way you would ship to testers—build with EAS, then upload at the publisher portal.

## 1. One-time setup

- [Expo account](https://expo.dev) and [EAS CLI](https://docs.expo.dev/build/setup/): `npm i -g eas-cli`
- Logged in: `eas login`
- This repo already has `extra.eas.projectId` in `app.json`—builds go to that Expo project.

## 2. Build the store APK

From the **`expo/`** directory:

```bash
cd expo
npm install
npm run build:dapp-store
```

This uses the **`dapp-store`** profile in `eas.json` (release **APK**).

Alternatively: `eas build -p android --profile production` (same APK-style output today).

When the build finishes, download the **`.apk`** from the Expo build page.

## 3. Submit

1. Open [Solana dApp Publisher Portal](https://publish.solanamobile.com).
2. Create or select your app; upload the APK; complete metadata (name **RetryX**, description, screenshots, icon).
3. Provide a **privacy policy URL** (required for store listings—host a short page even if the app is offline-first).
4. Pay the publisher fee / sign transactions as prompted.

Official overview: [Solana Mobile – dApp Store](https://docs.solanamobile.com/dapp-store/intro).

## 4. Listing copy (important)

RetryX is a **ROM player**. You do not ship copyrighted games. In the store description, state clearly that users must supply **ROM files they have the right to use** (e.g. homebrew, dumps of games they own, or other lawful sources). That aligns with typical store policies and sets user expectations.

## 5. Optional: PWA + Bubblewrap instead

If you later prefer a **web-only** deploy packaged with **Trusted Web Activity** (no React Native shell), see the general flow in the Snake workspace `docs/DAPP_STORE.md` (Bubblewrap + `assetlinks.json`). This Expo Android build is usually simpler because the app is already native.
