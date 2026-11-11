import { NextResponse } from "next/server";

export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // XSS Protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (allow same-origin camera chooser for mobile image topic capture)
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(self)");

  // HSTS
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Remove server information
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");

  return response;
}

export function getCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
