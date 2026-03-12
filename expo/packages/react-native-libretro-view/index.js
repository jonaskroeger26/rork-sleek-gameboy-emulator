import { Platform, UIManager, requireNativeComponent } from 'react-native';

// Avoid crashing the entire app if the native view isn't registered (common in mislinked builds).
// The app can then fall back to the WebView/EmulatorJS path.
let LibretroView = null;
if (Platform.OS === 'android') {
  try {
    const cfg = UIManager.getViewManagerConfig?.('LibretroView');
    if (cfg) {
      LibretroView = requireNativeComponent('LibretroView');
    }
  } catch {
    LibretroView = null;
  }
}

export { LibretroView };
