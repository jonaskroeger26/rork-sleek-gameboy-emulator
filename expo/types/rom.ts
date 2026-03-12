export type RomPlatform = 'gb' | 'gbc' | 'gba' | 'nes' | 'snes' | 'n64' | 'nds' | 'segaMD';

export interface Rom {
  id: string;
  name: string;
  fileName: string;
  fileUri: string;
  platform: RomPlatform;
  addedAt: string;
  lastPlayed?: string;
  coverImage?: string;
}

export interface RomContextType {
  roms: Rom[];
  isLoading: boolean;
  importRom: () => Promise<void>;
  deleteRom: (id: string) => Promise<void>;
  clearAllRoms: () => Promise<void>;
  getRomBase64: (id: string) => Promise<string>;
  updateLastPlayed: (id: string) => Promise<void>;
}

export const PLATFORM_LABELS: Record<RomPlatform, string> = {
  gb: 'Game Boy',
  gbc: 'Game Boy Color',
  gba: 'Game Boy Advance',
  nes: 'NES',
  snes: 'SNES',
  n64: 'Nintendo 64',
  nds: 'Nintendo DS',
  segaMD: 'Sega Genesis',
};

export const PLATFORM_CORES: Record<RomPlatform, string> = {
  gb: 'gambatte',
  gbc: 'gambatte',
  gba: 'mgba',
  nes: 'fceumm',
  snes: 'snes9x',
  n64: 'mupen64plus_next',
  nds: 'melonds',
  segaMD: 'genesis_plus_gx',
};

/** EmulatorJS system IDs / core names - use these for WebView/EmulatorJS */
export const PLATFORM_EJS_SYSTEM: Record<RomPlatform, string> = {
  gb: 'gb',
  gbc: 'gb',
  gba: 'gba',
  nes: 'nes',
  snes: 'snes',
  n64: 'n64',
  nds: 'nds',
  segaMD: 'segaMD',
};

/** EmulatorJS core overrides - use when default core has issues (e.g. DS needs BIOS for melonds) */
export const EJS_CORE_OVERRIDES: Partial<Record<RomPlatform, string>> = {
  nds: 'desmume2015', // melonds requires BIOS; desmume2015 often works without
};

export const SUPPORTED_EXTENSIONS = [
  'gb', 'gbc', 'gba',
  'nes',
  'sfc', 'smc',
  'n64', 'z64', 'v64',
  'nds',
  'gen', 'md', 'smd',
];

export const PLATFORM_LIBRETRO_SYSTEM: Record<RomPlatform, string> = {
  gb: 'Nintendo - Game Boy',
  gbc: 'Nintendo - Game Boy Color',
  gba: 'Nintendo - Game Boy Advance',
  nes: 'Nintendo - Nintendo Entertainment System',
  snes: 'Nintendo - Super Nintendo Entertainment System',
  n64: 'Nintendo - Nintendo 64',
  nds: 'Nintendo - Nintendo DS',
  segaMD: 'Sega - Mega Drive - Genesis',
};

export const EXT_TO_PLATFORM: Record<string, RomPlatform> = {
  gb: 'gb',
  gbc: 'gbc',
  gba: 'gba',
  nes: 'nes',
  sfc: 'snes',
  smc: 'snes',
  n64: 'n64',
  z64: 'n64',
  v64: 'n64',
  nds: 'nds',
  gen: 'segaMD',
  md: 'segaMD',
  smd: 'segaMD',
};
