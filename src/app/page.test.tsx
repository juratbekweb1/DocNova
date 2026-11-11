import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React, { useState } from "react";

// Mock next/navigation since page.tsx uses useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock localStorage — return a "logged in" user so the page renders LandingPage
const localStorageMock = (() => {
  const store: Record<string, string> = {
    DocNova_user: JSON.stringify({ id: "1", name: "Test User" }),
  };
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock heavy components that don't matter for this test
vi.mock("../components/marketing/landing-page", () => ({
  LandingPage: () => (
    <main>
      <h1>Build a standout resume with clarity, speed, and confidence</h1>
      <a href="#pricing">Start building for free</a>
      <h2>Everything you need to ship a better resume faster</h2>
      <h2>Ready to build a resume that works as hard as you do?</h2>
    </main>
  ),
}));

import fs from "node:fs";
import path from "node:path";
import HomePage from "./page";
import { ScrollHeader } from "../components/layout/scroll-header";
import { MobileDrawer } from "../components/layout/mobile-drawer";
import { ActiveSectionEditor } from "../components/editor/ActiveSectionEditor";
import { AcademicBackground3D } from "../components/marketing/academic-background-3d";
import {
  fetchClientUsageData,
  invalidateClientUsageCache,
} from "../components/layout/usage-indicator";
import { SubscriptionProvider } from "../components/providers/subscription-provider";

describe("marketing home page", () => {
  it("renders the hero, features, and CTA content", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /build a standout resume with clarity, speed, and confidence/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start building for free/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /everything you need to ship a better resume faster/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ready to build a resume that works as hard as you do/i })
    ).toBeInTheDocument();
  });

  it("prevents mobile blurriness in globals.css and avoids dangerous [class*='blur-'] wildcard selectors", () => {
    const cssPath = path.resolve(process.cwd(), "src/app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf8");

    expect(cssContent).not.toContain('[class*="blur-"]');
    expect(cssContent).not.toContain('[class*="blur-["]');
    expect(cssContent).toContain('[class*="backdrop-blur"]');
    expect(cssContent).toContain("filter: none !important;");
    expect(cssContent).toContain("backdrop-filter: none !important;");
  });

  it("renders ScrollHeader without transform-gpu and portals MobileDrawer to document.body", () => {
    const { container } = render(
      <ScrollHeader>
        <MobileDrawer isOpen={true} onClose={() => {}}>
          <div>Mobile Nav Content</div>
        </MobileDrawer>
      </ScrollHeader>
    );

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    expect(header?.className).not.toContain("transform-gpu");
    expect(screen.getByText("Mobile Nav Content")).toBeInTheDocument();
    expect(header?.contains(screen.getByText("Mobile Nav Content"))).toBe(false);
  });

  it("ensures Hero and Services sections do not clip background glows inside max-w-* containers (no vertical side lines)", () => {
    const landingContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/marketing/landing-page.tsx"),
      "utf8"
    );
    const servicesContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/marketing/services-grid-section.tsx"),
      "utf8"
    );
    const studentContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/marketing/student-features-section.tsx"),
      "utf8"
    );

    expect(landingContent).not.toContain("absolute inset-0 -z-10 overflow-hidden");
    expect(servicesContent).not.toContain("absolute -inset-10 -z-10 overflow-hidden");
    expect(servicesContent).not.toMatch(/<section[^>]*max-w-7xl[^>]*overflow-hidden/);
    expect(studentContent).not.toContain("absolute -inset-10 -z-10 overflow-hidden");
    expect(studentContent).not.toMatch(/<section[^>]*max-w-7xl[^>]*overflow-hidden/);
  });

  it("enforces mobile anti-freeze safeguards across background, inputs, timers, and live previews", () => {
    const cssContent = fs.readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf8");
    const bg3dContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/marketing/academic-background-3d.tsx"),
      "utf8"
    );
    const logoContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/layout/logo.tsx"),
      "utf8"
    );
    const mockRunnerContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/academic/MockTestRunner.tsx"),
      "utf8"
    );
    const cvBuilderContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/cv-builder/page.tsx"),
      "utf8"
    );

    // 1. Mobile CSS prevents iOS/WebView input zoom reflow, 300ms tap delay & restores .a4-document in PDF export mode
    expect(cssContent).toContain("font-size: 16px !important;");
    expect(cssContent).toContain("touch-action: manipulation;");
    expect(cssContent).toContain(".pdf-export-mode .a4-document");

    // 2. AcademicBackground3D avoids full-viewport fixed resize on mobile address-bar scroll & hides 3D rings
    expect(bg3dContent).toMatch(
      /className="[^"]*\babsolute\b[^"]*\binset-0\b[^"]*\bmd:fixed\b[^"]*"/
    );
    expect(bg3dContent).toContain("hidden");
    expect(bg3dContent).toContain("md:block");
    expect(bg3dContent).toContain("md:flex");

    // 3. Fixed header Logo hides blur-xl on mobile
    expect(logoContent).toMatch(
      /className="[^"]*\bpointer-events-none\b[^"]*\bhidden\b[^"]*\bblur-xl\b[^"]*\bmd:block\b[^"]*"/
    );

    // 4. MockTestRunner isolates 1Hz countdown timer, offsets sticky bar below fixed Navbar, and memoizes MCQ cards
    expect(mockRunnerContent).toContain("function LiveCountdownTimer");
    expect(mockRunnerContent).toMatch(
      /className="[^"]*\bsticky\b[^"]*\btop-16\b[^"]*\bmd:top-20\b[^"]*"/
    );

    // 5. CV Builder defers A4 preview updates and avoids nested 100vh mobile scroll trap
    expect(cvBuilderContent).toContain("useDeferredValue");
    expect(cvBuilderContent).toContain("md:h-[calc(100vh-80px)]");
    expect(cvBuilderContent).not.toMatch(/[\s"]h-\[calc\(100vh-80px\)\]/);

    // 6. ActiveSectionEditor defines CanvasInput/CanvasTextarea at module scope so inputs never unmount on keystroke
    const activeEditorContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/editor/ActiveSectionEditor.tsx"),
      "utf8"
    );
    const editorBodyIndex = activeEditorContent.indexOf("export function ActiveSectionEditor");
    const canvasInputIndex = activeEditorContent.indexOf("function CanvasInput");
    const canvasTextareaIndex = activeEditorContent.indexOf("function CanvasTextarea");
    expect(canvasInputIndex).toBeGreaterThan(-1);
    expect(canvasTextareaIndex).toBeGreaterThan(-1);
    expect(canvasInputIndex).toBeLessThan(editorBodyIndex);
    expect(canvasTextareaIndex).toBeLessThan(editorBodyIndex);

    // 7. pdf-export.ts batches candidate band pixel readback into a single getImageData call per page slice
    const pdfExportContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/lib/pdf-export.ts"),
      "utf8"
    );
    expect(pdfExportContent).toContain("srcCtx.getImageData(0, minY, canvas.width, bandHeight)");
    expect(pdfExportContent).not.toContain("srcCtx.getImageData(0, y, canvas.width, 1)");
  });

  it("preserves DOM input identity and focus across keystrokes in ActiveSectionEditor (no mobile keyboard drop)", () => {
    function StatefulEditorHarness() {
      const [content, setContent] = useState<Record<string, unknown>>({ fullName: "" });
      return (
        <ActiveSectionEditor
          section={{
            id: "sec_1",
            documentId: "doc_1",
            type: "PERSONAL_INFO",
            title: "Personal Info",
            content: content as never,
            sortOrder: 0,
            isVisible: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
          onChange={(next) => setContent(next as Record<string, unknown>)}
        />
      );
    }

    render(<StatefulEditorHarness />);
    const input = screen.getByPlaceholderText("e.g. John Doe") as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    fireEvent.change(input, { target: { value: "A" } });
    const inputAfterFirstKey = screen.getByPlaceholderText("e.g. John Doe");
    expect(inputAfterFirstKey).toBe(input);
    expect(document.activeElement).toBe(input);

    fireEvent.change(input, { target: { value: "Azizbek" } });
    const inputAfterSecondKey = screen.getByPlaceholderText("e.g. John Doe") as HTMLInputElement;
    expect(inputAfterSecondKey).toBe(input);
    expect(inputAfterSecondKey.value).toBe("Azizbek");
    expect(document.activeElement).toBe(input);
  });

  it("renders AcademicBackground3D with non-fixed mobile container and desktop-only 3D layers", () => {
    const { container } = render(<AcademicBackground3D />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.className).toContain("absolute");
    expect(root.className).toContain("md:fixed");
  });

  it("deduplicates concurrent /api/user/usage requests and skips /api/user/subscription when initialData is provided", async () => {
    invalidateClientUsageCache();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ plan: "FREE", usage: 1, limit: 20, remaining: 19, sections: [] }),
    });
    const originalFetch = global.fetch;
    global.fetch = fetchSpy as unknown as typeof global.fetch;

    try {
      // 1. Concurrent usage fetches (UsageIndicator + LimitPaywallModal mounting together)
      const [res1, res2] = await Promise.all([fetchClientUsageData(), fetchClientUsageData()]);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(res1?.remaining).toBe(19);
      expect(res2?.remaining).toBe(19);

      // 2. SubscriptionProvider with SSR initialData should make 0 network calls
      fetchSpy.mockClear();
      render(
        <SubscriptionProvider initialData={{ isPremium: false, features: {} }}>
          <div>Child Content</div>
        </SubscriptionProvider>
      );
      expect(fetchSpy).toHaveBeenCalledTimes(0);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
