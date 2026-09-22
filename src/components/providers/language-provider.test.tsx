import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { LanguageProvider, useLanguage } from "./language-provider";

function TestComponent() {
  const { lang, setLang, t } = useLanguage();

  return (
    <>
      <div data-testid="lang">{lang}</div>
      <div>{t.login}</div>
      <button type="button" onClick={() => setLang("en")}>
        Switch to English
      </button>
    </>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => {
    document.cookie = "NEXT_LOCALE=uz; path=/; max-age=31536000; SameSite=Lax";
    localStorage.clear();
    document.documentElement.lang = "uz";
  });

  it("updates the html locale and persists selection when the language changes", () => {
    render(
      <LanguageProvider initialLang="uz">
        <TestComponent />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /switch to english/i }));

    expect(screen.getByTestId("lang").textContent).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(document.cookie).toContain("NEXT_LOCALE=en");
    expect(localStorage.getItem("DocNova-lang")).toBe("en");
  });
});
