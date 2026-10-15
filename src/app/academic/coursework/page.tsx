"use client";

import React from "react";
import CourseworkGenerator from "@/app/coursework/page";
import { StudentSubNav } from "@/components/academic/student-sub-nav";

export default function AcademicCourseworkPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <StudentSubNav activeTab="coursework" />
      <CourseworkGenerator />
    </div>
  );
}
