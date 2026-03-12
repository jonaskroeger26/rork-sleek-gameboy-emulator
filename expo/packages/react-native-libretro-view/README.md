# react-native-libretro-view

Native LibRetro emulator view for React Native (Delta-style). Loads ROMs directly from file paths—no base64, no HTTP server.

## Supported Cores

- **gambatte** – Game Boy / Game Boy Color
- **mgba** – Game Boy Advance
- **fceumm** – NES
- **snes9x** – SNES
- **mupen64plus_next** – Nintendo 64
- **melonds** – Nintendo DS
- **genesis_plus_gx** – Sega Genesis / Mega Drive

## Setup

1. **Download LibRetro cores** (required for Android):

   ```bash
   cd node_modules/react-native-libretro-view
   npm install adm-zip
   npm run download-cores
   ```

   Or from the package directory:

   ```bash
   cd packages/react-native-libretro-view
   npm run download-cores
   ```

2. **Rebuild** the native app after adding cores:

   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

## Usage

```tsx
import { LibretroView } from 'react-native-libretro-view';

<LibretroView
  style={{ flex: 1 }}
  romPath="/data/data/.../files/roms/game.gb"
  coreName="gambatte"
/>
```

- `romPath`: Full path to the ROM file (or `file://` URI).
- `coreName`: LibRetro core name (`gambatte`, `mgba`, etc.).

## Platform

- **Android**: Native GLRetroView via [LibretroDroid](https://github.com/Swordfish90/LibretroDroid).
- **iOS / Web**: Not implemented; use EmulatorJS or another fallback.
