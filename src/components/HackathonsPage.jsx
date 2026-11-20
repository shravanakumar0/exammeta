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
        "Find upcoming hackathons in India from Devpost and Unstop. Filter by location, category, and date. Live listings with official registration links — ExamMeta."
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
