"use client";

import React from "react";
import { MockTestRunner } from "@/components/academic/MockTestRunner";
import { ENGLISH_MOCK_DATA } from "@/lib/academic/mock-test-data";

export default function EnglishMockTestPage() {
  return <MockTestRunner mockData={ENGLISH_MOCK_DATA} accentColor="blue" />;
}
