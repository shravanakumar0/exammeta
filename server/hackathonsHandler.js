// Brabble-backed listings are served by GET; the existing POST search handler remains for compatibility.

const KARNATAKA = /karnataka|bengaluru|bangalore|mysuru|mysore|mangaluru|mangalore|manipal|hubballi|hubli|belagavi|belgaum|dharwad/i;
const BRABBLE_LISTINGS_URL = "https://brabble.ai/api/listings?hub=hackathons&limit=100";
const BRABBLE_CACHE_TTL = 60 * 60 * 1000;
let cachedBrabbleListings = null;
let brabbleCacheExpiresAt = 0;

const isHttpsUrl = value => {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};

const cleanDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const cleanDevpostDates = (value) => {
  const text = String(value || "");
  if (!text) return { startDate: "", endDate: "" };

  const monthNames = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const matches = [...text.matchAll(new RegExp(`\\b${monthNames}\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?`, "gi"))];

  if (!matches.length) return { startDate: "", endDate: "" };

  const parsed = matches.map((match) => ({
    month: match[1],
    day: Number(match[2]),
    year: match[3] ? Number(match[3]) : null,
  }));

  const explicitYears = parsed.map((part) => part.year).filter(Boolean);
  const startYear = parsed[0].year || explicitYears.at(-1) || new Date().getUTCFullYear();
  const endYear = parsed[1]?.year || parsed[0].year || explicitYears.at(-1) || startYear;

  const startDate = cleanDate(`${parsed[0].month} ${parsed[0].day}, ${startYear}`);
  const endDate = parsed[1]
    ? cleanDate(`${parsed[1].month} ${parsed[1].day}, ${endYear}`)
    : "";

  return { startDate, endDate };
};

const safeImageUrl = value => {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value.startsWith("//") ? `https:${value}` : value);
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
};

async function handleBrabbleHackathonsRequest() {
  const apiKey = process.env.BRABBLE_API_KEY;
  if (!apiKey) {
    return {
      status: 503,
      body: { error: "Hackathon listings are not configured. Set BRABBLE_API_KEY on the server." },
    };
  }

  if (cachedBrabbleListings && Date.now() < brabbleCacheExpiresAt) {
    return { status: 200, body: cachedBrabbleListings };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(BRABBLE_LISTINGS_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    });

    if (response.status === 401) {
      return {
        status: 503,
        body: { error: "Brabble rejected the configured API key. Check BRABBLE_API_KEY on the server." },
      };
    }
    if (response.status === 429) {
      return {
        status: 429,
        body: { error: "The Brabble API daily limit has been reached. Try again after midnight IST." },
      };
    }
    if (!response.ok) {
      return {
        status: 502,
        body: { error: `Brabble could not load hackathon listings (HTTP ${response.status}). Please try again later.` },
      };
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.listings)) {
      return {
        status: 502,
        body: { error: "Brabble returned an invalid hackathon listings response." },
      };
    }

    cachedBrabbleListings = payload;
    brabbleCacheExpiresAt = Date.now() + BRABBLE_CACHE_TTL;
    return { status: 200, body: payload };
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return {
      status: timedOut ? 504 : 502,
      body: {
        error: timedOut
          ? "Brabble took too long to respond. Please try again."
          : "Could not connect to Brabble. Check the server connection and try again.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

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

    const devpostDates = isDevpost ? cleanDevpostDates(item.submission_period_dates) : null;
    const startDate = isDevpost
      ? devpostDates.startDate
      : cleanDate(item.start_date || item.regnRequirements?.start_regn_dt || item.regn_start_date || item.registration_start_date);
    const endDate = isDevpost
      ? devpostDates.endDate
      : cleanDate(item.end_date || item.regnRequirements?.end_regn_dt || item.regn_end_date || item.registration_end_date);

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
      registrationDeadline: endDate,
      mode: /online|remote/i.test(location) ? "Online" : "In-person",
      provider,
      tags,
      prize,
      registrationCount,
      thumbnailUrl,
    };
  }).filter(event => {
    if (!event.title || !isHttpsUrl(event.eventUrl)) return false;
    if (event.registrationDeadline && event.registrationDeadline < today) return false;
    if (!event.registrationDeadline && event.startDate && event.startDate < today && event.provider === "Devpost") return false;
    if (region === "Karnataka" && !KARNATAKA.test(event.location) && !/online|remote/i.test(event.location)) return false;
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

module.exports = { handleBrabbleHackathonsRequest, handleHackathonsRequest };
