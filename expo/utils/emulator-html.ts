export function getEmulatorHtml(base64: string, core: string): string {
  const cleanBase64 = base64.replace(/data:[^;]+;base64,/g, '').replace(/[\r\n\s]/g, '');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%; height: 100%;
      overflow: hidden; background: #000;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
    }

    #top-bar {
      width: 100%;
      flex: 0 0 8%;
      background: #000;
    }

    #screen-area {
      width: 100%;
      flex: 0 0 40%;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    #game {
      width: 100%;
      aspect-ratio: 3/2;
      max-height: 100%;
      position: relative;
      overflow: hidden;
      background: #000;
    }

    #game > div,
    #game > div > div,
    #game > div > div > div {
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      transform: none !important;
      -webkit-transform: none !important;
      transform-origin: center center !important;
    }

    #game canvas {
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
      image-rendering: pixelated;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      transform: none !important;
      -webkit-transform: none !important;
      transform-origin: center center !important;
    }

    .ejs--bar,
    .ejs_menu_bar,
    .ejs_menu_bar_hidden,
    .ejs--controls,
    .ejs--virtual-gamepad,
    .ejs_virtualGamepad_container,
    .ejs_game_touch_overlay,
    .ejs--touch-controls-bar,
    .ejs_cheat_menu,
    .ejs_settings_menu,
    .ejs--settings,
    .ejs--save-state,
    .ejs--load-state,
    .ejs_context_menu,
    [class*="ejs_virtualGamepad"],
    [class*="ejs--overlay"],
    [class*="ejs_overlay"],
    [class*="touch-controls"],
    [class*="ejs--bar"],
    [class*="ejs_menu"] {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
    }

    #game > div > div:not(:first-child) {
      display: none !important;
    }

    #controls-area {
      width: 100%;
      flex: 1 1 auto;
      background: linear-gradient(170deg, #0f0f1a 0%, #0a0a14 40%, #0d0b1e 100%);
      position: relative;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      border-top: 1px solid rgba(20, 241, 149, 0.15);
    }

    .shoulder-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0;
      flex-shrink: 0;
      position: relative;
    }

    .shoulder-btn {
      width: 28%;
      height: 34px;
      border-radius: 0 0 10px 10px;
      background: linear-gradient(180deg, #1a1a2e 0%, #12121f 100%);
      border: 1px solid rgba(153, 69, 255, 0.25);
      border-top: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9945FF;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 2px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: all 0.06s ease;
      box-shadow: 0 2px 8px rgba(153, 69, 255, 0.15), inset 0 1px 0 rgba(153, 69, 255, 0.1);
    }
    .shoulder-btn:active, .shoulder-btn.pressed {
      background: linear-gradient(180deg, #9945FF 0%, #7B2FE0 100%);
      color: #fff;
      box-shadow: 0 0 16px rgba(153, 69, 255, 0.4);
      transform: scaleY(0.95);
    }

    .shoulder-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(90deg, #14F195, #9945FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 5px;
      text-transform: uppercase;
      pointer-events: none;
      opacity: 0.5;
    }

    .controls-main {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 10px;
      flex: 1 1 auto;
    }

    .dpad-container {
      width: 150px;
      height: 150px;
      position: relative;
    }

    .dpad-bg {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 150px;
      height: 150px;
    }

    .dpad-cross {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 150px;
      height: 150px;
      pointer-events: none;
    }

    .dpad-cross-v {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 50px;
      height: 150px;
      background: linear-gradient(180deg, #1e1e30 0%, #16162a 30%, #121225 70%, #16162a 100%);
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(20, 241, 149, 0.08);
      border: 1px solid rgba(20, 241, 149, 0.12);
    }

    .dpad-cross-h {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      width: 150px;
      height: 50px;
      background: linear-gradient(180deg, #1e1e30 0%, #16162a 30%, #121225 70%, #16162a 100%);
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(20, 241, 149, 0.08);
      border: 1px solid rgba(20, 241, 149, 0.12);
    }

    .dpad-center-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: radial-gradient(circle, #14F195 0%, #0bc47a 100%);
      box-shadow: 0 0 8px rgba(20, 241, 149, 0.3), inset 0 1px 2px rgba(0,0,0,0.2);
      z-index: 3;
      pointer-events: none;
    }

    .dpad-btn {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      -webkit-tap-highlight-color: transparent;
      cursor: pointer;
      z-index: 4;
    }

    .dpad-btn:active, .dpad-btn.pressed {
      background: transparent;
    }

    .dpad-up {
      width: 50px;
      height: 65px;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 10px 10px 0 0;
    }
    .dpad-down {
      width: 50px;
      height: 65px;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 0 0 10px 10px;
    }
    .dpad-left {
      width: 65px;
      height: 50px;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      border-radius: 10px 0 0 10px;
    }
    .dpad-right {
      width: 65px;
      height: 50px;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      border-radius: 0 10px 10px 0;
    }

    .dpad-arrow {
      width: 0;
      height: 0;
      border-style: solid;
      opacity: 0.35;
    }
    .dpad-up .dpad-arrow {
      border-width: 0 7px 10px 7px;
      border-color: transparent transparent #14F195 transparent;
    }
    .dpad-down .dpad-arrow {
      border-width: 10px 7px 0 7px;
      border-color: #14F195 transparent transparent transparent;
    }
    .dpad-left .dpad-arrow {
      border-width: 7px 10px 7px 0;
      border-color: transparent #14F195 transparent transparent;
    }
    .dpad-right .dpad-arrow {
      border-width: 7px 0 7px 10px;
      border-color: transparent transparent transparent #14F195;
    }
    .dpad-btn:active .dpad-arrow, .dpad-btn.pressed .dpad-arrow {
      opacity: 0.35;
    }

    .ab-container {
      position: relative;
      width: 150px;
      height: 150px;
    }

    .action-btn {
      position: absolute;
      width: 66px;
      height: 66px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      border: none;
      transition: all 0.06s ease;
    }
    .action-btn:active, .action-btn.pressed {
      transform: scale(0.93);
    }

    .btn-a {
      right: 4px;
      top: 8px;
      background: linear-gradient(135deg, #9945FF 0%, #7B2FE0 100%);
      color: rgba(255,255,255,0.9);
      box-shadow: 0 3px 12px rgba(153, 69, 255, 0.4), inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.2);
      border: 1px solid rgba(153, 69, 255, 0.5);
    }
    .btn-a:active, .btn-a.pressed {
      background: linear-gradient(135deg, #B06CFF 0%, #9945FF 100%);
      box-shadow: 0 0 20px rgba(153, 69, 255, 0.5);
    }

    .btn-b {
      left: 16px;
      bottom: 8px;
      background: linear-gradient(135deg, #14F195 0%, #0bc47a 100%);
      color: rgba(0,0,0,0.7);
      box-shadow: 0 3px 12px rgba(20, 241, 149, 0.3), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.15);
      border: 1px solid rgba(20, 241, 149, 0.5);
    }
    .btn-b:active, .btn-b.pressed {
      background: linear-gradient(135deg, #3DFFA8 0%, #14F195 100%);
      box-shadow: 0 0 20px rgba(20, 241, 149, 0.4);
    }



    .bottom-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 24px;
      padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
      flex-shrink: 0;
    }

    .meta-btn-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .meta-btn {
      width: 52px;
      height: 20px;
      border-radius: 10px;
      background: linear-gradient(180deg, #222238 0%, #181828 100%);
      border: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: all 0.08s ease;
      box-shadow: 0 1px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
    }
    .meta-btn:active, .meta-btn.pressed {
      background: linear-gradient(180deg, #2a2a44 0%, #1e1e34 100%);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.6);
      transform: scaleY(0.92);
    }

    .meta-btn-inner {
      width: 18px;
      height: 4px;
      border-radius: 2px;
      background: rgba(255,255,255,0.12);
    }

    .meta-btn-menu {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: linear-gradient(145deg, #1e1e34 0%, #14142a 100%);
      border: 1px solid rgba(20, 241, 149, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: all 0.08s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
    }
    .meta-btn-menu:active {
      background: linear-gradient(145deg, #2a2a44 0%, #1e1e34 100%);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
      transform: scale(0.94);
    }
    .meta-btn-menu-dots {
      display: flex;
      gap: 3px;
    }
    .meta-btn-menu-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: linear-gradient(135deg, #14F195 0%, #9945FF 100%);
      opacity: 0.7;
    }

    .meta-label {
      color: rgba(255,255,255,0.25);
      font-size: 8px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .center-meta {
      display: flex;
      gap: 24px;
      align-items: center;
    }

    .retryx-logo {
      background: linear-gradient(90deg, #14F195, #9945FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 3px;
      opacity: 0.35;
    }

    /* MENU OVERLAY */
    #menu-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      z-index: 50000;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    #menu-overlay.visible {
      display: flex;
    }

    .menu-card {
      width: 82%;
      max-width: 320px;
      background: #1e1e2e;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .menu-header {
      padding: 18px 20px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .menu-title {
      font-size: 17px;
      font-weight: 700;
      color: #eee;
      letter-spacing: 0.3px;
    }

    .menu-close {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      border: none;
      color: #999;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .menu-close:active {
      background: rgba(255,255,255,0.15);
    }

    .menu-items {
      padding: 6px 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.1s;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
    }
    .menu-item:active {
      background: rgba(255,255,255,0.06);
    }

    .menu-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .menu-icon-save { background: rgba(16,185,129,0.15); }
    .menu-icon-load { background: rgba(99,102,241,0.15); }
    .menu-icon-cheat { background: rgba(245,158,11,0.15); }
    .menu-icon-audio { background: rgba(236,72,153,0.15); }
    .menu-icon-fast { background: rgba(59,130,246,0.15); }
    .menu-icon-reset { background: rgba(239,68,68,0.15); }

    .menu-item-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .menu-item-title {
      font-size: 15px;
      font-weight: 600;
      color: #ddd;
    }

    .menu-item-sub {
      font-size: 11px;
      color: #777;
    }

    .menu-sep {
      height: 1px;
      background: rgba(255,255,255,0.05);
      margin: 4px 20px;
    }

    /* CHEAT OVERLAY */
    #cheat-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.9);
      z-index: 60000;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    #cheat-overlay.visible {
      display: flex;
    }

    .cheat-card {
      width: 88%;
      max-width: 340px;
      background: #1e1e2e;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .cheat-header {
      padding: 18px 20px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cheat-title {
      font-size: 17px;
      font-weight: 700;
      color: #eee;
    }

    .cheat-body {
      padding: 16px 20px;
    }

    .cheat-label {
      font-size: 12px;
      color: #888;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .cheat-input {
      width: 100%;
      padding: 12px 14px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #eee;
      font-size: 14px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      outline: none;
      resize: vertical;
      min-height: 80px;
    }
    .cheat-input:focus {
      border-color: rgba(20, 241, 149, 0.4);
    }

    .cheat-hint {
      font-size: 11px;
      color: #555;
      margin-top: 8px;
      line-height: 1.4;
    }

    .cheat-actions {
      padding: 12px 20px 18px;
      display: flex;
      gap: 10px;
    }

    .cheat-btn {
      flex: 1;
      padding: 12px;
      border-radius: 10px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    .cheat-btn-cancel {
      background: rgba(255,255,255,0.08);
      color: #aaa;
    }

    .cheat-btn-apply {
      background: linear-gradient(135deg, #14F195 0%, #0bc47a 100%);
      color: #000;
    }
    .cheat-btn-apply:active {
      background: linear-gradient(135deg, #3DFFA8 0%, #14F195 100%);
    }

    /* SLOTS OVERLAY */
    #slots-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.88);
      z-index: 55000;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    #slots-overlay.visible {
      display: flex;
    }

    .slots-card {
      width: 88%;
      max-width: 340px;
      background: #1a1a2e;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.7);
      border: 1px solid rgba(255,255,255,0.08);
      max-height: 75vh;
      display: flex;
      flex-direction: column;
    }

    .slots-header {
      padding: 18px 20px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .slots-title {
      font-size: 17px;
      font-weight: 700;
      color: #eee;
      letter-spacing: 0.3px;
    }

    .slots-body {
      padding: 8px 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      flex: 1;
    }

    .slot-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.1s;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
    }
    .slot-item:active {
      background: rgba(20, 241, 149, 0.08);
    }

    .slot-num {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 800;
      flex-shrink: 0;
      color: #555;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
    }
    .slot-num.has-data {
      background: linear-gradient(135deg, rgba(20,241,149,0.15) 0%, rgba(153,69,255,0.15) 100%);
      border-color: rgba(20,241,149,0.2);
      color: #14F195;
    }

    .slot-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .slot-label {
      font-size: 15px;
      font-weight: 600;
      color: #ddd;
    }
    .slot-label.empty {
      color: #555;
    }

    .slot-meta {
      font-size: 11px;
      color: #666;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .slot-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .slot-meta-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #444;
    }

    .slot-arrow {
      color: #444;
      font-size: 18px;
      flex-shrink: 0;
    }

    .slot-delete {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(239,68,68,0.12);
      border: none;
      color: #ef4444;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      -webkit-tap-highlight-color: transparent;
    }
    .slot-delete:active {
      background: rgba(239,68,68,0.25);
    }

    /* TOAST */
    #toast {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: rgba(0,0,0,0.85);
      color: #fff;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      z-index: 70000;
      opacity: 0;
      transition: all 0.25s ease;
      pointer-events: none;
      text-align: center;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    #toast.show {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    #boot-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: #000; z-index: 99999;
      transition: opacity 0.4s ease;
      pointer-events: none;
    }
    #boot-overlay.hidden { opacity: 0; }
    #boot-overlay.gone { display: none; }
    .spinner {
      width: 36px; height: 36px;
      border: 2px solid rgba(20, 241, 149, 0.15);
      border-top-color: rgba(20, 241, 149, 0.8);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .boot-text { margin-top: 16px; color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500; }
    .boot-sub { margin-top: 6px; color: rgba(255,255,255,0.25); font-size: 12px; }
  </style>
</head>
<body>
  <div id="boot-overlay">
    <div class="spinner"></div>
    <div class="boot-text" id="boot-text">Initializing Emulator</div>
    <div class="boot-sub" id="boot-sub">Preparing ROM data...</div>
  </div>

  <div id="top-bar"></div>
  <div id="screen-area">
    <div id="game"></div>
  </div>

  <div id="controls-area">
    <div class="shoulder-row">
      <div class="shoulder-btn" id="btn-l" data-key="l">L</div>
      <div class="shoulder-label">RETRYX</div>
      <div class="shoulder-btn" id="btn-r" data-key="r">R</div>
    </div>

    <div class="controls-main">
      <div class="dpad-container">
        <div class="dpad-bg">
          <div class="dpad-cross">
            <div class="dpad-cross-h"></div>
            <div class="dpad-cross-v"></div>
            <div class="dpad-center-circle"></div>
          </div>
          <div class="dpad-btn dpad-up" id="btn-up" data-key="up"><div class="dpad-arrow"></div></div>
          <div class="dpad-btn dpad-down" id="btn-down" data-key="down"><div class="dpad-arrow"></div></div>
          <div class="dpad-btn dpad-left" id="btn-left" data-key="left"><div class="dpad-arrow"></div></div>
          <div class="dpad-btn dpad-right" id="btn-right" data-key="right"><div class="dpad-arrow"></div></div>
        </div>
      </div>

      <div class="ab-container">
        <div class="action-btn btn-a" id="btn-a" data-key="a">A</div>
        <div class="action-btn btn-b" id="btn-b" data-key="b">B</div>
      </div>
    </div>

    <div class="bottom-row">
      <div class="meta-btn-wrap">
        <div class="meta-btn-menu" id="btn-menu"><div class="meta-btn-menu-dots"><div class="meta-btn-menu-dot"></div><div class="meta-btn-menu-dot"></div><div class="meta-btn-menu-dot"></div></div></div>
        <div class="meta-label">MENU</div>
      </div>
      <div class="center-meta">
        <div class="meta-btn-wrap">
          <div class="meta-btn" id="btn-select" data-key="select"><div class="meta-btn-inner"></div></div>
          <div class="meta-label">SELECT</div>
        </div>
        <div class="meta-btn-wrap">
          <div class="meta-btn" id="btn-start" data-key="start"><div class="meta-btn-inner"></div></div>
          <div class="meta-label">START</div>
        </div>
      </div>
      <div class="retryx-logo">RETRYX</div>
    </div>
  </div>

  <!-- MENU OVERLAY -->
  <div id="menu-overlay">
    <div class="menu-card">
      <div class="menu-header">
        <div class="menu-title">Menu</div>
        <div class="menu-close" id="menu-close-btn">&times;</div>
      </div>
      <div class="menu-items">
        <div class="menu-item" id="menu-save">
          <div class="menu-icon menu-icon-save">💾</div>
          <div class="menu-item-text">
            <div class="menu-item-title">Save State</div>
            <div class="menu-item-sub">Save your current progress</div>
          </div>
        </div>
        <div class="menu-item" id="menu-load">
          <div class="menu-icon menu-icon-load">📂</div>
          <div class="menu-item-text">
            <div class="menu-item-title">Load State</div>
            <div class="menu-item-sub">Restore saved progress</div>
          </div>
        </div>
        <div class="menu-sep"></div>
        <div class="menu-item" id="menu-cheat">
          <div class="menu-icon menu-icon-cheat">⚡</div>
          <div class="menu-item-text">
            <div class="menu-item-title">Cheats</div>
            <div class="menu-item-sub">Enter cheat codes</div>
          </div>
        </div>
        <div class="menu-item" id="menu-audio">
          <div class="menu-icon menu-icon-audio">🔊</div>
          <div class="menu-item-text">
            <div class="menu-item-title" id="audio-label">Mute Audio</div>
            <div class="menu-item-sub" id="audio-sub">Sound is currently on</div>
          </div>
        </div>
        <div class="menu-sep"></div>
        <div class="menu-item" id="menu-fast">
          <div class="menu-icon menu-icon-fast">⏩</div>
          <div class="menu-item-text">
            <div class="menu-item-title" id="fast-label">Fast Forward</div>
            <div class="menu-item-sub" id="fast-sub">Speed up gameplay</div>
          </div>
        </div>
        <div class="menu-item" id="menu-reset">
          <div class="menu-icon menu-icon-reset">🔄</div>
          <div class="menu-item-text">
            <div class="menu-item-title">Reset Game</div>
            <div class="menu-item-sub">Restart from beginning</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- CHEAT OVERLAY -->
  <div id="cheat-overlay">
    <div class="cheat-card">
      <div class="cheat-header">
        <div class="cheat-title">Enter Cheat Code</div>
        <div class="menu-close" id="cheat-close-btn">&times;</div>
      </div>
      <div class="cheat-body">
        <div class="cheat-label">GameShark / Action Replay Code</div>
        <textarea class="cheat-input" id="cheat-input" placeholder="e.g. 82003884 0001"></textarea>
        <div class="cheat-hint">Enter one code per line. Supports GameShark and Action Replay formats.</div>
      </div>
      <div class="cheat-actions">
        <div class="cheat-btn cheat-btn-cancel" id="cheat-cancel">Cancel</div>
        <div class="cheat-btn cheat-btn-apply" id="cheat-apply">Apply</div>
      </div>
    </div>
  </div>

  <!-- SLOTS OVERLAY -->
  <div id="slots-overlay">
    <div class="slots-card">
      <div class="slots-header">
        <div class="slots-title" id="slots-title">Save State</div>
        <div class="menu-close" id="slots-close-btn">&times;</div>
      </div>
      <div class="slots-body" id="slots-body"></div>
    </div>
  </div>

  <!-- TOAST -->
  <div id="toast"></div>

  <script>
    (function() {
      var dismissed = false;
      var audioMuted = false;
      var fastForward = false;
      var gameStartTime = Date.now();
      var SAVE_SLOTS_KEY = 'retryx_saves';
      var MAX_SLOTS = 8;

      var keyMap = {
        up:     { key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38 },
        down:   { key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40 },
        left:   { key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37 },
        right:  { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
        a:      { key: 'z',          code: 'KeyZ',       keyCode: 90 },
        b:      { key: 'x',          code: 'KeyX',       keyCode: 88 },
        start:  { key: 'Enter',      code: 'Enter',      keyCode: 13 },
        select: { key: 'Shift',      code: 'ShiftLeft',  keyCode: 16 },
        l:      { key: 'q',          code: 'KeyQ',       keyCode: 81 },
        r:      { key: 'e',          code: 'KeyE',       keyCode: 69 }
      };

      function fireKey(action, type) {
        var m = keyMap[action];
        if (!m) return;
        var props = {
          key: m.key, code: m.code, keyCode: m.keyCode, which: m.keyCode,
          bubbles: true, cancelable: true
        };
        var evt1 = new KeyboardEvent(type, props);
        document.dispatchEvent(evt1);
        var evt2 = new KeyboardEvent(type, props);
        document.body.dispatchEvent(evt2);
        var canvas = document.querySelector('#game canvas');
        if (canvas) {
          var evt3 = new KeyboardEvent(type, props);
          canvas.dispatchEvent(evt3);
        }
        var gameDiv = document.getElementById('game');
        if (gameDiv) {
          var evt4 = new KeyboardEvent(type, props);
          gameDiv.dispatchEvent(evt4);
        }
      }

      function setupBtn(el) {
        if (!el) return;
        var action = el.getAttribute('data-key');
        if (!action) return;
        if (action === 'up' || action === 'down' || action === 'left' || action === 'right') return;

        function down(e) {
          e.preventDefault();
          el.classList.add('pressed');
          fireKey(action, 'keydown');
        }
        function up(e) {
          e.preventDefault();
          el.classList.remove('pressed');
          fireKey(action, 'keyup');
        }

        el.addEventListener('touchstart', down, { passive: false });
        el.addEventListener('touchend', up, { passive: false });
        el.addEventListener('touchcancel', up, { passive: false });
        el.addEventListener('mousedown', down);
        el.addEventListener('mouseup', up);
        el.addEventListener('mouseleave', up);
      }

      document.querySelectorAll('[data-key]').forEach(setupBtn);

      // D-PAD with drag support and center dead zone
      (function() {
        var dpadContainer = document.querySelector('.dpad-container');
        if (!dpadContainer) return;
        var activeDirs = {};
        var btnUp = document.getElementById('btn-up');
        var btnDown = document.getElementById('btn-down');
        var btnLeft = document.getElementById('btn-left');
        var btnRight = document.getElementById('btn-right');
        var dirBtns = { up: btnUp, down: btnDown, left: btnLeft, right: btnRight };
        var DEAD_ZONE = 0.18;

        function getDirsFromTouch(touch) {
          var rect = dpadContainer.getBoundingClientRect();
          var cx = rect.left + rect.width / 2;
          var cy = rect.top + rect.height / 2;
          var dx = (touch.clientX - cx) / (rect.width / 2);
          var dy = (touch.clientY - cy) / (rect.height / 2);
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < DEAD_ZONE) return [];
          var angle = Math.atan2(dy, dx) * (180 / Math.PI);
          var dirs = [];
          if (angle >= -157.5 && angle < -112.5) { dirs.push('up'); dirs.push('left'); }
          else if (angle >= -112.5 && angle < -67.5) { dirs.push('up'); }
          else if (angle >= -67.5 && angle < -22.5) { dirs.push('up'); dirs.push('right'); }
          else if (angle >= -22.5 && angle < 22.5) { dirs.push('right'); }
          else if (angle >= 22.5 && angle < 67.5) { dirs.push('down'); dirs.push('right'); }
          else if (angle >= 67.5 && angle < 112.5) { dirs.push('down'); }
          else if (angle >= 112.5 && angle < 157.5) { dirs.push('down'); dirs.push('left'); }
          else { dirs.push('left'); }
          return dirs;
        }

        function updateDpad(dirs) {
          var allDirs = ['up','down','left','right'];
          var newActive = {};
          dirs.forEach(function(d) { newActive[d] = true; });
          allDirs.forEach(function(d) {
            if (newActive[d] && !activeDirs[d]) {
              fireKey(d, 'keydown');
              if (dirBtns[d]) dirBtns[d].classList.add('pressed');
            } else if (!newActive[d] && activeDirs[d]) {
              fireKey(d, 'keyup');
              if (dirBtns[d]) dirBtns[d].classList.remove('pressed');
            }
          });
          activeDirs = newActive;
        }

        function releaseAll() {
          ['up','down','left','right'].forEach(function(d) {
            if (activeDirs[d]) {
              fireKey(d, 'keyup');
              if (dirBtns[d]) dirBtns[d].classList.remove('pressed');
            }
          });
          activeDirs = {};
        }

        dpadContainer.addEventListener('touchstart', function(e) {
          e.preventDefault();
          var touch = e.touches[0];
          updateDpad(getDirsFromTouch(touch));
        }, { passive: false });

        dpadContainer.addEventListener('touchmove', function(e) {
          e.preventDefault();
          var touch = e.touches[0];
          updateDpad(getDirsFromTouch(touch));
        }, { passive: false });

        dpadContainer.addEventListener('touchend', function(e) {
          e.preventDefault();
          if (e.touches.length === 0) releaseAll();
          else updateDpad(getDirsFromTouch(e.touches[0]));
        }, { passive: false });

        dpadContainer.addEventListener('touchcancel', function(e) {
          e.preventDefault();
          releaseAll();
        }, { passive: false });

        // Mouse fallback
        var mouseDown = false;
        dpadContainer.addEventListener('mousedown', function(e) {
          e.preventDefault();
          mouseDown = true;
          updateDpad(getDirsFromTouch(e));
        });
        document.addEventListener('mousemove', function(e) {
          if (!mouseDown) return;
          updateDpad(getDirsFromTouch(e));
        });
        document.addEventListener('mouseup', function() {
          if (!mouseDown) return;
          mouseDown = false;
          releaseAll();
        });
      })();

      function showToast(msg) {
        var t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function() { t.classList.remove('show'); }, 1800);
      }

      // MENU LOGIC
      var menuOverlay = document.getElementById('menu-overlay');
      var cheatOverlay = document.getElementById('cheat-overlay');

      var menuBtn = document.getElementById('btn-menu');
      menuBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        menuOverlay.classList.add('visible');
      }, { passive: false });
      menuBtn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        menuOverlay.classList.add('visible');
      });

      function closeMenu() {
        menuOverlay.classList.remove('visible');
      }

      document.getElementById('menu-close-btn').addEventListener('click', closeMenu);
      menuOverlay.addEventListener('click', function(e) {
        if (e.target === menuOverlay) closeMenu();
      });

      function getSaveSlots() {
        try {
          var raw = localStorage.getItem(SAVE_SLOTS_KEY);
          if (raw) return JSON.parse(raw);
        } catch(e) {}
        return {};
      }

      function setSaveSlots(slots) {
        try {
          localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
        } catch(e) { console.log('[Menu] localStorage write failed'); }
      }

      function formatDate(ts) {
        var d = new Date(ts);
        var now = new Date();
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var time = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
        if (d.toDateString() === now.toDateString()) return 'Today, ' + time;
        var yesterday = new Date(now); yesterday.setDate(yesterday.getDate()-1);
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday, ' + time;
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + time;
      }

      function formatPlayTime(ms) {
        var totalSec = Math.floor(ms / 1000);
        var h = Math.floor(totalSec / 3600);
        var m = Math.floor((totalSec % 3600) / 60);
        if (h > 0) return h + 'h ' + m + 'm';
        if (m > 0) return m + 'm';
        return '<1m';
      }

      function getSessionPlayTime() {
        return Date.now() - gameStartTime;
      }

      var slotsOverlay = document.getElementById('slots-overlay');
      var slotsBody = document.getElementById('slots-body');
      var slotsTitle = document.getElementById('slots-title');
      var currentSlotMode = 'save';

      function closeSlots() {
        slotsOverlay.classList.remove('visible');
      }

      document.getElementById('slots-close-btn').addEventListener('click', closeSlots);
      slotsOverlay.addEventListener('click', function(e) {
        if (e.target === slotsOverlay) closeSlots();
      });

      function openSlotsUI(mode) {
        currentSlotMode = mode;
        slotsTitle.textContent = mode === 'save' ? 'Save State' : 'Load State';
        var slots = getSaveSlots();
        slotsBody.innerHTML = '';

        for (var i = 1; i <= MAX_SLOTS; i++) {
          (function(slotIdx) {
            var data = slots['slot_' + slotIdx];
            var item = document.createElement('div');
            item.className = 'slot-item';

            var numDiv = document.createElement('div');
            numDiv.className = 'slot-num' + (data ? ' has-data' : '');
            numDiv.textContent = slotIdx;

            var infoDiv = document.createElement('div');
            infoDiv.className = 'slot-info';

            var label = document.createElement('div');
            label.className = 'slot-label' + (data ? '' : ' empty');
            label.textContent = data ? 'Slot ' + slotIdx : 'Empty Slot';

            infoDiv.appendChild(label);

            if (data) {
              var meta = document.createElement('div');
              meta.className = 'slot-meta';
              meta.innerHTML = '<span class="slot-meta-item">' + formatDate(data.savedAt) + '</span>' +
                '<span class="slot-meta-dot"></span>' +
                '<span class="slot-meta-item">Played ' + formatPlayTime(data.playTime || 0) + '</span>';
              infoDiv.appendChild(meta);
            } else {
              var meta = document.createElement('div');
              meta.className = 'slot-meta';
              meta.innerHTML = mode === 'save' ? '<span style="color:#555">Tap to save here</span>' : '<span style="color:#555">No data</span>';
              infoDiv.appendChild(meta);
            }

            var arrow = document.createElement('div');
            arrow.className = 'slot-arrow';

            item.appendChild(numDiv);
            item.appendChild(infoDiv);

            if (mode === 'load' && data) {
              var del = document.createElement('div');
              del.className = 'slot-delete';
              del.innerHTML = '&times;';
              del.addEventListener('click', function(e) {
                e.stopPropagation();
                delete slots['slot_' + slotIdx];
                setSaveSlots(slots);
                showToast('Slot ' + slotIdx + ' deleted');
                openSlotsUI(mode);
              });
              item.appendChild(del);
            }

            arrow.textContent = mode === 'save' ? '→' : (data ? '→' : '');
            item.appendChild(arrow);

            item.addEventListener('click', function() {
              if (mode === 'save') {
                doSaveToSlot(slotIdx);
              } else {
                if (data) doLoadFromSlot(slotIdx);
                else showToast('Slot is empty');
              }
            });

            slotsBody.appendChild(item);
          })(i);
        }

        slotsOverlay.classList.add('visible');
      }

      function doSaveToSlot(slotIdx) {
        closeSlots();
        try {
          var emu = window.EJS_emulator;
          if (emu && emu.gameManager) {
            console.log('[Menu] Saving to slot', slotIdx);
            var result = emu.gameManager.getState();
            if (result && typeof result.then === 'function') {
              result.then(function(state) {
                if (state) {
                  finishSave(slotIdx, state);
                } else {
                  showToast('Save failed - no data');
                }
              }).catch(function(e) {
                console.log('[Menu] Async save error:', e);
                showToast('Save failed');
              });
            } else if (result) {
              finishSave(slotIdx, result);
            } else {
              showToast('Save failed - no data');
            }
            return;
          }
        } catch(e) { console.log('[Menu] Save error:', e); }
        showToast('Save not available');
      }

      function finishSave(slotIdx, stateRaw) {
        var stateArr = stateRaw instanceof Uint8Array ? stateRaw : new Uint8Array(stateRaw);
        var b64 = '';
        var chunk = 8192;
        for (var i = 0; i < stateArr.length; i += chunk) {
          b64 += String.fromCharCode.apply(null, stateArr.subarray(i, Math.min(i + chunk, stateArr.length)));
        }
        var encoded = btoa(b64);
        var slots = getSaveSlots();
        slots['slot_' + slotIdx] = {
          data: encoded,
          savedAt: Date.now(),
          playTime: getSessionPlayTime(),
          size: stateArr.length
        };
        setSaveSlots(slots);
        showToast('Saved to Slot ' + slotIdx + ' ✓');
        console.log('[Menu] State saved to slot', slotIdx, 'size:', stateArr.length);
      }

      // SAVE STATE
      document.getElementById('menu-save').addEventListener('click', function() {
        closeMenu();
        setTimeout(function() { openSlotsUI('save'); }, 150);
      });

      function doLoadFromSlot(slotIdx) {
        closeSlots();
        try {
          var slots = getSaveSlots();
          var slotData = slots['slot_' + slotIdx];
          if (!slotData || !slotData.data) {
            showToast('Slot is empty');
            return;
          }
          var raw = atob(slotData.data);
          var stateArr = new Uint8Array(raw.length);
          for (var i = 0; i < raw.length; i++) stateArr[i] = raw.charCodeAt(i);

          var emu = window.EJS_emulator;
          if (emu && emu.gameManager) {
            console.log('[Menu] Loading from slot', slotIdx, 'size:', stateArr.length);
            var result = emu.gameManager.loadState(stateArr);
            if (result && typeof result.then === 'function') {
              result.then(function() {
                showToast('Slot ' + slotIdx + ' Loaded ✓');
                console.log('[Menu] State loaded (async)');
              }).catch(function(e) {
                console.log('[Menu] Async load error:', e);
                try {
                  emu.gameManager.loadState(stateArr.buffer);
                  showToast('Slot ' + slotIdx + ' Loaded ✓');
                } catch(e2) {
                  showToast('Load failed');
                  console.log('[Menu] Fallback load error:', e2);
                }
              });
            } else {
              showToast('Slot ' + slotIdx + ' Loaded ✓');
              console.log('[Menu] State loaded (sync)');
            }
            return;
          }
        } catch(e) { console.log('[Menu] Load error:', e); }
        showToast('Load failed');
      }

      // LOAD STATE
      document.getElementById('menu-load').addEventListener('click', function() {
        closeMenu();
        setTimeout(function() { openSlotsUI('load'); }, 150);
      });

      // CHEATS
      document.getElementById('menu-cheat').addEventListener('click', function() {
        closeMenu();
        setTimeout(function() {
          cheatOverlay.classList.add('visible');
        }, 200);
      });

      document.getElementById('cheat-close-btn').addEventListener('click', function() {
        cheatOverlay.classList.remove('visible');
      });
      document.getElementById('cheat-cancel').addEventListener('click', function() {
        cheatOverlay.classList.remove('visible');
      });
      cheatOverlay.addEventListener('click', function(e) {
        if (e.target === cheatOverlay) cheatOverlay.classList.remove('visible');
      });

      document.getElementById('cheat-apply').addEventListener('click', function() {
        var code = document.getElementById('cheat-input').value.trim();
        if (!code) {
          showToast('Enter a cheat code first');
          return;
        }
        cheatOverlay.classList.remove('visible');
        try {
          if (window.EJS_emulator && window.EJS_emulator.gameManager) {
            var lines = code.split('\\n').filter(function(l) { return l.trim(); });
            lines.forEach(function(line) {
              try {
                window.EJS_emulator.gameManager.setCheat(line.trim(), true);
              } catch(e) {}
            });
            showToast('Cheat Applied ✓');
            console.log('[Menu] Cheat applied:', code);
            return;
          }
        } catch(e) { console.log('[Menu] Cheat error:', e); }
        showToast('Cheat Applied ✓');
      });

      function findAllAudioContexts() {
        var contexts = [];
        try {
          var emu = window.EJS_emulator;
          if (emu) {
            if (emu.gameManager && emu.gameManager.audioContext) contexts.push(emu.gameManager.audioContext);
            if (emu.audioContext) contexts.push(emu.audioContext);
            if (emu.Module) {
              if (emu.Module.SDL2 && emu.Module.SDL2.audioContext) contexts.push(emu.Module.SDL2.audioContext);
              if (emu.Module.SDL && emu.Module.SDL.audioContext) contexts.push(emu.Module.SDL.audioContext);
            }
            var keys = Object.keys(emu);
            for (var k = 0; k < keys.length; k++) {
              try {
                var v = emu[keys[k]];
                if (v && typeof v === 'object' && typeof v.suspend === 'function' && typeof v.resume === 'function' && v.destination) {
                  contexts.push(v);
                }
              } catch(e) {}
            }
          }
        } catch(e) {}
        return contexts;
      }

      // Master gain node for muting - intercept AudioContext
      var masterGainNode = null;
      var originalDestination = null;
      (function patchAudio() {
        var OrigAudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!OrigAudioCtx) return;
        var origConnect = AudioNode.prototype.connect;
        var gainNodes = [];
        window._retryxGainNodes = gainNodes;

        var origCreateGain = OrigAudioCtx.prototype.createGain;
        var patchedCtxs = new Set();

        function patchContext(ctx) {
          if (patchedCtxs.has(ctx)) return;
          patchedCtxs.add(ctx);
          try {
            var gain = origCreateGain.call(ctx);
            gain.gain.value = audioMuted ? 0 : 1;
            gainNodes.push(gain);
            origConnect.call(gain, ctx.destination);

            Object.defineProperty(ctx, 'retryxGain', { value: gain, writable: false });

            var origDest = ctx.destination;
            var origConnectFn = AudioNode.prototype.connect;
            AudioNode.prototype.connect = function(dest) {
              if (dest === origDest && this !== gain) {
                console.log('[Audio] Rerouting to master gain');
                return origConnectFn.call(this, gain);
              }
              return origConnectFn.apply(this, arguments);
            };
          } catch(e) { console.log('[Audio] Patch error:', e); }
        }

        var OrigCtx = window.AudioContext || window.webkitAudioContext;
        if (OrigCtx) {
          var origResume = OrigCtx.prototype.resume;
          var origCtor = OrigCtx;
          function PatchedAudioContext() {
            var ctx = new origCtor();
            patchContext(ctx);
            return ctx;
          }
          // Don't replace constructor, just observe new contexts via polling
        }

        // Poll for new audio contexts from emulator (limited)
        var _audioPollCount = 0;
        var _audioPollId = setInterval(function() {
          _audioPollCount++;
          try {
            var emu = window.EJS_emulator;
            if (!emu) return;
            var contexts = findAllAudioContexts();
            contexts.forEach(function(ctx) { patchContext(ctx); });
          } catch(e) {}
          if (_audioPollCount > 15) clearInterval(_audioPollId);
        }, 2000);
      })();

      function setMuteState(muted) {
        console.log('[Audio] Setting mute:', muted);
        // Method 1: gain nodes
        var gainNodes = window._retryxGainNodes || [];
        gainNodes.forEach(function(g) {
          try { g.gain.value = muted ? 0 : 1; } catch(e) {}
        });

        // Method 2: all audio contexts
        var contexts = findAllAudioContexts();
        contexts.forEach(function(ctx) {
          try {
            if (ctx.retryxGain) ctx.retryxGain.gain.value = muted ? 0 : 1;
          } catch(e) {}
        });

        // Method 3: emulator volume API
        try {
          var emu = window.EJS_emulator;
          if (emu) {
            if (emu.gameManager && typeof emu.gameManager.setVolume === 'function') {
              emu.gameManager.setVolume(muted ? 0 : 0.5);
            }
            if (typeof emu.mute === 'function' && muted) emu.mute();
            else if (typeof emu.unmute === 'function' && !muted) emu.unmute();
          }
        } catch(e) {}

        // Method 4: HTML media elements
        var allMedia = document.querySelectorAll('audio, video');
        allMedia.forEach(function(el) {
          el.muted = muted;
          el.volume = muted ? 0 : 1;
        });

        // Method 5: suspend/resume all contexts
        contexts.forEach(function(ctx) {
          try {
            if (muted) ctx.suspend();
            else ctx.resume();
          } catch(e) {}
        });
      }

      // AUDIO TOGGLE
      document.getElementById('menu-audio').addEventListener('click', function() {
        audioMuted = !audioMuted;
        document.getElementById('audio-label').textContent = audioMuted ? 'Unmute Audio' : 'Mute Audio';
        document.getElementById('audio-sub').textContent = audioMuted ? 'Sound is currently off' : 'Sound is currently on';
        setMuteState(audioMuted);
        closeMenu();
        showToast(audioMuted ? 'Audio Muted 🔇' : 'Audio On 🔊');
      });

      // FAST FORWARD
      document.getElementById('menu-fast').addEventListener('click', function() {
        fastForward = !fastForward;
        document.getElementById('fast-label').textContent = fastForward ? 'Normal Speed' : 'Fast Forward';
        document.getElementById('fast-sub').textContent = fastForward ? 'Currently at 3x speed' : 'Speed up gameplay';
        try {
          var emu = window.EJS_emulator;
          if (emu) {
            console.log('[Menu] Fast forward toggle:', fastForward);
            console.log('[Menu] emu keys:', Object.keys(emu).filter(function(k) { return k.toLowerCase().indexOf('fast') !== -1 || k.toLowerCase().indexOf('speed') !== -1; }));
            if (emu.gameManager) {
              console.log('[Menu] gameManager keys:', Object.keys(emu.gameManager).filter(function(k) { return k.toLowerCase().indexOf('fast') !== -1 || k.toLowerCase().indexOf('speed') !== -1; }));
              if (typeof emu.gameManager.setFastForwardRatio === 'function') {
                emu.gameManager.setFastForwardRatio(fastForward ? 3 : 1);
                console.log('[Menu] setFastForwardRatio called');
              } else if (typeof emu.gameManager.setFastForward === 'function') {
                emu.gameManager.setFastForward(fastForward ? 3 : 1);
                console.log('[Menu] setFastForward called');
              } else if (typeof emu.gameManager.toggleFastForward === 'function') {
                emu.gameManager.toggleFastForward();
                console.log('[Menu] toggleFastForward called');
              }
            }
            if (typeof emu.setFastForwardRatio === 'function') {
              emu.setFastForwardRatio(fastForward ? 3 : 1);
              console.log('[Menu] emu.setFastForwardRatio called');
            } else if (typeof emu.toggleFastForward === 'function') {
              emu.toggleFastForward();
              console.log('[Menu] emu.toggleFastForward called');
            }
            if (emu.Module && typeof emu.Module._emscripten_set_main_loop_timing === 'function') {
              try {
                emu.Module._emscripten_set_main_loop_timing(0, fastForward ? 1000/180 : 1000/60);
                console.log('[Menu] Emscripten timing adjusted');
              } catch(te) {}
            }
          }
        } catch(e) { console.log('[Menu] Fast forward error:', e); }
        closeMenu();
        showToast(fastForward ? 'Fast Forward ⏩' : 'Normal Speed ▶');
      });

      // RESET
      document.getElementById('menu-reset').addEventListener('click', function() {
        closeMenu();
        try {
          if (window.EJS_emulator && window.EJS_emulator.gameManager) {
            window.EJS_emulator.gameManager.restart();
            showToast('Game Reset ✓');
            console.log('[Menu] Game reset');
            return;
          }
        } catch(e) { console.log('[Menu] Reset error:', e); }
        showToast('Game Reset ✓');
      });

      function dismissOverlay() {
        if (dismissed) return;
        dismissed = true;
        console.log('[EmuHTML] Dismissing boot overlay');
        var el = document.getElementById('boot-overlay');
        if (el) {
          el.classList.add('hidden');
          setTimeout(function() { el.classList.add('gone'); }, 500);
        }
        sendMessage('gameStarted');
        hideEmulatorUI();
      }

      var _uiStyleAdded = false;
      function hideEmulatorUI() {
        if (_uiStyleAdded) return;
        _uiStyleAdded = true;
        var style = document.createElement('style');
        style.textContent = '\n          .ejs--bar, .ejs_menu_bar, .ejs--controls, .ejs--virtual-gamepad,\n          .ejs_virtualGamepad_container, .ejs_game_touch_overlay,\n          [class*="ejs_virtualGamepad"], [class*="ejs--overlay"],\n          [class*="ejs_overlay"], [class*="touch-controls"],\n          [class*="ejs--bar"], [class*="ejs_menu"] {\n            display: none !important;\n            opacity: 0 !important;\n            pointer-events: none !important;\n            visibility: hidden !important;\n            width: 0 !important;\n            height: 0 !important;\n          }\n          #game > div > div:not(:first-child) {\n            display: none !important;\n          }\n          #game canvas, #game > div, #game > div > div, #game > div > div > div {\n            transform: none !important;\n            -webkit-transform: none !important;\n            transform-origin: center center !important;\n          }\n        ';
        document.head.appendChild(style);
      }

      function sendMessage(type, extra) {
        var msg = JSON.stringify(Object.assign({ type: type }, extra || {}));
        try {
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
          if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
        } catch(e) {}
      }

      function updateStatus(main, sub) {
        var t = document.getElementById('boot-text');
        var s = document.getElementById('boot-sub');
        if (t) t.textContent = main;
        if (s) s.textContent = sub || '';
      }

      function sendError(msg) {
        sendMessage('error', { message: msg });
      }

      try {
        updateStatus('Initializing Emulator', 'Decoding ROM data...');

        var b64 = "${cleanBase64}";
        console.log('[EmuHTML] Base64 length:', b64.length);

        if (!b64 || b64.length < 10) {
          throw new Error('ROM data is empty or too small.');
        }

        var raw = atob(b64);
        var arr = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        var blob = new Blob([arr], { type: 'application/octet-stream' });
        var romUrl = URL.createObjectURL(blob);
        console.log('[EmuHTML] ROM blob created, size:', arr.length, 'bytes');

        updateStatus('Loading Emulator', 'Downloading core files...');

        window.EJS_player = '#game';
        window.EJS_core = '${core}';
        window.EJS_gameUrl = romUrl;
        window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
        window.EJS_color = '#14F195';
        window.EJS_backgroundColor = '#000';
        window.EJS_startOnLoaded = true;
        window.EJS_softLoad = false;
        window.EJS_DEBUG_XX = false;
        window.EJS_Buttons = {
          playPause: false, restart: false, mute: false, settings: false,
          fullscreen: false, saveState: false, loadState: false, screenRecord: false,
          gamepad: false, cheat: false, volume: false, saveSavFiles: false,
          loadSavFiles: false, quickSave: false, quickLoad: false, screenshot: false,
          cacheManager: false
        };
        window.EJS_VirtualGamepadSettings = false;
        window.EJS_rotation = 0;
        window.EJS_ROTATION = 0;
        window.EJS_forceNoRotation = true;

        // Aggressively block rotation by intercepting style.transform setter on game elements
        (function() {
          var origSetProperty = CSSStyleDeclaration.prototype.setProperty;
          CSSStyleDeclaration.prototype.setProperty = function(prop, value, priority) {
            if ((prop === 'transform' || prop === '-webkit-transform') && value && typeof value === 'string' && value.indexOf('rotate') !== -1) {
              console.log('[AntiRotate] Blocked setProperty rotate:', value);
              return origSetProperty.call(this, prop, 'none', 'important');
            }
            return origSetProperty.call(this, prop, value, priority);
          };

          var gameEl = document.getElementById('game');
          function lockTransform(el) {
            if (!el || !el.style) return;
            try {
              Object.defineProperty(el.style, 'transform', {
                get: function() { return 'none'; },
                set: function(v) {
                  if (v && typeof v === 'string' && v.indexOf('rotate') !== -1) {
                    console.log('[AntiRotate] Blocked transform=', v);
                    origSetProperty.call(el.style, 'transform', 'none', 'important');
                  } else {
                    origSetProperty.call(el.style, 'transform', v || 'none');
                  }
                },
                configurable: true
              });
              Object.defineProperty(el.style, 'webkitTransform', {
                get: function() { return 'none'; },
                set: function(v) {
                  if (v && typeof v === 'string' && v.indexOf('rotate') !== -1) {
                    origSetProperty.call(el.style, '-webkit-transform', 'none', 'important');
                  } else {
                    origSetProperty.call(el.style, '-webkit-transform', v || 'none');
                  }
                },
                configurable: true
              });
            } catch(e) { console.log('[AntiRotate] Lock error:', e); }
          }

          if (gameEl) {
            lockTransform(gameEl);
            var obs = new MutationObserver(function(muts) {
              for (var i = 0; i < muts.length; i++) {
                var m = muts[i];
                if (m.type === 'childList') {
                  m.addedNodes.forEach(function(n) {
                    if (n.nodeType === 1) {
                      lockTransform(n);
                      if (n.querySelectorAll) n.querySelectorAll('div, canvas').forEach(lockTransform);
                    }
                  });
                }
                if (m.type === 'attributes' && m.attributeName === 'style') {
                  var t = m.target.getAttribute('style') || '';
                  if (t.indexOf('rotate') !== -1) {
                    origSetProperty.call(m.target.style, 'transform', 'none', 'important');
                    origSetProperty.call(m.target.style, '-webkit-transform', 'none', 'important');
                  }
                }
              }
            });
            obs.observe(gameEl, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true });
          }
        })();

        window.EJS_onGameStart = function() {
          console.log('[EmuHTML] EJS_onGameStart callback');
          dismissOverlay();
        };

        window.EJS_onLoadState = function() {
          console.log('[EmuHTML] EJS_onLoadState callback');
          dismissOverlay();
        };

        var pollCount = 0;
        var pollInterval = setInterval(function() {
          pollCount++;

          var startBtn = document.querySelector('.ejs--startbutton, [class*="start-button"], .ejs_start_button');
          if (startBtn) {
            console.log('[EmuHTML] Found start button, clicking it');
            startBtn.click();
            setTimeout(function() {
              startBtn.click();
              var innerBtn = startBtn.querySelector('a, button, div');
              if (innerBtn) innerBtn.click();
            }, 300);
          }

          var canvas = document.querySelector('#game canvas');
          if (canvas) {
            try {
              var ctx = canvas.getContext('2d') || canvas.getContext('webgl') || canvas.getContext('webgl2');
              if (ctx) {
                console.log('[EmuHTML] Active canvas detected');
                clearInterval(pollInterval);
                setTimeout(dismissOverlay, 800);
                return;
              }
            } catch(e) {}
            console.log('[EmuHTML] Canvas element found');
            clearInterval(pollInterval);
            setTimeout(dismissOverlay, 1500);
            return;
          }

          if (pollCount > 30) {
            clearInterval(pollInterval);
            console.log('[EmuHTML] Timeout - forcing dismiss');
            dismissOverlay();
          }
        }, 500);

        var script = document.createElement('script');
        script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
        script.onload = function() {
          console.log('[EmuHTML] EmulatorJS loader loaded');
          updateStatus('Emulator Loaded', 'Starting game...');
          hideEmulatorUI();
          setTimeout(function() {
            var startBtn = document.querySelector('.ejs--startbutton, [class*="start-button"], .ejs_start_button');
            if (startBtn) {
              console.log('[EmuHTML] Auto-clicking start button after loader');
              startBtn.click();
              var innerA = startBtn.querySelector('a');
              if (innerA) innerA.click();
            }
          }, 2000);
        };
        script.onerror = function() {
          console.log('[EmuHTML] Loader script failed to load');
          updateStatus('Error', 'Failed to load emulator core files.');
          sendError('Failed to load emulator. Check your internet connection.');
        };
        document.body.appendChild(script);

      } catch(e) {
        console.log('[EmuHTML] Fatal error:', e.message);
        updateStatus('Error', e.message);
        sendError(e.message);
      }
    })();
  </script>
</body>
</html>`;
}
