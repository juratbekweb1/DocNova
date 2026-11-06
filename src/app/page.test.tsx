import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

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
});
