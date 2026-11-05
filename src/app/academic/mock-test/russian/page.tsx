"use client";

import React from "react";
import { MockTestRunner } from "@/components/academic/MockTestRunner";
import { RUSSIAN_MOCK_DATA } from "@/lib/academic/mock-test-data";

export default function RussianMockTestPage() {
  return <MockTestRunner mockData={RUSSIAN_MOCK_DATA} accentColor="purple" />;
}
