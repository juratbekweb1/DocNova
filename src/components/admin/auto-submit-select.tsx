"use client";

import type { SelectHTMLAttributes } from "react";

/** <select> that submits its parent form on change (needs a Client Component: event handlers cannot be set in Server Components). */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
