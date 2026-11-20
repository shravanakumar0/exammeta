/**
 * src/api/freeOpportunities.js
 * Free public APIs for hackathons and internships (India & Karnataka focus)
 * No API keys required for these endpoints.
 */

// ═════════════════════════════════════════════════════════════════════════════
// HACKATHONS — Free public APIs
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Devpost — Global hackathon platform (free public API)
 * Filters results for India / Karnataka on the client side.
 */
export const fetchDevpostHackathons = async (region = "India") => {
  const results = [];
  try {
    const res = await fetch(
      "https://devpost.com/api/hackathons?upcoming=true&page=1&per_page=25",
      { mode: "cors", headers: { Accept: "application/json" } }
    );
    if (!res.ok) return results;
    const data = await res.json();
    const hackathons = data.hackathons || [];

    for (const h of hackathons) {
      const location = (h.location || "").toLowerCase();
      const isIndia =
        /india|bengaluru|bangalore|mumbai|delhi|pune|hyderabad|chennai|karnataka|noida|gurugram|kolkata|ahmedabad/.test(
          location
        );
      if (!isIndia) continue;

      if (region === "Karnataka" && !/karnataka|bengaluru|bangalore|mysore|mangalore|hubli|belagavi/.test(location)) {
        continue;
      }

      results.push({
        id: `devpost-${h.id}`,
        title: h.title || "Untitled Hackathon",
        description: h.description || "",
        organizer: h.organization || "Devpost",
        location: h.location || "India",
        mode: h.online ? "Online" : "In-person",
        registrationDeadline: h.application_deadline || null,
        startDate: h.starts_at || null,
        endDate: h.ends_at || null,
        prize: h.prize || null,
        registrationUrl: h.url || null,
        tags: (h.tag_list || []).slice(0, 6),
        provider: "Devpost",
        isCommunity: false,
        thumbnailUrl: h.thumbnail_url || null,
      });
    }
  } catch (err) {
    console.warn("Devpost API fetch failed:", err.message);
  }
  return results;
};

/**
 * Unstop — Indian hackathon & competition platform (free public API)
 * Heavily focused on India, great for Karnataka listings.
 */
export const fetchUnstopHackathons = async (region = "India") => {
  const results = [];
  try {
    const res = await fetch(
      "https://unstop.com/api/public/hackathons?page=1&limit=25",
      { mode: "cors", headers: { Accept: "application/json" } }
    );
    if (!res.ok) return results;
    const data = await res.json();
    const hackathons = data.data || data.hackathons || [];

    for (const h of hackathons) {
      const location = (h.location || h.city || "").toLowerCase();
      const isIndia = /india|karnataka|bengaluru|bangalore|mysore|mumbai|delhi|pune/.test(location);
      if (!isIndia) continue;

      if (region === "Karnataka" && !/karnataka|bengaluru|bangalore|mysore|mangalore|hubli/.test(location)) {
        continue;
      }

      results.push({
        id: `unstop-${h.id}`,
        title: h.title || h.name || "Untitled Hackathon",
        description: h.description || "",
        organizer: h.organizer || h.company || "Unstop",
        location: h.location || h.city || "India",
        mode: h.mode || "Online",
        registrationDeadline: h.registration_end_date || h.last_date || null,
        startDate: h.start_date || null,
        endDate: h.end_date || null,
        prize: h.prize || null,
        registrationUrl: h.url || h.apply_url || null,
        tags: (h.tags || []).slice(0, 6),
        provider: "Unstop",
        isCommunity: false,
        thumbnailUrl: h.image_url || h.thumbnail || null,
      });
    }
  } catch (err) {
    console.warn("Unstop API fetch failed:", err.message);
  }
  return results;
};

/**
 * Aggregates hackathons from all free sources, deduplicated by title.
 */
export const fetchAllHackathons = async (region = "India") => {
  const [devpost, unstop] = await Promise.all([
    fetchDevpostHackathons(region),
    fetchUnstopHackathons(region),
  ]);

  const combined = [...devpost, ...unstop];
  const seen = new Set();
  return combined.filter((item) => {
    const key = item.title.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ═════════════════════════════════════════════════════════════════════════════
// INTERNSHIPS — Free public APIs (India focus)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Many internship APIs require authentication keys. This function attempts
 * free public sources and returns whatever is available without a key.
 */
export const fetchInternships = async (region = "India", query = "") => {
  const results = [];

  // Try Internshala public listing endpoint (no key, may be rate-limited)
  try {
    await fetch(
      `https://internshala.com/student/internships/${encodeURIComponent(query || "")}/`,
      { mode: "cors", headers: { Accept: "text/html" } }
    );
    // Internshala returns HTML; we can't parse it reliably without a key.
    // This is a placeholder showing we attempted the free source.
    console.info("Internshala HTML endpoint reached (parsing not implemented without key)");
  } catch (err) {
    console.warn("Internshala fetch failed:", err.message);
  }

  // Note: Most internship APIs (Internshala, LinkedIn, Wellfound, Freshersworld)
  // require API keys. If you have a key, add it to .env and implement here.
  return results;
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPER — Format date for display
// ═════════════════════════════════════════════════════════════════════════════

export const formatDate = (isoString) => {
  if (!isoString) return "TBD";
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
};
