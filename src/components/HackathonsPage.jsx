import React, { useEffect } from "react";
import HackathonFinder from "./HackathonFinder";

export default function HackathonsPage() {
  // Set page title and meta description for SEO
  useEffect(() => {
    document.title = "Hackathon Finder — Live Events | ExamMeta";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
      "Browse live hackathon listings across India and Karnataka. Filter by location, category, and date, with registration links to event organizers."
      );
    }
    return () => {
      document.title = "ExamMeta — Student Academic Resources";
    };
  }, []);

  return (
    <main id="main-content" aria-label="Hackathon Finder">
      <HackathonFinder initialType="hackathons" showTabs={false} />
    </main>
  );
}
