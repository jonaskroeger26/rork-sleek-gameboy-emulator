#!/usr/bin/env node
/**
 * Downloads LibRetro cores from buildbot for Android.
 * Run: npm install adm-zip && node scripts/download-cores.js
 * Or: npx adm-zip (if needed for unzip)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://buildbot.libretro.com/nightly/android/latest';
const CORES = [
  { name: 'gambatte', abis: ['arm64-v8a', 'armeabi-v7a'] },
  { name: 'mgba', abis: ['arm64-v8a', 'armeabi-v7a'] },
  { name: 'fceumm', abis: ['arm64-v8a', 'armeabi-v7a'] },
  { name: 'snes9x', abis: ['arm64-v8a', 'armeabi-v7a'] },
  { name: 'mupen64plus_next', abis: ['arm64-v8a', 'armeabi-v7a'] },
  { name: 'melonds', abis: ['arm64-v8a', 'armeabi-v7a'] },
  { name: 'genesis_plus_gx', abis: ['arm64-v8a', 'armeabi-v7a'] },
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const outDir = path.join(__dirname, '..', 'android', 'src', 'main', 'jniLibs');
  let AdmZip;
  try {
    AdmZip = require('adm-zip');
  } catch {
    console.error('Run: npm install adm-zip');
    process.exit(1);
  }
  for (const core of CORES) {
    for (const abi of core.abis) {
      const url = `${BASE}/${abi}/${core.name}_libretro_android.so.zip`;
      const dir = path.join(outDir, abi);
      const soPath = path.join(dir, `${core.name}_libretro_android.so`);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(soPath)) {
        console.log(`Skip ${core.name} (${abi})`);
        continue;
      }
      console.log(`Downloading ${core.name} for ${abi}...`);
      try {
        const zip = await download(url);
        const adm = new AdmZip(zip);
        adm.extractAllTo(dir, true);
        console.log(`  Done: ${soPath}`);
      } catch (e) {
        console.error(`  Failed: ${e.message}`);
      }
    }
  }
}

main().catch(console.error);
