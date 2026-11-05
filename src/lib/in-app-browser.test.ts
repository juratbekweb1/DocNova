// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { isIOS, isInAppBrowser, getInAppBrowserName } from "./in-app-browser";

describe("in-app-browser detection", () => {
  const originalUserAgent = window.navigator.userAgent;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window.navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
  });

  const setUserAgent = (ua: string, platform = "iPhone") => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: ua,
      configurable: true,
    });
    Object.defineProperty(window.navigator, "platform", {
      value: platform,
      configurable: true,
    });
  };

  it("detects iOS devices correctly", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
    );
    expect(isIOS()).toBe(true);
  });

  it("detects Telegram in-app browser on iOS", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Telegram/10.9.1"
    );
    expect(isIOS()).toBe(true);
    expect(isInAppBrowser()).toBe(true);
    expect(getInAppBrowserName()).toBe("Telegram");
  });

  it("detects Instagram in-app browser", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 324.0.0.18.115"
    );
    expect(isInAppBrowser()).toBe(true);
    expect(getInAppBrowserName()).toBe("Instagram");
  });

  it("returns null for standard Safari on iOS", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
    );
    expect(isIOS()).toBe(true);
    expect(isInAppBrowser()).toBe(false);
    expect(getInAppBrowserName()).toBeNull();
  });
});
