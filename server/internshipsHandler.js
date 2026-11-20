// InternScan integration — fetches live internship listings from the public InternScan API
// Repository: https://github.com/vishnunandan555/internscan
// The InternScan project is a Python-based scraper that publishes a public REST/JSON feed.
// ExamMeta consumes this feed to show live India internship listings.

const FEED_URLS = [
  "https://internscan.vercel.app/in/api/active.json",
  "https://internscan.vercel.app/api/active.json",
  "https://raw.githubusercontent.com/vishnunandan555/internscan/main/data/in/jobs.json",
];

const KARNATAKA = /karnataka|bengaluru|bangalore|mysuru|mysore|mangaluru|mangalore|manipal|hubballi|hubli|belagavi|belgaum|dharwad/i;

const safeHttpsUrl = value => {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};

async function tryFetch(url, signal) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function handleInternshipsRequest(body = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  let lastError = null;
  let data = null;

  // Try each fallback URL in sequence
  for (const url of FEED_URLS) {
    try {
      data = await tryFetch(url, controller.signal);
      // Accept either { jobs: [...] } or a bare array
      if (Array.isArray(data)) {
        data = { jobs: data };
      }
      if (Array.isArray(data.jobs)) break; // success
      data = null; // unexpected shape, try next
    } catch (err) {
      lastError = err;
      data = null;
    }
  }

  clearTimeout(timeout);

  if (!data || !Array.isArray(data.jobs)) {
    const isTimeout = lastError && lastError.name === "AbortError";
    return {
      status: 502,
      body: {
        error: isTimeout
          ? "Internship search timed out. InternScan may be temporarily unavailable — please try again in a moment."
          : "InternScan is currently unavailable (all endpoints tried). The open-source feed at internscan.vercel.app may be down temporarily. Please retry later.",
      },
    };
  }

  const query = String(body.query || "").trim().toLowerCase();
  const region = body.region === "Karnataka" ? "Karnataka" : "India";
  const seen = new Set();

  const internships = data.jobs.filter(job => {
    const url = String(job.url || "");
    if (!job.title || !job.company || !safeHttpsUrl(url) || seen.has(url.toLowerCase())) return false;

    if (region === "Karnataka") {
      const locationText = [job.locations, job.city_tag, job.region].join(" ");
      if (!KARNATAKA.test(locationText)) return false;
    }

    const haystack = [job.title, job.company, job.locations, job.city_tag, job.category].join(" ").toLowerCase();
    if (query && !haystack.includes(query)) return false;

    seen.add(url.toLowerCase());
    return true;
  }).map(job => ({
    title: job.title,
    organizer: job.company,
    location: [job.locations, job.city_tag].filter(Boolean).join(" · "),
    domain: job.category || "",
    applicationUrl: job.url,
    officialUrl: job.url,
    sourceUrl: "https://github.com/vishnunandan555/internscan",
    postedDate: job.posted || job.first_seen || "",
    applicationDeadline: "",
    source: "InternScan (official ATS listing)",
    active: job.active !== false,
  })).filter(j => j.active);

  return {
    status: 200,
    body: {
      internships,
      source: "InternScan",
      sourceUrl: "https://github.com/vishnunandan555/internscan",
      attribution: "Data sourced from InternScan — an open-source global internship tracker by vishnunandan555",
      updatedAt: data.updated_at || null,
      searchedAt: new Date().toISOString(),
    },
  };
}

module.exports = { handleInternshipsRequest };
