"use client";

import React from "react";
import { MockTestRunner } from "@/components/academic/MockTestRunner";
import { TURKISH_MOCK_DATA } from "@/lib/academic/mock-test-data";

export default function TurkishMockTestPage() {
  return <MockTestRunner mockData={TURKISH_MOCK_DATA} accentColor="emerald" />;
}
