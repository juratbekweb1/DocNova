/**
 * In-App Browser & iOS Detection Utilities
 * Handles detection of embedded WebViews (Telegram, Instagram, Facebook, etc.)
 * especially on iOS devices where WebViews do not share Safari cookies/session.
 */

export function isIOS(): boolean {
  if (typeof window === "undefined" || !window.navigator) return false;
  const ua = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

export function getInAppBrowserName(): string | null {
  if (typeof window === "undefined" || !window.navigator) return null;
  const ua = window.navigator.userAgent || window.navigator.vendor || "";

  if (/Telegram/i.test(ua)) return "Telegram";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV/i.test(ua)) return "Facebook";
  if (/Twitter|Tweetbot/i.test(ua)) return "Twitter (X)";
  if (/Line\//i.test(ua)) return "Line";
  if (/MicroMessenger/i.test(ua)) return "WeChat";
  if (/VKShare|VKApp/i.test(ua)) return "VK";
  if (/ByteLocale|TikTok/i.test(ua)) return "TikTok";

  // Generic iOS WKWebView check
  if (isIOS()) {
    const isWebKit = /AppleWebKit/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
    if (isWebKit && (!isSafari || !/Version/i.test(ua))) {
      return "In-App Browser";
    }
  }

  return null;
}

export function isInAppBrowser(): boolean {
  return getInAppBrowserName() !== null;
}
