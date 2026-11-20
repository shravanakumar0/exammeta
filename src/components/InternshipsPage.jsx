import React, { useEffect } from "react";
import HackathonFinder from "./HackathonFinder";

export default function InternshipsPage() {
  // Set page title and meta description for SEO
  useEffect(() => {
    document.title = "Internship Finder — Live Listings | ExamMeta";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Browse active internship listings in India sourced from official employer portals via InternScan. Filter by role, company, and location — ExamMeta."
      );
    }
    return () => {
      document.title = "ExamMeta — Student Academic Resources";
    };
  }, []);

  return (
    <main id="main-content" aria-label="Internship Finder">
      <HackathonFinder initialType="internships" showTabs={false} />
    </main>
  );
}
