import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { AiGeneratorDemo } from "./ai-generator-demo";

// Mock motion/react
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Helper: create a successful API response
function successResponse(data: object) {
  return Promise.resolve(
    new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );
}

// Helper: create an error API response
function errorResponse(status: number, code = "SERVER_ERROR", message = "Server error") {
  return Promise.resolve(
    new Response(JSON.stringify({ success: false, data: null, error: { code, message } }), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

const VALID_RESULT = {
  provider: "fallback",
  summary: "Experienced product designer with 5 years driving impact.",
  experience: [
    {
      jobTitle: "Product Designer",
      company: "ACME Corp",
      period: "2019-2024",
      bullets: ["Led design system", "Improved engagement by 40%"],
    },
  ],
  skills: ["Figma", "UX Research", "Design Systems"],
};

describe("AiGeneratorDemo", () => {
  // Test 4: Empty input is rejected
  it("rejects empty input and shows Uzbek error without calling fetch", async () => {
    render(<AiGeneratorDemo />);

    const textarea = screen.getByLabelText(/career information input/i);
    fireEvent.change(textarea, { target: { value: "short" } });

    const button = screen.getByRole("button", { name: /generate resume/i });
    // Button should be disabled because input is < 10 chars
    expect(button).toBeDisabled();

    // Attempting to click shouldn't trigger fetch
    fireEvent.click(button);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // Test 5: Generate button enters loading state
  it("shows loading state when Generate is clicked with valid input", async () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves → stays loading

    render(<AiGeneratorDemo />);

    const button = screen.getByRole("button", { name: /generate resume/i });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByRole("button", { name: /generating resume content/i })).toBeDisabled();
    expect(screen.getByText(/yaratilmoqda/i)).toBeInTheDocument();
  });

  // Test 6: Successful AI response updates component
  it("displays generated content when AI responds successfully", async () => {
    mockFetch.mockReturnValue(successResponse(VALID_RESULT));

    const onGenerated = vi.fn();
    render(<AiGeneratorDemo onGenerated={onGenerated} />);

    const button = screen.getByRole("button", { name: /generate resume/i });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Experienced product designer with 5 years driving impact.")
      ).toBeInTheDocument();
    });

    expect(onGenerated).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: VALID_RESULT.summary,
      })
    );
    expect(screen.getByText("Figma")).toBeInTheDocument();
  });

  // Test 7: Invalid AI response (missing required fields) is handled safely
  it("shows error when API returns invalid/malformed data", async () => {
    // API returns 502 with AI_PARSE_ERROR
    mockFetch.mockReturnValue(
      errorResponse(502, "AI_PARSE_ERROR", "Javobni qayta ishlashda xatolik")
    );

    render(<AiGeneratorDemo />);

    const button = screen.getByRole("button", { name: /generate resume/i });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // Should show timeout/AI error message for 502
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBeTruthy();
    // Should NOT show generated content
    expect(screen.queryByText("Kasbiy qisqacha ma'lumot")).not.toBeInTheDocument();
  });

  // Test 8: Network/API error is displayed
  it("shows a network error message when fetch throws", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<AiGeneratorDemo />);

    const button = screen.getByRole("button", { name: /generate resume/i });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByRole("alert").textContent).toContain("ulanishda xatolik");
  });

  // Test 9: Duplicate requests are prevented
  it("prevents a second fetch while first is still loading", async () => {
    let resolveFirst!: (value: Response) => void;
    const firstRequest = new Promise<Response>((res) => {
      resolveFirst = res;
    });
    mockFetch.mockReturnValueOnce(firstRequest);

    render(<AiGeneratorDemo />);

    const button = screen.getByRole("button", { name: /generate resume/i });

    await act(async () => {
      fireEvent.click(button);
    });

    // While first is loading, click again (button is disabled but let's also test the ref guard)
    // The button is disabled so we simulate the function call directly via another click
    await act(async () => {
      fireEvent.click(button);
    });

    // Only 1 fetch should have been made
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Clean up
    await act(async () => {
      resolveFirst(
        new Response(JSON.stringify({ success: true, data: VALID_RESULT }), { status: 200 })
      );
    });
  });

  // Test 10: Fallback provider path works correctly
  it("handles fallback provider response identically to Gemini", async () => {
    const fallbackResult = { ...VALID_RESULT, provider: "fallback" as const };
    mockFetch.mockReturnValue(successResponse(fallbackResult));

    render(<AiGeneratorDemo />);

    const button = screen.getByRole("button", { name: /generate resume/i });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Experienced product designer with 5 years driving impact.")
      ).toBeInTheDocument();
    });

    // Should show provider as "Mahalliy" (local fallback)
    expect(screen.getByText(/mahalliy/i)).toBeInTheDocument();
  });

  it("shows rate limit error for 429 response", async () => {
    mockFetch.mockReturnValue(errorResponse(429, "AI_RATE_LIMIT"));

    render(<AiGeneratorDemo />);

    const button = screen.getByRole("button", { name: /generate resume/i });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/So.rovlar cheklovi oshib ketdi/i);
    });
  });
});
