// Hackathon Finder integration — fetches live hackathon listings from Devpost and Unstop
// Inspired by: https://github.com/dev-shetty/hackathon-finder (Next.js app using same data sources)
// ExamMeta implements equivalent functionality natively in React without requiring a separate Next.js server.

const KARNATAKA = /karnataka|bengaluru|bangalore|mysuru|mysore|mangaluru|mangalore|manipal|hubballi|hubli|belagavi|belgaum|dharwad/i;

const isHttpsUrl = value => {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};

const cleanDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const safeImageUrl = value => {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value.startsWith("//") ? `https:${value}` : value);
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
};

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

async function handleHackathonsRequest(body = {}) {
  // Fetch 4 pages from each source for richer results
  const pages = [1, 2, 3, 4];
  const requests = pages.flatMap(page => [
    { provider: "Devpost", promise: fetchJson(`https://devpost.com/api/hackathons?page=${page}`) },
    { provider: "Unstop", promise: fetchJson(`https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&page=${page}&per_page=15&oppstatus=open&quickApply=true`) },
  ]);

  const results = await Promise.allSettled(requests.map(r => r.promise));
  const fulfilled = results
    .map((result, index) => ({ result, provider: requests[index].provider }))
    .filter(({ result }) => result.status === "fulfilled");

  if (!fulfilled.length) {
    return {
      status: 502,
      body: { error: "Devpost and Unstop are currently unavailable. Please try again in a few minutes." },
    };
  }

  const records = fulfilled.flatMap(({ result, provider }) => {
    const data = result.value;
    if (provider === "Devpost") {
      return (data.hackathons || []).map(item => ({ item, provider: "Devpost" }));
    }
    return (data.data?.data || []).map(item => ({ item, provider: "Unstop" }));
  });

  const today = new Date().toISOString().slice(0, 10);
  const region = body.region === "Karnataka" ? "Karnataka" : "India";
  const query = String(body.query || "").trim().toLowerCase();
  const seen = new Set();

  const events = records.map(({ item, provider }) => {
    const isDevpost = provider === "Devpost";

    const location = String(
      isDevpost
        ? item.displayed_location?.location || "Online"
        : item.region || "Online"
    );

    const dateRange = String(item.submission_period_dates || "").split(" - ");
    const startDate = cleanDate(isDevpost ? dateRange[0] : item.start_date || item.regnRequirements?.start_regn_dt);
    const endDate = cleanDate(isDevpost ? dateRange[1] : item.end_date);

    const rawUrl = isDevpost ? item.url : `https://unstop.com/${item.public_url || ""}`;
    const eventUrl = isDevpost && rawUrl && !rawUrl.startsWith("http")
      ? `https://devpost.com${rawUrl}`
      : rawUrl;

    const tags = isDevpost
      ? (item.themes || []).map(t => t.name).filter(Boolean)
      : (item.filters || []).map(f => f.name).filter(Boolean);

    const prize = isDevpost
      ? String(item.prize_amount || "")
      : (item.prizes || []).map(p => p.cash).filter(Boolean).join(" / ");

    const registrationCount = isDevpost
      ? Number(item.registrations_count || 0)
      : Number(item.registerCount || 0);

    // Thumbnail image (new feature — ported from hackathon-finder)
    const thumbnailUrl = isDevpost
      ? safeImageUrl(item.thumbnail_url)
      : safeImageUrl(item.logo?.original_image || item.logo?.image || "");

    return {
      title: String(item.title || ""),
      organizer: isDevpost ? item.organization_name || "" : item.organisation?.name || "",
      location,
      startDate,
      endDate,
      eventUrl,
      registrationUrl: eventUrl,
      mode: /online|remote/i.test(location) ? "Online" : "In-person",
      provider,
      tags,
      prize,
      registrationCount,
      thumbnailUrl,
    };
  }).filter(event => {
    if (!event.title || !event.startDate || event.startDate < today || !isHttpsUrl(event.eventUrl)) return false;
    if (region === "Karnataka" && !KARNATAKA.test(event.location)) return false;
    if (query && !`${event.title} ${event.organizer} ${event.location}`.toLowerCase().includes(query)) return false;
    const key = event.eventUrl.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    status: 200,
    body: {
      events: events.slice(0, 40),
      sources: [
        { title: "Devpost", uri: "https://devpost.com/hackathons" },
        { title: "Unstop", uri: "https://unstop.com/hackathons" },
      ],
      searchedAt: new Date().toISOString(),
    },
  };
}

module.exports = { handleHackathonsRequest };
