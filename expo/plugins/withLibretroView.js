const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withLibretroView(config) {
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults?.manifest?.application?.[0];
    if (app?.$) {
      app.$['android:usesCleartextTraffic'] = 'true';
    }
    return cfg;
  });

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const settingsPath = path.join(platformRoot, 'settings.gradle');

      let libretrodroidPath;
      try {
        const pkgPath = require.resolve('react-native-libretro-view/package.json', {
          paths: [projectRoot],
        });
        libretrodroidPath = path.join(
          path.dirname(pkgPath),
          'android',
          'libretrodroid'
        );
      } catch {
        libretrodroidPath = path.join(projectRoot, 'node_modules', 'react-native-libretro-view', 'android', 'libretrodroid');
      }

      if (!fs.existsSync(libretrodroidPath)) {
        console.warn('[withLibretroView] libretrodroid not found at', libretrodroidPath);
        return cfg;
      }

      let contents = fs.readFileSync(settingsPath, 'utf8');

      if (contents.includes(":libretrodroid")) {
        return cfg;
      }

      // Use resolved path (works with file: dep / monorepo). Fallback to node_modules if outside project.
      let relativePath = path.relative(projectRoot, libretrodroidPath).replace(/\\/g, '/');
      if (relativePath.startsWith('..')) {
        relativePath = 'node_modules/react-native-libretro-view/android/libretrodroid';
      }
      const insertion = `
// LibretroDroid vendored in react-native-libretro-view (Delta-style native cores)
include ':libretrodroid'
project(':libretrodroid').projectDir = new File(settingsDir.parentFile, '${relativePath}')
`;
      contents = contents.replace(/include ':app'/, `include ':app'${insertion}`);
      fs.writeFileSync(settingsPath, contents);
      return cfg;
    },
  ]);

  return config;
}

module.exports = withLibretroView;
