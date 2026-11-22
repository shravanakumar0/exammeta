/**
 * src/api/freeOpportunities.js
 * Public opportunity APIs for hackathons and internships.
 */

import { getApprovedHackathons } from "../supabaseClient";

// ═════════════════════════════════════════════════════════════════════════════
// HACKATHONS — free Devpost + Unstop feeds, served through the same-origin API
// ═════════════════════════════════════════════════════════════════════════════

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const safeHttpsUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
};

const indiaToday = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
}).format(new Date());

const normalizeSubmittedHackathon = (submission) => {
  if (!submission || typeof submission !== "object" || !cleanString(submission.name)) {
    return null;
  }

  return {
    id: `community-${submission.id}`,
    title: cleanString(submission.name),
    organizer: cleanString(submission.organizer),
    description: cleanString(submission.description),
    location: cleanString(submission.location),
    mode: cleanString(submission.mode),
    registrationDeadline: cleanString(submission.registration_deadline),
    startDate: cleanString(submission.event_date),
    endDate: cleanString(submission.event_date),
    prize: cleanString(submission.prizes),
    registrationUrl: safeHttpsUrl(submission.registration_url),
    thumbnailUrl: safeHttpsUrl(submission.poster_url),
    tags: Array.isArray(submission.tech_tags) ? submission.tech_tags.filter(Boolean) : [],
    provider: "ExamMeta community",
    registrationCount: 0,
    isCommunity: true,
  };
};

export const normalizeBrabbleListing = (listing) => {
  if (!listing || typeof listing !== "object") return null;

  const title = cleanString(listing.title);
  if (!title) return null;

  const rawMode = cleanString(listing.mode).toUpperCase();
  const mode = rawMode === "ONLINE"
    ? "Online"
    : rawMode === "OFFLINE"
      ? "In-person"
      : rawMode === "HYBRID"
        ? "Hybrid"
        : "";
  const rawCity = cleanString(listing.city);
  const location = rawCity && rawCity.toLowerCase() !== "see listing"
    ? rawCity
    : mode === "Online"
      ? "Online · India"
      : "India-wide";
  const eligibility = Array.isArray(listing.eligibility)
    ? listing.eligibility.map(cleanString).filter(Boolean)
    : [];
  const prizeAmount = Number(listing.prize?.inr);
  const prizeLabel = cleanString(listing.prize?.label);
  const prize = Number.isFinite(prizeAmount) && prizeAmount > 0
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(prizeAmount)
    : prizeLabel.toLowerCase() === "see listing"
      ? ""
      : prizeLabel;
  const kind = cleanString(listing.kind).toLowerCase();
  const tags = [...new Set([
    cleanString(listing.type),
    kind,
    cleanString(listing.platform),
  ].filter(Boolean))];
  const deadline = cleanString(listing.deadline);
  const registrationCount = Number(listing.registered);

  return {
    id: cleanString(listing.id) || `${title}-${deadline}`,
    title,
    organizer: cleanString(listing.organiser) || "Organizer not listed",
    description: eligibility.join(" · "),
    location,
    mode,
    registrationDeadline: deadline,
    startDate: kind === "contest" ? deadline : "",
    endDate: "",
    prize,
    registrationUrl: safeHttpsUrl(listing.url),
    shareUrl: safeHttpsUrl(listing.shareUrl),
    tags,
    provider: cleanString(listing.platform) || "Brabble.ai",
    registrationCount: Number.isFinite(registrationCount) && registrationCount > 0
      ? registrationCount
      : 0,
    eligibility,
    kind,
    team: cleanString(listing.team),
    fee: cleanString(listing.fee),
  };
};

const normalizeFreeHackathon = (listing) => {
  if (!listing || !cleanString(listing.title)) return null;
  return {
    id: cleanString(listing.id) || cleanString(listing.eventUrl) || `${listing.title}-${listing.startDate}`,
    title: cleanString(listing.title),
    organizer: cleanString(listing.organizer) || "Organizer not listed",
    description: cleanString(listing.description),
    location: cleanString(listing.location) || "India-wide",
    mode: cleanString(listing.mode) || "In-person",
    registrationDeadline: cleanString(listing.registrationDeadline) || cleanString(listing.startDate),
    startDate: cleanString(listing.startDate),
    endDate: cleanString(listing.endDate),
    prize: cleanString(listing.prize),
    registrationUrl: safeHttpsUrl(listing.registrationUrl || listing.eventUrl),
    thumbnailUrl: safeHttpsUrl(listing.thumbnailUrl),
    tags: Array.isArray(listing.tags) ? listing.tags.filter(Boolean) : [],
    provider: cleanString(listing.provider) || "Open opportunity feed",
    registrationCount: Number(listing.registrationCount) || 0,
    kind: "hackathon",
  };
};

export const fetchAllHackathons = async (region = "India") => {
  const response = await fetch(`/api/hackathons?region=${encodeURIComponent(region)}&t=${Date.now()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

  let approvedResult = { data: [], error: null };
  try {
    approvedResult = await getApprovedHackathons();
  } catch (communityError) {
    console.warn("Community hackathons could not be loaded:", communityError);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The hackathon listings service returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Could not load hackathon listings (HTTP ${response.status}).`);
  }
  if (!payload || !Array.isArray(payload.events)) {
    throw new Error("The hackathon listings service returned an invalid response.");
  }
  const today = indiaToday();
  const communityItems = (approvedResult.data || [])
    .map(normalizeSubmittedHackathon)
    .filter(Boolean);
  const items = [
    ...payload.events.map(normalizeFreeHackathon).filter(Boolean),
    ...communityItems,
  ].filter((item) => !item.registrationDeadline || item.registrationDeadline >= today);

  return {
    items,
    total: payload.events.length + communityItems.length,
    refreshedAt: cleanString(payload.searchedAt),
    attribution: "Listings from Unstop and Devpost, plus ExamMeta community submissions.",
  };
};

// ═════════════════════════════════════════════════════════════════════════════
// INTERNSHIPS — Free public APIs (India focus)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Many internship APIs require authentication keys. This function attempts
 * free public sources and returns whatever is available without a key.
 */
export const fetchInternships = async (region = "India", query = "") => {
  const response = await fetch("/api/internships", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ region, query }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(payload.internships)) {
    throw new Error(payload.error || "Could not load internship listings.");
  }
  return payload.internships.map((item) => ({
    ...item,
    id: item.id || item.applicationUrl,
    startDate: item.postedDate || "",
    registrationDeadline: item.applicationDeadline || "",
    mode: /remote|online/i.test(item.location || "") ? "Online" : "In-person",
  }));
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
