"use client";
import { AppSidebar } from "@/components/Dashboard/app-sidebar";

import { CourseCountContext } from "../_context/CourseCountContext";
import { useState } from "react";

export default function RoadmapsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [courseCount, setCourseCount] = useState(0);
  return (
    <CourseCountContext.Provider value={{ courseCount, setCourseCount }}>
      <div className="h-full flex">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
       
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </CourseCountContext.Provider>
  );
}

