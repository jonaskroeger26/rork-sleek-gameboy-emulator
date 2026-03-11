export type RomPlatform = 'gb' | 'gbc' | 'gba';

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
};

export const PLATFORM_CORES: Record<RomPlatform, string> = {
  gb: 'gambatte',
  gbc: 'gambatte',
  gba: 'mgba',
};

export const SUPPORTED_EXTENSIONS = ['gb', 'gbc', 'gba'];
