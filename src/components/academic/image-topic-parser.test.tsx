import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { ImageTopicParser, GalleryTopicTriggerButton } from "./image-topic-parser";
import { CreationModeSelector } from "./creation-mode-selector";
import { StudentSubNav, STUDENT_SECTIONS } from "./student-sub-nav";
import { NavLinks } from "@/components/layout/nav-links";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { QuickCreateWidget } from "@/components/dashboard/widgets";
import ToolsHubPage from "@/app/tools/page";
import { ServicesGridSection } from "@/components/marketing/services-grid-section";
import AcademicHubPage from "@/app/academic/page";
import AmaliyIshPage from "@/app/academic/amaliy-ish/page";
import AcademicEssayBuilderPage from "@/app/academic/essay-builder/page";
import AcademicExamPrepPage from "@/app/academic/exam-prep/page";
import PresentationGeneratorPage from "@/app/academic/presentation/page";
import AcademicReferatPage from "@/app/academic/referat/page";
import DiplomBmiPage from "@/app/academic/diplom-bmi/page";
import CourseworkGenerator from "@/app/coursework/page";
import * as pdfExport from "@/lib/pdf-export";

let mockSearchParams = new URLSearchParams();
let mockPathname = "/academic";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockFetch = vi.fn();

describe("<ImageTopicParser />", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    mockSearchParams = new URLSearchParams();
    mockPathname = "/academic";
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      try {
        window.history.replaceState(null, "", "/");
      } catch {
        // Ignore
      }
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads an uploaded image automatically, displays loading state, renders editable topic blocks, edits them, and saves to DB", async () => {
    let resolveParseFetch!: (value: Response) => void;
    const parseFetchPromise = new Promise<Response>((resolve) => {
      resolveParseFetch = resolve;
    });

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/parse-topics") {
        return parseFetchPromise;
      }
      if (url === "/api/academic/topics/save") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              documentId: "doc-saved-1",
              title: "Yangi hujjat",
              sectionCount: 3,
              editorUrl: "/dashboard/editor/doc-saved-1",
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const onApplyTopicsToForm = vi.fn();
    render(<ImageTopicParser workType="referat" onApplyTopicsToForm={onApplyTopicsToForm} />);

    const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
    const imageFile = new File(["fake-png-bytes"], "mavzular.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [imageFile] } });

    // Loading state must appear while API analyzes image
    expect(await screen.findByText("Rasm tahlil qilinmoqda...")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/parse-topics",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    // Resolve Gemini API response with 3 topics
    resolveParseFetch(
      new Response(
        JSON.stringify({
          topics: [
            { title: "1-mavzu: Algoritmlar", content: "Algoritm tushunchasi" },
            { title: "2-mavzu: Ma'lumotlar tuzilmasi", content: "Massiv va ro'yxatlar" },
            { title: "3-mavzu: Graflar", content: "BFS va DFS usullari" },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    // Wait for editable blocks to render
    expect(await screen.findByText("3 ta mavzu topildi")).toBeInTheDocument();
    expect(screen.getByTestId("topic-block-0")).toBeInTheDocument();
    expect(screen.getByTestId("topic-block-1")).toBeInTheDocument();
    expect(screen.getByTestId("topic-block-2")).toBeInTheDocument();

    // User edits topic #1 title and content before saving
    const firstTitleInput = screen.getByDisplayValue("1-mavzu: Algoritmlar");
    const firstContentInput = screen.getByDisplayValue("Algoritm tushunchasi");
    fireEvent.change(firstTitleInput, {
      target: { value: "1-mavzu: Zamonaviy algoritmlar" },
    });
    fireEvent.change(firstContentInput, {
      target: { value: "Algoritm murakkabligi va Big-O tahlili" },
    });

    // Apply edited topics to form works cleanly
    fireEvent.click(screen.getByRole("button", { name: /Formaga qo'llash/i }));
    expect(onApplyTopicsToForm).toHaveBeenCalledWith([
      {
        title: "1-mavzu: Zamonaviy algoritmlar",
        content: "Algoritm murakkabligi va Big-O tahlili",
      },
      {
        title: "2-mavzu: Ma'lumotlar tuzilmasi",
        content: "Massiv va ro'yxatlar",
      },
      {
        title: "3-mavzu: Graflar",
        content: "BFS va DFS usullari",
      },
    ]);

    // Click "Barcha mavzularni saqlash"
    fireEvent.click(screen.getByRole("button", { name: /Barcha mavzularni saqlash/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/academic/topics/save",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    const saveCall = mockFetch.mock.calls.find(([url]) => url === "/api/academic/topics/save");
    expect(saveCall).toBeDefined();
    const sentSavePayload = JSON.parse((saveCall![1] as RequestInit).body as string);
    expect(sentSavePayload.workType).toBe("referat");
    expect(sentSavePayload.topics[0]).toEqual({
      title: "1-mavzu: Zamonaviy algoritmlar",
      content: "Algoritm murakkabligi va Big-O tahlili",
    });

    expect(
      await screen.findByText(/Muvaffaqiyatli saqlandi! \(3 ta mavzu va sahifa\)/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Muharrirda ochish/i })).toHaveAttribute(
      "href",
      "/dashboard/editor/doc-saved-1"
    );
  });

  it("shows login prompt while preserving edited topics when save returns 401", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/parse-topics") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              topics: [{ title: "Kirish", content: "Matn" }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url === "/api/academic/topics/save") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              error: "Mavzularni bazaga saqlash uchun avval tizimga kiring.",
              requireLogin: true,
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<ImageTopicParser />);

    const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
    const imageFile = new File(["fake"], "list.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [imageFile] } });

    expect(await screen.findByDisplayValue("Matn")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Barcha mavzularni saqlash/i }));

    expect(await screen.findByRole("link", { name: /Tizimga kirish/i })).toBeInTheDocument();
    // Edited block remains visible on screen so user loses nothing
    expect(screen.getByDisplayValue("Matn")).toBeInTheDocument();
  });

  it("configures #image-upload-input for mobile gallery (accept='image/*', no capture, className='hidden') and triggers it on 'Rasm tashlash'", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          topics: [{ title: "Mustaqil ish mavzusi", content: "Asosiy tushunchalar" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const { container } = render(
      <div>
        <CreationModeSelector
          moduleType="independent"
          onSampleBlueprintReady={vi.fn()}
          onSampleCleared={vi.fn()}
        />
        <GalleryTopicTriggerButton accentColor="emerald" />
      </div>
    );

    const inputEl = container.querySelector("#image-upload-input") as HTMLInputElement | null;
    expect(inputEl).not.toBeNull();
    expect(inputEl).toHaveAttribute("type", "file");
    expect(inputEl).toHaveAttribute("accept", "image/*");
    expect(inputEl).toHaveClass("hidden");
    expect(inputEl).not.toHaveAttribute("capture");

    const clickSpy = vi.spyOn(inputEl!, "click").mockImplementation(() => {});

    // All "Rasm tashlash" buttons (CreationModeSelector, ImageTopicParser, GalleryTopicTriggerButton) trigger #image-upload-input
    const galleryButtons = screen.getAllByRole("button", { name: /Rasm tashlash/i });
    expect(galleryButtons.length).toBeGreaterThanOrEqual(2);

    fireEvent.click(galleryButtons[0]);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(galleryButtons[galleryButtons.length - 1]);
    expect(clickSpy).toHaveBeenCalledTimes(2);

    clickSpy.mockRestore();

    // Selecting an image from gallery switches CreationModeSelector to image panel & parses via /api/parse-topics
    const photo = new File(["fake-jpg"], "galereya-rasm.jpg", { type: "image/jpeg" });
    fireEvent.change(inputEl!, { target: { files: [photo] } });

    expect(await screen.findByDisplayValue("Asosiy tushunchalar")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("Mustaqil ish mavzusi").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /Boshqa rasm tashlash/i })).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/parse-topics",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("renders 'Rasm tashlash' button directly beneath the '.DOCX, .PDF, .TXT' sample upload mode and triggers #image-upload-input", () => {
    const { container } = render(
      <CreationModeSelector
        moduleType="independent"
        onSampleBlueprintReady={vi.fn()}
        onSampleCleared={vi.fn()}
      />
    );

    // Switch to "Namuna fayl (DOCX / PDF)" (.DOCX, .PDF, .TXT upload mode shown in screenshot)
    fireEvent.click(screen.getByRole("button", { name: /Namuna fayl/i }));

    expect(
      screen.getByText(/Namuna faylni tanlang yoki shu yerga tashlang \(\.DOCX, \.PDF, \.TXT\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Mavzular rasm ko'rinishida bormi\?/i)).toBeInTheDocument();

    const inputEl = container.querySelector("#image-upload-input") as HTMLInputElement | null;
    expect(inputEl).not.toBeNull();
    const clickSpy = vi.spyOn(inputEl!, "click").mockImplementation(() => {});

    // Bottom CTA button beneath sample dropzone opens mobile gallery picker
    const rasmButtons = screen.getAllByRole("button", { name: /Rasm tashlash/i });
    const bottomButton = rasmButtons[rasmButtons.length - 1];
    fireEvent.click(bottomButton);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("auto-generates 2-3 page Mustaqil ish per topic when autoGeneratePerTopicWorks is enabled and notifies parent", async () => {
    const onWorksGenerated = vi.fn();

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/parse-topics") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              topics: [
                { title: "1. Sun'iy intellekt", content: "Qisqa reja 1" },
                { title: "2. Kiberxavfsizlik", content: "Qisqa reja 2" },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url === "/api/academic/topics/generate-works") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              pagesPerTopic: "2-3",
              totalTopics: 2,
              works: [
                {
                  title: "1. Sun'iy intellekt",
                  content: "## Reja\n1. AI tarixi\n\n### Kirish\n1-mavzu 2-3 bet tayyor ish.",
                },
                {
                  title: "2. Kiberxavfsizlik",
                  content: "## Reja\n1. Xavfsizlik\n\n### Kirish\n2-mavzu 2-3 bet tayyor ish.",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(
      <ImageTopicParser
        workType="independent"
        autoGeneratePerTopicWorks={true}
        subjectHint="Informatika"
        onWorksGenerated={onWorksGenerated}
      />
    );

    const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
    const imageFile = new File(["fake"], "mavzular.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [imageFile] } });

    expect(
      await screen.findByText(/2 ta mavzuning har biri uchun 2-3 betlik mustaqil ish tayyorlandi!/i)
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(/1-mavzu 2-3 bet tayyor ish/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/2-mavzu 2-3 bet tayyor ish/i)).toBeInTheDocument();

    expect(onWorksGenerated).toHaveBeenCalledTimes(1);
    expect(onWorksGenerated).toHaveBeenCalledWith([
      expect.objectContaining({ title: "1. Sun'iy intellekt" }),
      expect.objectContaining({ title: "2. Kiberxavfsizlik" }),
    ]);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/academic/topics/generate-works",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("generates 2-3 page works manually when clicking '2-3 bet Mustaqil ish yozish'", async () => {
    const onWorksGenerated = vi.fn();

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/parse-topics") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              topics: [{ title: "Menejment asoslari", content: "Qisqa izoh" }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url === "/api/academic/topics/generate-works") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              pagesPerTopic: "2-3",
              totalTopics: 1,
              works: [
                {
                  title: "Menejment asoslari",
                  content: "To'liq 2-3 betlik menejment mustaqil ishi.",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<ImageTopicParser onWorksGenerated={onWorksGenerated} />);

    const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
    const imageFile = new File(["fake"], "list.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [imageFile] } });

    expect(await screen.findByDisplayValue("Qisqa izoh")).toBeInTheDocument();
    expect(onWorksGenerated).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /2-3 bet Mustaqil ish yozish/i }));

    expect(
      await screen.findByDisplayValue("To'liq 2-3 betlik menejment mustaqil ishi.")
    ).toBeInTheDocument();
    expect(onWorksGenerated).toHaveBeenCalledTimes(1);
  });

  it("asks 'Har bir mavzuga nechta bet yozib berilsin?' and sends custom global & per-topic page counts", async () => {
    const onWorksGenerated = vi.fn();

    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/parse-topics") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              topics: [
                { title: "1. Inflyatsiya sabablari", content: "Nazariy tahlil" },
                { title: "2. Monetar siyosat", content: "Markaziy bank" },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url === "/api/academic/topics/generate-works") {
        const body = JSON.parse(String(init?.body || "{}")) as {
          pagesPerTopic?: string;
          topics?: Array<{ title: string; pageCount?: string }>;
        };
        return Promise.resolve(
          new Response(
            JSON.stringify({
              pagesPerTopic: body.pagesPerTopic,
              pageCounts: body.topics?.map((t) => t.pageCount || body.pagesPerTopic),
              totalTopics: 2,
              works: [
                { title: "1. Inflyatsiya sabablari", content: "10 betlik tayyor matn" },
                { title: "2. Monetar siyosat", content: "6 betlik tayyor matn" },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<ImageTopicParser onWorksGenerated={onWorksGenerated} />);

    // 1. User sees the page count prompt before uploading
    expect(screen.getByText(/Har bir mavzuga nechta bet yozib berilsin\?/i)).toBeInTheDocument();

    // Select 10 bet preset globally
    fireEvent.click(screen.getByRole("button", { name: /^10 bet$/i }));
    expect(screen.getByText(/Tanlangan: 10 bet/i)).toBeInTheDocument();

    // Upload image from gallery
    const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
    const photo = new File(["fake"], "topics.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [photo] } });

    expect(await screen.findByDisplayValue("Nazariy tahlil")).toBeInTheDocument();

    // Button immediately reflects uniform chosen page count
    expect(screen.getByRole("button", { name: /10 bet Mustaqil ish yozish/i })).toBeInTheDocument();

    // Customize Topic 2 individually to 6 pages via number input
    const topic2PageInput = screen.getByLabelText(
      "2-mavzu uchun aniq bet soni"
    ) as HTMLInputElement;
    fireEvent.change(topic2PageInput, { target: { value: "6" } });

    const submitBtn = screen.getByRole("button", {
      name: /Tanlangan betlarda Mustaqil ish yozish/i,
    });
    fireEvent.click(submitBtn);

    expect(await screen.findByDisplayValue("10 betlik tayyor matn")).toBeInTheDocument();
    expect(screen.getByDisplayValue("6 betlik tayyor matn")).toBeInTheDocument();

    const generateCall = mockFetch.mock.calls.find(
      ([u]) => u === "/api/academic/topics/generate-works"
    );
    expect(generateCall).toBeDefined();
    const sentPayload = JSON.parse(String((generateCall?.[1] as RequestInit)?.body || "{}"));
    expect(sentPayload.pagesPerTopic).toBe("10");
    expect(sentPayload.topics).toEqual([
      { title: "1. Inflyatsiya sabablari", content: "Nazariy tahlil" },
      { title: "2. Monetar siyosat", content: "Markaziy bank", pageCount: "6" },
    ]);
  });

  it("opens image upload panel immediately when CreationModeSelector receives initialMode='image'", () => {
    const { container } = render(
      <CreationModeSelector
        moduleType="referat"
        initialMode="image"
        onSampleBlueprintReady={vi.fn()}
        onSampleCleared={vi.fn()}
      />
    );

    const imagePanel = container.querySelector(".block");
    expect(imagePanel).not.toBeNull();
    expect(screen.getByText(/Har bir mavzuga nechta bet yozib berilsin\?/i)).toBeInTheDocument();
    expect(container.querySelector("#image-upload-input")).toBeInTheDocument();
  });

  it("renders 'Rasm tashlash' button inside both 'Talabalar uchun' sections linking to image mode", () => {
    const { unmount } = render(<ServicesGridSection />);

    expect(screen.getByText(/Talabalar uchun \(5 ta bo‘lim\)/i)).toBeInTheDocument();
    const homeRasmLinks = screen.getAllByRole("link", { name: /Rasm tashlash/i });
    expect(homeRasmLinks.length).toBeGreaterThanOrEqual(2);
    expect(
      homeRasmLinks.some((link) => link.getAttribute("href") === "/academic/referat?mode=image")
    ).toBe(true);

    unmount();

    render(<AcademicHubPage />);
    expect(screen.getByText(/Talabalar uchun asosiy bo'limlar/i)).toBeInTheDocument();
    const hubRasmLinks = screen.getAllByRole("link", { name: /Rasm tashlash/i });
    expect(hubRasmLinks.length).toBeGreaterThanOrEqual(4);
    expect(
      hubRasmLinks.some((link) => link.getAttribute("href") === "/academic/referat?mode=image")
    ).toBe(true);
    expect(
      hubRasmLinks.some((link) => link.getAttribute("href") === "/academic/coursework?mode=image")
    ).toBe(true);
    expect(
      hubRasmLinks.some((link) => link.getAttribute("href") === "/academic/diplom-bmi?mode=image")
    ).toBe(true);
    expect(
      hubRasmLinks.some((link) => link.getAttribute("href") === "/academic/amaliy-ish?mode=image")
    ).toBe(true);
    expect(
      hubRasmLinks.some((link) => link.getAttribute("href") === "/academic/exam-prep?mode=image")
    ).toBe(true);
    expect(
      hubRasmLinks.some((link) => link.getAttribute("href") === "/academic/presentation?mode=image")
    ).toBe(true);
    expect(
      homeRasmLinks.some((link) => link.getAttribute("href") === "/academic/exam-prep?mode=image")
    ).toBe(true);
    expect(
      homeRasmLinks.some(
        (link) => link.getAttribute("href") === "/academic/presentation?mode=image"
      )
    ).toBe(true);
  });

  it("allows clearing per-topic page input without snapping back and keeps 'Boshqa...' select active", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          topics: [
            { title: "1. Soliq tizimi", content: "Reja 1" },
            { title: "2. Byudjet siyosati", content: "Reja 2" },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<ImageTopicParser defaultPagesPerTopic="10" />);

    const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
    const photo = new File(["fake"], "topics.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [photo] } });

    expect(await screen.findByDisplayValue("Reja 1")).toBeInTheDocument();

    const topic1Input = screen.getByLabelText("1-mavzu uchun aniq bet soni") as HTMLInputElement;
    const topic1Select = screen.getByLabelText("1-mavzu uchun betlar soni") as HTMLSelectElement;

    // Clearing must stay empty while typing instead of snapping back to "10"
    fireEvent.change(topic1Input, { target: { value: "" } });
    expect(topic1Input.value).toBe("");

    // Entering custom non-preset value "14" updates input and switches select to "custom"
    fireEvent.change(topic1Input, { target: { value: "14" } });
    expect(topic1Input.value).toBe("14");
    expect(topic1Select.value).toBe("custom");

    // Selecting "Boshqa..." from preset topic stays on "custom" AND keeps visible draft synchronized at "7"
    const topic2Select = screen.getByLabelText("2-mavzu uchun betlar soni") as HTMLSelectElement;
    const topic2Input = screen.getByLabelText("2-mavzu uchun aniq bet soni") as HTMLInputElement;
    fireEvent.change(topic2Select, { target: { value: "custom" } });
    expect(topic2Select.value).toBe("custom");
    expect(topic2Input.value).toBe("7");
    fireEvent.change(topic2Input, { target: { value: "25" } });
    expect(topic2Input.value).toBe("25");
    expect(topic2Select.value).toBe("custom");

    // Out-of-range global custom input reconciles displayed value with clamped 1-100 state
    const globalCustomInput = screen.getByLabelText(
      "Har bir mavzuga nechta bet"
    ) as HTMLInputElement;
    fireEvent.change(globalCustomInput, { target: { value: "0" } });
    expect(globalCustomInput.value).toBe("1");
    expect(screen.getByText(/Tanlangan: 1 bet/i)).toBeInTheDocument();

    fireEvent.change(globalCustomInput, { target: { value: "150" } });
    expect(globalCustomInput.value).toBe("100");
    expect(screen.getByText(/Tanlangan: 100 bet/i)).toBeInTheDocument();
  });

  it("preserves chosen page counts across 401 draft restore, uses current route callbackUrl, and sends module workType", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/parse-topics") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              topics: [{ title: "1. Kvant hisoblash", content: "Qubitlar" }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url === "/api/academic/topics/save") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Login required", requireLogin: true }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      if (url === "/api/academic/topics/generate-works") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              pagesPerTopic: "15",
              pageCounts: ["18"],
              totalTopics: 1,
              works: [{ title: "1. Kvant hisoblash", content: "18 bet referat tayyor" }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { unmount } = render(<ImageTopicParser workType="referat" />);

    fireEvent.click(screen.getByRole("button", { name: /^15 bet$/i }));

    const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["img"], "kvant.png", { type: "image/png" })] },
    });

    expect(await screen.findByDisplayValue("Qubitlar")).toBeInTheDocument();
    // Referat module label shows Referat instead of hardcoded Mustaqil ish
    expect(screen.getByRole("button", { name: /15 bet Referat yozish/i })).toBeInTheDocument();

    const topic1Input = screen.getByLabelText("1-mavzu uchun aniq bet soni") as HTMLInputElement;
    fireEvent.change(topic1Input, { target: { value: "18" } });

    fireEvent.click(screen.getByRole("button", { name: /Barcha mavzularni saqlash/i }));
    const loginLink = await screen.findByRole("link", { name: /Tizimga kirish/i });
    expect(loginLink.getAttribute("href")).toContain("/login?callbackUrl=");

    // Unmount and remount to confirm sessionStorage restores global & per-topic page counts
    unmount();
    render(<ImageTopicParser workType="referat" />);

    expect(await screen.findByDisplayValue("Qubitlar")).toBeInTheDocument();
    expect(screen.getByText(/Tanlangan: 15 bet/i)).toBeInTheDocument();
    expect((screen.getByLabelText("1-mavzu uchun aniq bet soni") as HTMLInputElement).value).toBe(
      "18"
    );

    fireEvent.click(screen.getByRole("button", { name: /18 bet Referat yozish/i }));
    expect(await screen.findByDisplayValue("18 bet referat tayyor")).toBeInTheDocument();

    const genCall = mockFetch.mock.calls.find(([u]) => u === "/api/academic/topics/generate-works");
    const sentGenPayload = JSON.parse(String((genCall?.[1] as RequestInit)?.body || "{}"));
    expect(sentGenPayload.workType).toBe("Referat");
    expect(sentGenPayload.pagesPerTopic).toBe("15");
    expect(sentGenPayload.topics[0].pageCount).toBe("18");
  });

  it("renders generated image works directly in AmaliyIshPage A4 preview and supports EssayBuilder gallery + page prompt", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/parse-topics") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              topics: [
                { title: "Dispersion tahlil amaliy topshiriq", content: "ANOVA bosqichlari" },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url === "/api/academic/topics/generate-works") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              pagesPerTopic: "5",
              pageCounts: ["5"],
              totalTopics: 1,
              works: [
                {
                  title: "Dispersion tahlil amaliy topshiriq",
                  content: "Rasmdan yaratilgan 5 betlik amaliy ish natijasi.",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { container, unmount } = render(<AmaliyIshPage />);

    // Manual AmaliyIshPage form also asks for page count (nechta bet)
    expect(screen.getByText(/Kutilayotgan hajm \(Nechta bet\?/i)).toBeInTheDocument();

    const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["img"], "amaliy.jpg", { type: "image/jpeg" })] },
    });

    expect(await screen.findByDisplayValue("ANOVA bosqichlari")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /5 bet Amaliy ish yozish/i }));

    // Right preview renders the generated works instead of staying stuck on 18-variant
    expect(await screen.findByText(/Rasmdan 1 ta mavzu \(5 bet\) tayyor/i)).toBeInTheDocument();
    const previewSheet = container.querySelector(".a4-document");
    expect(previewSheet).not.toBeNull();
    expect(previewSheet?.textContent).toContain("Rasmdan yaratilgan 5 betlik amaliy ish natijasi.");

    // Toggling back restores structured 18-variant ANOVA view
    fireEvent.click(screen.getByRole("button", { name: /ANOVA hisob-kitobga qaytish/i }));
    expect(screen.getByText(/18-variant tayyor/i)).toBeInTheDocument();

    unmount();

    // EssayBuilder exposes "Rasm tashlash" and flexible page count selection
    render(<AcademicEssayBuilderPage />);
    expect(screen.getAllByRole("button", { name: /Rasm tashlash/i }).length).toBeGreaterThanOrEqual(
      1
    );
    expect(
      screen.getByText(/Rejalashtirilgan hajm \(Nechta bet yozilsin\?\)/i)
    ).toBeInTheDocument();
  });

  it("labels /academic/image-topics sub-nav pill as 'Rasm tashlash' and keeps range preset -> Boshqa... input synchronized", async () => {
    render(<StudentSubNav activeTab="image-topics" />);
    const pill = screen.getByRole("link", { name: /Rasm tashlash/i });
    expect(pill).toHaveAttribute("href", "/academic/image-topics");
    expect(screen.queryByText(/Rasm -> Mavzu/i)).toBeNull();

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          topics: [{ title: "1. Falsafa asoslari", content: "Kirish qismi" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<ImageTopicParser defaultPagesPerTopic="2-3" />);
    const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["img"], "range.jpg", { type: "image/jpeg" })] },
    });

    expect(await screen.findByDisplayValue("Kirish qismi")).toBeInTheDocument();
    const select = screen.getByLabelText("1-mavzu uchun betlar soni") as HTMLSelectElement;
    const numInput = screen.getByLabelText("1-mavzu uchun aniq bet soni") as HTMLInputElement;
    expect(select.value).toBe("2-3");
    expect(numInput.value).toBe("");

    fireEvent.change(select, { target: { value: "custom" } });
    expect(select.value).toBe("custom");
    expect(numInput.value).toBe("7");
  });

  it("handles same-route ?mode=image navigation in CreationModeSelector even after selecting another mode", async () => {
    const { container, rerender } = render(
      <CreationModeSelector
        moduleType="referat"
        initialMode="scratch"
        onSampleBlueprintReady={vi.fn()}
        onSampleCleared={vi.fn()}
      />
    );

    // Switch manually to "Namuna fayl"
    fireEvent.click(screen.getByRole("button", { name: /Namuna fayl/i }));
    expect(screen.getByText(/Namuna faylni tanlang yoki shu yerga tashlang/i)).toBeInTheDocument();

    // Simulate same-route navigation to ?mode=image via Next searchParams update
    mockSearchParams = new URLSearchParams("mode=image");
    rerender(
      <CreationModeSelector
        moduleType="referat"
        initialMode="scratch"
        onSampleBlueprintReady={vi.fn()}
        onSampleCleared={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(container.querySelector(".block #image-upload-input")).not.toBeNull();
    });

    // Switching back to "Noldan yaratish" leaves image panel closed
    fireEvent.click(screen.getByRole("button", { name: /Noldan yaratish/i }));
    expect(container.querySelector(".hidden #image-upload-input")).not.toBeNull();
  });

  it("provides instant preview, clipboard copy, and direct Word (.docx) download on /academic/image-topics without login or DB save", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:docx-test");
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/parse-topics") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              topics: [{ title: "Raqamli iqtisodiyot", content: "Qisqa mazmun" }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url === "/api/academic/topics/generate-works") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              pagesPerTopic: "5",
              pageCounts: ["5"],
              totalTopics: 1,
              works: [
                {
                  title: "Raqamli iqtisodiyot",
                  content: "## Kirish\n\nTahliliy matn.",
                  pageCount: "5",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url === "/api/academic/export-docx") {
        return Promise.resolve(
          new Response(new Blob(["fake-docx"]), {
            status: 200,
            headers: {
              "Content-Type":
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "Content-Disposition": 'attachment; filename="Raqamli_iqtisodiyot.docx"',
            },
          })
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    try {
      render(<ImageTopicParser workType="general" />);

      const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
      fireEvent.change(fileInput, {
        target: { files: [new File(["img"], "topics.png", { type: "image/png" })] },
      });

      expect(await screen.findByDisplayValue("Qisqa mazmun")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /2-3 bet Mustaqil ish yozish/i }));

      // Markdown preview opens directly without calling /api/academic/topics/save or needing login
      const previewCard = await screen.findByLabelText("Tayyor ishlar ko'rinishi");
      expect(within(previewCard).getByText(/Tahliliy matn\./i)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalledWith("/api/academic/topics/save", expect.anything());

      // Copy text works without DB save
      fireEvent.click(screen.getByRole("button", { name: /Matnni nusxalash/i }));
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith(
          expect.stringContaining("# 1. Raqamli iqtisodiyot")
        );
      });

      // Word (.docx) export hits /api/academic/export-docx directly without login
      fireEvent.click(screen.getByRole("button", { name: /Word \(\.docx\) yuklash/i }));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/academic/export-docx",
          expect.objectContaining({ method: "POST" })
        );
      });
    } finally {
      clickSpy.mockRestore();
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it("auto-opens image mode on ?mode=image in ExamPrep, EssayBuilder, and Presentation pages and applies presentation slide counts", async () => {
    mockSearchParams = new URLSearchParams("mode=image");

    const { container: examContainer, unmount: unmountExam } = render(<AcademicExamPrepPage />);
    await waitFor(() => {
      expect(examContainer.querySelector(".block #image-upload-input")).not.toBeNull();
    });
    unmountExam();

    const { container: essayContainer, unmount: unmountEssay } = render(
      <AcademicEssayBuilderPage />
    );
    await waitFor(() => {
      expect(essayContainer.querySelector(".block #image-upload-input")).not.toBeNull();
    });
    unmountEssay();

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          topics: [{ title: "Mikroiqtisodiyot asoslari", content: "Talab va taklif qonuni" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const { container: presContainer } = render(<PresentationGeneratorPage />);
    await waitFor(() => {
      expect(presContainer.querySelector(".block #presentation-image-upload-input")).not.toBeNull();
    });

    const presInput = presContainer.querySelector(
      "#presentation-image-upload-input"
    ) as HTMLInputElement;
    fireEvent.change(presInput, {
      target: { files: [new File(["img"], "slides.jpg", { type: "image/jpeg" })] },
    });

    expect(await screen.findByDisplayValue("Talab va taklif qonuni")).toBeInTheDocument();
    const slideCountSelect = screen.getByLabelText("1-mavzu uchun betlar soni");
    fireEvent.change(slideCountSelect, { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: /Formaga qo'llash/i }));

    expect(screen.getAllByText(/15 ta slayd/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue(/Mikroiqtisodiyot asoslari/i).length).toBeGreaterThanOrEqual(
      1
    );
  });

  it("uses generated work title in AmaliyIsh .doc and .pdf filenames (no 18-variant) and scrolls result into view on mobile across pages", async () => {
    const scrollIntoViewMock = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:amaliy-test");
    URL.revokeObjectURL = vi.fn();
    let capturedDownloadName = "";
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      capturedDownloadName = this.download;
    });
    const exportPdfSpy = vi
      .spyOn(pdfExport, "exportElementsToPdf")
      .mockResolvedValue(new Blob(["%PDF"], { type: "application/pdf" }));
    const deliverPdfSpy = vi.spyOn(pdfExport, "deliverPdf").mockResolvedValue("downloaded");

    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/parse-topics") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              topics: [{ title: "Kredit portfeli tahlili", content: "Asosiy ko'rsatkichlar" }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url === "/api/academic/topics/generate-works") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              pagesPerTopic: "5",
              pageCounts: ["5"],
              totalTopics: 1,
              works: [
                {
                  title: "Kredit portfeli tahlili",
                  content: "Rasmdan tayyorlangan 5 betlik natija.",
                  pageCount: "5",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    try {
      const { unmount } = render(<AmaliyIshPage />);
      const fileInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
      fireEvent.change(fileInput, {
        target: { files: [new File(["img"], "amaliy.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Asosiy ko'rsatkichlar")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /5 bet Amaliy ish yozish/i }));

      expect(await screen.findByText(/Rasmdan 1 ta mavzu \(5 bet\) tayyor/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });

      // Word (.doc) export uses generated topic name without "18-variant" / "18_variant"
      fireEvent.click(screen.getByRole("button", { name: /Word \(\.doc\)/i }));
      expect(capturedDownloadName).toBe("Amaliy_ish_Kredit_portfeli_tahlili.doc");
      expect(capturedDownloadName).not.toMatch(/18[-_]variant/i);

      // PDF export uses generated topic name without "18-variant" / "18_variant"
      fireEvent.click(screen.getByRole("button", { name: /PDF \(\.pdf\)/i }));
      await waitFor(() => {
        expect(exportPdfSpy).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            filename: "Amaliy_ish_Kredit_portfeli_tahlili.pdf",
          })
        );
      });
      unmount();

      // Verify CourseworkGenerator syncs pageCount and scrolls Step 4 result into view
      scrollIntoViewMock.mockClear();
      const { unmount: unmountCoursework } = render(<CourseworkGenerator />);
      const cwInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
      fireEvent.change(cwInput, {
        target: { files: [new File(["img"], "cw.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Asosiy ko'rsatkichlar")).toBeInTheDocument();
      const cwPageSelect = screen.getByLabelText("1-mavzu uchun betlar soni");
      fireEvent.change(cwPageSelect, { target: { value: "5" } });
      fireEvent.click(screen.getByRole("button", { name: /5 bet Kurs ishi yozish/i }));
      expect(await screen.findByText(/Kurs ishi tayyor \(5 sahifa\)/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
      unmountCoursework();

      // Verify Referat, DiplomBMI, ExamPrep, EssayBuilder also scroll result into view & sync length after image generation
      scrollIntoViewMock.mockClear();
      const { unmount: unmountReferat } = render(<AcademicReferatPage />);
      fireEvent.change(screen.getByLabelText("Mavzular rasmini yuklash"), {
        target: { files: [new File(["img"], "ref.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Asosiy ko'rsatkichlar")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /2-3 bet Referat yozish/i }));
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
      unmountReferat();

      scrollIntoViewMock.mockClear();
      const { unmount: unmountBmi } = render(<DiplomBmiPage />);
      fireEvent.change(screen.getByLabelText("Mavzular rasmini yuklash"), {
        target: { files: [new File(["img"], "bmi.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Asosiy ko'rsatkichlar")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /15 bet Diplom ishi yozish/i }));
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
      unmountBmi();

      scrollIntoViewMock.mockClear();
      const { unmount: unmountExam } = render(<AcademicExamPrepPage />);
      fireEvent.change(screen.getByLabelText("Mavzular rasmini yuklash"), {
        target: { files: [new File(["img"], "exam.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Asosiy ko'rsatkichlar")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /3-4 bet Mustaqil ish yozish/i }));
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
      unmountExam();

      scrollIntoViewMock.mockClear();
      render(<AcademicEssayBuilderPage />);
      fireEvent.change(screen.getByLabelText("Mavzular rasmini yuklash"), {
        target: { files: [new File(["img"], "essay.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Asosiy ko'rsatkichlar")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /3-4 bet Akademik insho yozish/i }));
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Yoki aniq bet sonini yozing/i)).toHaveValue("5 bet");
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView;
      clickSpy.mockRestore();
      exportPdfSpy.mockRestore();
      deliverPdfSpy.mockRestore();
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it("rounds fractional range slide counts on PresentationPage, updates pre-filled topic on DiplomBmi, preserves Cyrillic slugs on AmaliyIsh, exits image mode on back nav, and resets stale title on re-upload", async () => {
    const scrollIntoViewMock = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:cyrillic-test");
    URL.revokeObjectURL = vi.fn();
    let capturedDownloadName = "";
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      capturedDownloadName = this.download;
    });
    const exportPdfSpy = vi
      .spyOn(pdfExport, "exportElementsToPdf")
      .mockResolvedValue(new Blob(["%PDF"], { type: "application/pdf" }));
    const deliverPdfSpy = vi.spyOn(pdfExport, "deliverPdf").mockResolvedValue("downloaded");

    try {
      // 1. CreationModeSelector exits "image" mode when URL changes away from ?mode=image (same-route nav & popstate)
      mockSearchParams = new URLSearchParams("mode=image");
      window.history.replaceState(null, "", "/academic/referat?mode=image");
      const { rerender: rerenderSelector, unmount: unmountSelector } = render(
        <CreationModeSelector
          moduleType="referat"
          onSampleBlueprintReady={vi.fn()}
          onSampleCleared={vi.fn()}
        />
      );
      expect(
        screen.getByRole("heading", {
          name: /Rasm yuklang — AI barcha mavzularni avtomatik ajratib beradi/i,
        })
      ).toBeVisible();

      mockSearchParams = new URLSearchParams();
      window.history.replaceState(null, "", "/academic/referat");
      rerenderSelector(
        <CreationModeSelector
          moduleType="referat"
          onSampleBlueprintReady={vi.fn()}
          onSampleCleared={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText(/Mavzular rasm ko'rinishida bormi\?/i)).toBeVisible();
      });

      // Returning via popstate to ?mode=image opens image mode, and popstate back exits it
      window.history.replaceState(null, "", "/academic/referat?mode=image");
      fireEvent(window, new PopStateEvent("popstate"));
      expect(
        screen.getByRole("heading", {
          name: /Rasm yuklang — AI barcha mavzularni avtomatik ajratib beradi/i,
        })
      ).toBeVisible();
      window.history.replaceState(null, "", "/academic/referat");
      fireEvent(window, new PopStateEvent("popstate"));
      expect(screen.getByText(/Mavzular rasm ko'rinishida bormi\?/i)).toBeVisible();
      unmountSelector();

      // 2. PresentationPage rounds fractional "2-3" range (2.5 -> 3) and updates topic even when pre-filled
      mockSearchParams = new URLSearchParams("mode=image&topic=Eski+mavzu");
      mockFetch.mockImplementation((url: string) => {
        if (url === "/api/parse-topics") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                topics: [{ title: "O‘zbekiston iqtisodiyoti", content: "Makroiqtisodiy tahlil" }],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
        if (url === "/api/academic/topics/generate-works") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                pagesPerTopic: "2-3",
                pageCounts: ["2-3"],
                totalTopics: 1,
                works: [
                  {
                    title: "O‘zbekiston iqtisodiyoti",
                    content: "Tayyor materiallar",
                    pageCount: "2-3",
                  },
                ],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const { container: presContainer, unmount: unmountPres } = render(
        <PresentationGeneratorPage />
      );
      const presInput = presContainer.querySelector(
        "#presentation-image-upload-input"
      ) as HTMLInputElement;
      fireEvent.change(presInput, {
        target: { files: [new File(["img"], "p.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Makroiqtisodiy tahlil")).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText("1-mavzu uchun betlar soni"), {
        target: { value: "2-3" },
      });
      fireEvent.click(screen.getByRole("button", { name: /2-3 bet Prezentatsiya matni yozish/i }));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Prezentatsiyani Generatsiya Qilish \(3 ta slayd\)/i })
        ).toBeInTheDocument();
        expect(screen.queryByText(/2\.5 ta slayd/i)).not.toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(
            /Raqamli iqtisodiyot sharoitida bank xizmatlarini transformatsiya qilish/i
          )
        ).toHaveValue("O‘zbekiston iqtisodiyoti");
      });
      unmountPres();
      mockSearchParams = new URLSearchParams();

      // 3. DiplomBmiPage overrides pre-filled specialty topic with generated image topic
      const { container: bmiContainer, unmount: unmountBmi } = render(<DiplomBmiPage />);
      fireEvent.change(screen.getByLabelText("Mavzular rasmini yuklash"), {
        target: { files: [new File(["img"], "bmi2.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Makroiqtisodiy tahlil")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /15 bet Diplom ishi yozish/i }));
      await waitFor(() => {
        expect(bmiContainer.querySelector('textarea[name="topic"]')).toHaveValue(
          "O‘zbekiston iqtisodiyoti"
        );
      });
      unmountBmi();

      // 4. AmaliyIshPage preserves Cyrillic and handles Uzbek apostrophes in .doc/.pdf filenames
      mockFetch.mockImplementation((url: string) => {
        if (url === "/api/parse-topics") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                topics: [{ title: "Ахборот хавфсизлиги асослари", content: "Кириш матни" }],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
        if (url === "/api/academic/topics/generate-works") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                pagesPerTopic: "5",
                pageCounts: ["5"],
                totalTopics: 1,
                works: [
                  {
                    title: "Ахборот хавфсизлиги асослари",
                    content: "Кирилл тилидаги иш",
                    pageCount: "5",
                  },
                ],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const { unmount: unmountAmaliy } = render(<AmaliyIshPage />);
      fireEvent.change(screen.getByLabelText("Mavzular rasmini yuklash"), {
        target: { files: [new File(["img"], "cyr.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Кириш матни")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /5 bet Amaliy ish yozish/i }));
      expect(await screen.findByText(/Rasmdan 1 ta mavzu \(5 bet\) tayyor/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Word \(\.doc\)/i }));
      expect(capturedDownloadName).toBe("Amaliy_ish_Ахборот_хавфсизлиги_асослари.doc");

      fireEvent.click(screen.getByRole("button", { name: /PDF \(\.pdf\)/i }));
      await waitFor(() => {
        expect(exportPdfSpy).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            filename: "Amaliy_ish_Ахборот_хавфсизлиги_асослари.pdf",
          })
        );
      });
      unmountAmaliy();

      // 5. ImageTopicParser resets documentTitle and clears custom global input cleanly on re-upload & blur
      mockFetch
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ topics: [{ title: "Birinchi rasm mavzusi", content: "Matn 1" }] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ topics: [{ title: "Ikkinchi rasm mavzusi", content: "Matn 2" }] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );

      render(<ImageTopicParser workType="general" />);
      const standaloneInput = screen.getByLabelText("Mavzular rasmini yuklash") as HTMLInputElement;
      fireEvent.change(standaloneInput, {
        target: { files: [new File(["img1"], "first.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Matn 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Saqlanadigan hujjat sarlavhasi")).toHaveValue(
        "Birinchi rasm mavzusi"
      );

      // Re-upload second photo -> documentTitle must update to second photo's topic
      fireEvent.change(standaloneInput, {
        target: { files: [new File(["img2"], "second.jpg", { type: "image/jpeg" })] },
      });
      expect(await screen.findByDisplayValue("Matn 2")).toBeInTheDocument();
      expect(screen.getByLabelText("Saqlanadigan hujjat sarlavhasi")).toHaveValue(
        "Ikkinchi rasm mavzusi"
      );

      // Clearing global custom bet input reverts pagesPerTopic back to default on blur
      const globalCustom = screen.getByLabelText("Har bir mavzuga nechta bet");
      fireEvent.change(globalCustom, { target: { value: "14" } });
      expect(
        screen.getByRole("button", { name: /14 bet Mustaqil ish yozish/i })
      ).toBeInTheDocument();
      fireEvent.change(globalCustom, { target: { value: "" } });
      fireEvent.blur(globalCustom);
      expect(
        screen.getByRole("button", { name: /2-3 bet Mustaqil ish yozish/i })
      ).toBeInTheDocument();
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView;
      clickSpy.mockRestore();
      exportPdfSpy.mockRestore();
      deliverPdfSpy.mockRestore();
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it("exposes 'Talabalar uchun' and 'Rasm tashlash' prominently in mobile sub-nav, nav drawer, dashboard widget, and tools hub", () => {
    // 1. Mobile StudentSubNav keeps "Rasm tashlash" as the 2nd pill (no off-screen scroll required)
    expect(STUDENT_SECTIONS[1]?.id).toBe("image-topics");
    expect(STUDENT_SECTIONS[1]?.shortTitle).toBe("Rasm tashlash");

    // 2. NavLinks includes "Talabalar uchun" and "Rasm tashlash"
    const { unmount: unmountNav } = render(<NavLinks />);
    const studentsNav = screen.getByRole("link", { name: /Talabalar uchun/i });
    const rasmNav = screen.getByRole("link", { name: /Rasm tashlash/i });
    expect(studentsNav).toHaveAttribute("href", "/academic");
    expect(rasmNav).toHaveAttribute("href", "/academic/referat?mode=image");
    unmountNav();

    // 3. MobileMenu drawer exposes "Talabalar uchun" and "Rasm tashlash" on click
    const { unmount: unmountMobile } = render(<MobileMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Open mobile menu/i }));
    expect(screen.getByRole("link", { name: /Talabalar uchun/i })).toHaveAttribute(
      "href",
      "/academic"
    );
    expect(screen.getByRole("link", { name: /Rasm tashlash/i })).toHaveAttribute(
      "href",
      "/academic/referat?mode=image"
    );
    unmountMobile();

    // 4. Dashboard QuickCreateWidget surfaces "Rasm tashlash (Mustaqil ish)"
    const { unmount: unmountWidget } = render(<QuickCreateWidget />);
    const widgetLink = screen.getByRole("link", { name: /Rasm tashlash \(Mustaqil ish\)/i });
    expect(widgetLink).toHaveAttribute("href", "/academic/referat?mode=image");
    unmountWidget();

    // 5. ToolsHubPage surfaces "Rasm tashlash (Mustaqil ish & Referat)"
    render(<ToolsHubPage />);
    const toolsLink = screen.getByRole("link", {
      name: /Rasm tashlash \(Mustaqil ish & Referat\)/i,
    });
    expect(toolsLink).toHaveAttribute("href", "/academic/referat?mode=image");
  });
});
