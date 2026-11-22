/**
 * HackathonFinder — Live hackathon & internship finder (Free public APIs)
 *
 * Data sources (no API keys required):
 *  - Devpost (global hackathons, filtered for India)
 *  - Unstop (Indian hackathons & competitions)
 *
 * UI: Clean card grid with search, region (India/Karnataka), category tags,
 * online-only filter, and sort options.
 */
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaExternalLinkAlt,
  FaSearch,
  FaSpinner,
  FaMapMarkerAlt,
  FaTrophy,
  FaUsers,
  FaCalendarAlt,
  FaBriefcase,
  FaCode,
} from "react-icons/fa";
import {
  fetchAllHackathons,
  fetchInternships,
  formatDate,
} from "../api/freeOpportunities";
import "./StudyFeatures.css";
import "./HackathonFinder.css";

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="hf-card hf-skeleton" aria-hidden="true">
      <div className="hf-skeleton-img" />
      <div className="hf-card-body">
        <div className="hf-skeleton-line hf-skeleton-line--short" />
        <div className="hf-skeleton-line" />
        <div className="hf-skeleton-line hf-skeleton-line--medium" />
        <div className="hf-skeleton-footer">
          <div className="hf-skeleton-pill" />
          <div className="hf-skeleton-pill" />
        </div>
      </div>
    </div>
  );
}

const KARNATAKA_LOCATIONS = /\b(?:karnataka|bengaluru|bangalore|mysuru|mysore|mangaluru|mangalore|manipal|hubballi|hubli|belagavi|belgaum|dharwad|udupi|shivamogga|shimoga|tumakuru|tumkur|ballari|bellary|vijayapura|bijapur|kalaburagi|gulbarga|hassan|chikkamagaluru|chikmagalur|raichur|bidar|gadag|kolar|chitradurga|davanagere|davangere|kodagu|coorg)\b/i;

const HackathonFinder = ({ initialType = "hackathons", showTabs = true }) => {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState(initialType === "internships" ? "Karnataka" : "India");
  const [type, setType] = useState(initialType);
  const [items, setItems] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchedAt, setSearchedAt] = useState("");
  const [attribution, setAttribution] = useState("");
  const [apiTotal, setApiTotal] = useState(0);
  const [lastQuery, setLastQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState("soonest");
  const [selectedItem, setSelectedItem] = useState(null);
  const modalCloseRef = useRef(null);
  const previousFocusRef = useRef(null);
  const navigate = useNavigate();
  const isInternships = type === "internships";

  const resetState = () => {
    setItems([]);
    setSearched(false);
    setError("");
    setLoading(false);
    setSearchedAt("");
    setAttribution("");
    setApiTotal(0);
    setSelectedTag("all");
    setSortOrder("soonest");
    setOnlineOnly(false);
  };

  useEffect(() => {
    if (type !== "hackathons") return undefined;

    let active = true;
    setLoading(true);
    setError("");

    fetchAllHackathons()
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setApiTotal(result.total);
        setAttribution(result.attribution);
        setSearchedAt(result.refreshedAt);
        setSearched(true);
      })
      .catch((loadError) => {
        if (!active) return;
        setItems([]);
        setError(loadError.message || "Could not load hackathon listings.");
        setSearched(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [type]);

  useEffect(() => {
    if (type !== "internships") return undefined;

    let active = true;
    setLoading(true);
    setError("");

    fetchInternships(region, "")
      .then((fetched) => {
        if (!active) return;
        setItems(fetched);
        setSearched(true);
        setSearchedAt(new Date().toISOString());
      })
      .catch((loadError) => {
        if (!active) return;
        setItems([]);
        setError(loadError.message || "Could not load internship listings.");
        setSearched(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [type, region]);

  useEffect(() => {
    if (!selectedItem) return undefined;

    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => modalCloseRef.current?.focus());

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedItem(null);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [selectedItem]);

  const search = async (event) => {
    event?.preventDefault();
    if (type !== "internships") return;

    setLoading(true);
    setError("");
    setSearched(true);
    setLastQuery(query.trim());

    try {
      const fetched = await fetchInternships(region, query.trim());
      setItems(fetched);
      if (fetched.length === 0) {
        setError(
          "No free public internship API available without an API key. " +
          "Try searching on Internshala, LinkedIn, or Wellfound directly."
        );
      }
      setSearchedAt(new Date().toISOString());
    } catch (searchError) {
      setItems([]);
      setError(searchError.message || `Could not load verified ${type}.`);
    } finally {
      setLoading(false);
    }
  };

  const tags = useMemo(() => {
    const tagSet = new Set(["all"]);
    items.forEach((item) => {
      (item.tags || []).forEach((t) => tagSet.add(t));
    });
    return [...tagSet].sort();
  }, [items]);

  const visibleItems = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    return items
      .filter((item) => {
        const matchesRegion = region !== "Karnataka" ||
          item.mode === "Online" ||
          KARNATAKA_LOCATIONS.test(item.location || "");
        const matchesQuery = !searchTerm || [
          item.title,
          item.organizer,
          item.description,
          item.location,
          ...(item.tags || []),
        ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
        return matchesRegion &&
          matchesQuery &&
          (selectedTag === "all" || (item.tags || []).includes(selectedTag)) &&
          (!onlineOnly || /online|remote/i.test(`${item.mode || ""} ${item.location || ""}`));
      })
      .sort((a, b) => {
        const aDate = Date.parse(
          a.startDate || a.registrationDeadline || a.applicationDeadline || ""
        ) || Infinity;
        const bDate = Date.parse(
          b.startDate || b.registrationDeadline || b.applicationDeadline || ""
        ) || Infinity;
        return sortOrder === "latest" ? bDate - aDate : aDate - bDate;
      });
  }, [items, query, region, selectedTag, onlineOnly, sortOrder]);

  return (
    <section
      className="study-feature-section hf-section"
      id={isInternships ? "internship-finder" : "hackathon-finder"}
    >
      {/* Page Header */}
      <div className="hf-header">
        <span className="study-feature-eyebrow">
          {isInternships
            ? "FREE PUBLIC APIs — INDIA"
            : "OPEN HACKATHONS — INDIA"}
        </span>
        <h1 className="hf-title">
          {showTabs
            ? "Hackathons & Internships"
            : isInternships
            ? "Internship Finder (India)"
            : "Hackathon Finder (India)"}
        </h1>
        <p className="hf-desc">
          {isInternships
            ? "Free public internship APIs without keys are limited. Try Internshala, LinkedIn, or Wellfound directly."
            : "Browse live listings across India, or narrow the list to Karnataka. Search and filters update as you type."}
        </p>
        {!isInternships && (
          <button
            type="button"
            className="hf-search-btn hf-add-btn"
            onClick={() => navigate("/hackathon-register")}
          >
            Add Hackathon
          </button>
        )}
      </div>

      {/* Type Tabs */}
      {showTabs && (
        <div className="hf-tabs" role="tablist" aria-label="Opportunity type">
          <button
            type="button"
            role="tab"
            aria-selected={!isInternships}
            className={`hf-tab ${!isInternships ? "hf-tab--active" : ""}`}
            onClick={() => {
              setType("hackathons");
              resetState();
            }}
          >
            <FaCode aria-hidden="true" /> Hackathons
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isInternships}
            className={`hf-tab ${isInternships ? "hf-tab--active" : ""}`}
            onClick={() => {
              setType("internships");
              resetState();
            }}
          >
            <FaBriefcase aria-hidden="true" /> Internships
          </button>
        </div>
      )}

      {/* Search Form */}
      <form
        className={`hf-search-form ${isInternships ? "" : "hf-search-form--filters"}`}
        onSubmit={search}
      >
        <label className="hf-field">
          <span className="hf-field-label">Location</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            aria-label="Search location"
            className="hf-select"
          >
            <option value="India">India-wide</option>
            <option value="Karnataka">Karnataka only</option>
          </select>
        </label>

        <label className="hf-field hf-field--grow">
          <span className="hf-field-label">Search</span>
          <div className="hf-input-wrap">
            <FaSearch className="hf-input-icon" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isInternships
                  ? "Role, company, or domain"
                  : "Filter hackathons by title, organizer, or technology"
              }
              aria-label="Search terms"
              className="hf-input"
            />
          </div>
        </label>

        {isInternships && (
          <button
            className="hf-search-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spin" aria-hidden="true" /> Searching…
              </>
            ) : (
              <>
                <FaSearch aria-hidden="true" />
                Find Internships
              </>
            )}
          </button>
        )}
      </form>

      {/* Extra Filters (hackathons only) */}
      {!isInternships && (searched || items.length > 0) && (
        <div className="hf-extra-filters">
          {tags.length > 1 && (
            <label className="hf-field">
              <span className="hf-field-label">Category</span>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="hf-select"
              >
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="hf-field">
            <span className="hf-field-label">Sort by date</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="hf-select"
            >
              <option value="soonest">Soonest first</option>
              <option value="latest">Latest first</option>
            </select>
          </label>
          <label className="hf-online-filter">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
            />
            Online only
          </label>
        </div>
      )}

      {/* Results */}
      <div aria-live="polite" aria-busy={loading}>
        {/* Error */}
        {error && (
          <div className="hf-state hf-state--error" role="alert">
            <strong>Search error:</strong> {error}
            {error.includes("BRABBLE_API_KEY") && (
              <>
                {" "}Create a key in the{" "}
                <a href="https://brabble.ai/dashboard" target="_blank" rel="noopener noreferrer">
                  Brabble dashboard
                </a>
                , then add it to the server environment and restart local development.
              </>
            )}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="hf-grid" role="status" aria-label={`Loading ${isInternships ? "internships" : "hackathons"}`}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!error &&
          (searched || items.length > 0) &&
          !loading &&
          visibleItems.length === 0 && (
          <div className="hf-state">
            No{" "}
            {isInternships ? "open internships" : "upcoming hackathons"} found
            {(isInternships ? lastQuery : query.trim())
              ? ` for "${isInternships ? lastQuery : query.trim()}"`
              : ""} in {region}.
            {isInternships ? (
              <>
                <br />
                Try Internshala, LinkedIn, or Wellfound for India internships.
              </>
            ) : (
              <>
                <br />
                Try a broader search term, change the location filter, or check again later.
              </>
            )}
          </div>
        )}

        {/* Results Grid */}
        {!loading && visibleItems.length > 0 && (
          <>
            <p className="hf-results-count">
              Showing {visibleItems.length}{" "}
              {isInternships ? "internship" : "hackathon"}{visibleItems.length !== 1
                ? "s"
                : ""}
              {!isInternships && items.length > 0
                ? ` of ${items.length} loaded${apiTotal > items.length ? ` (${apiTotal} total)` : ""}`
                : ""}
              {(isInternships ? lastQuery : query.trim())
                ? ` matching "${isInternships ? lastQuery : query.trim()}"`
                : ""}
            </p>
            <div className="hf-grid">
              {visibleItems.map((item, index) => (
                <article
                  className="hf-card"
                  key={`${isInternships ? item.id : item.id}-${index}`}
                >
                  {/* Thumbnail image */}
                  {!isInternships && item.thumbnailUrl && (
                    <div className="hf-card-img-wrap">
                      <img
                        src={item.thumbnailUrl}
                        alt={`${item.title} thumbnail`}
                        className="hf-card-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="hf-card-body">
                    {/* Meta badges */}
                    <div className="hf-card-meta">
                      {item.mode && (
                        <span
                          className={`hf-badge ${
                            item.mode === "Online"
                              ? "hf-badge--online"
                              : "hf-badge--inperson"
                          }`}
                        >
                          {item.mode}
                        </span>
                      )}
                      {!isInternships && item.provider && (
                        <span className="hf-badge hf-badge--provider">
                          {item.provider}
                        </span>
                      )}
                      {isInternships && item.domain && (
                        <span className="hf-badge hf-badge--domain">
                          {item.domain}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="hf-card-title">{item.title}</h3>

                    {/* Organizer */}
                    {item.organizer && (
                      <p className="hf-card-organizer">{item.organizer}</p>
                    )}

                    {!isInternships && item.description && (
                      <p className="hf-card-description">
                        {item.description}
                      </p>
                    )}

                    {/* Location */}
                    {item.location && (
                      <p className="hf-card-detail">
                        <FaMapMarkerAlt aria-hidden="true" className="hf-icon" />
                        {item.location}
                      </p>
                    )}

                    {/* Dates */}
                    {isInternships ? (
                      <p className="hf-card-detail">
                        <FaCalendarAlt aria-hidden="true" className="hf-icon" />
                        {formatDate(item.startDate)}
                        {item.registrationDeadline
                          ? ` · Apply by ${formatDate(item.registrationDeadline)}`
                          : ""}
                      </p>
                    ) : (
                      <p className="hf-card-detail">
                        <FaCalendarAlt aria-hidden="true" className="hf-icon" />
                        {item.registrationDeadline
                          ? `${item.kind === "contest" ? "Starts" : "Register by"} ${formatDate(item.registrationDeadline)}`
                          : ""}
                        {item.kind !== "contest" && item.startDate
                          ? ` · Event ${formatDate(item.startDate)}`
                          : ""}
                        {item.endDate && item.endDate !== item.startDate ? ` – ${formatDate(item.endDate)}` : ""}
                      </p>
                    )}

                    {/* Prize / registrations (hackathons only) */}
                    {!isInternships && (
                      <div className="hf-card-stats">
                        {item.prize && (
                          <span className="hf-stat">
                            <FaTrophy aria-hidden="true" className="hf-icon hf-icon--gold" />
                            {item.prize}
                          </span>
                        )}
                        {item.registrationCount > 0 && (
                          <span className="hf-stat" title="Counts can vary by platform and are not directly comparable.">
                            <FaUsers aria-hidden="true" className="hf-icon" />
                            {item.registrationCount.toLocaleString()} registered
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {!isInternships && (item.tags || []).length > 0 && (
                      <div className="hf-tags">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="hf-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="hf-card-actions">
                      {isInternships ? (
                        <a
                          href={item.applicationUrl || item.registrationUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hf-btn hf-btn--primary"
                        >
                          Apply Now <FaExternalLinkAlt aria-hidden="true" />
                        </a>
                      ) : item.registrationUrl ? (
                        <a
                          href={item.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hf-btn hf-btn--primary"
                        >
                          Register Now <FaExternalLinkAlt aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="hf-no-reg">
                          Registration link not confirmed yet
                        </span>
                      )}

                      {!isInternships && (
                        <button
                          type="button"
                          className="hf-btn hf-btn--ghost"
                          onClick={() => setSelectedItem(item)}
                        >
                          View Details
                        </button>
                      )}
                      {isInternships && (
                        <a
                          href={item.officialUrl || item.registrationUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hf-btn hf-btn--ghost"
                        >
                          View Details <FaExternalLinkAlt aria-hidden="true" />
                        </a>
                      )}
                    </div>

                    {/* Source attribution */}
                    <small className="hf-card-source">
                      {isInternships
                        ? "Source: Internship portals · Confirm eligibility and deadlines directly with the employer."
                        : `Listed via ${item.provider || "Brabble.ai"} · Verify details on the organizer's event page.`}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer note */}
      <p className="hf-footer-note">
        {searchedAt
          ? `${isInternships ? "Last searched" : "Listings refreshed"} ${new Date(searchedAt).toLocaleString("en-IN")}. `
          : ""}
        {isInternships
          ? "Free public internship APIs without keys are limited. Try Internshala, LinkedIn, or Wellfound directly."
          : (
            <>
              {attribution || "Hackathon listings provided by"}{" "}
              <a href="https://brabble.ai/developers" target="_blank" rel="noopener noreferrer">
                Brabble.ai
              </a>
              . Deadlines and prize or registration figures may vary; confirm details with the organizer.
            </>
          )}
      </p>

      {selectedItem && (
        <div
          className="hf-modal-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedItem(null)}
        >
          <section
            className="hf-submit-modal hf-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hackathon-details-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="hf-modal-close"
              type="button"
              onClick={() => setSelectedItem(null)}
              aria-label="Close"
              ref={modalCloseRef}
            >
              ×
            </button>
            <span className="hf-badge hf-badge--provider">
              {selectedItem.provider || "Hackathon"}
            </span>
            <h2 id="hackathon-details-title">{selectedItem.title}</h2>
            <p className="hf-card-organizer">{selectedItem.organizer}</p>
            {selectedItem.thumbnailUrl && (
              <img
                className="hf-details-image"
                src={selectedItem.thumbnailUrl}
                alt=""
              />
            )}
            {selectedItem.description && (
              <p className="hf-details-description">
                {selectedItem.description}
              </p>
            )}
            <dl className="hf-details-grid">
              <div>
                <dt>Mode</dt>
                <dd>{selectedItem.mode || "Not specified"}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{selectedItem.location || "Not specified"}</dd>
              </div>
              <div>
                <dt>{selectedItem.kind === "contest" ? "Contest starts" : "Registration deadline"}</dt>
                <dd>
                  {selectedItem.registrationDeadline
                    ? formatDate(selectedItem.registrationDeadline)
                    : "Check event page"}
                </dd>
              </div>
              {selectedItem.fee && (
                <div>
                  <dt>Entry fee</dt>
                  <dd>{selectedItem.fee}</dd>
                </div>
              )}
              {selectedItem.team && (
                <div>
                  <dt>Team size</dt>
                  <dd>{selectedItem.team}</dd>
                </div>
              )}
              {selectedItem.eligibility?.length > 0 && (
                <div className="hf-details-full">
                  <dt>Eligibility</dt>
                  <dd>{selectedItem.eligibility.join(" · ")}</dd>
                </div>
              )}
              {selectedItem.contactEmail && (
                <div>
                  <dt>Contact</dt>
                  <dd>
                    <a href={`mailto:${selectedItem.contactEmail}`}>
                      {selectedItem.contactEmail}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {selectedItem.registrationUrl && (
              <a
                href={selectedItem.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hf-btn hf-btn--primary"
              >
                Register Now <FaExternalLinkAlt aria-hidden="true" />
              </a>
            )}
            {selectedItem.shareUrl && (
              <a
                href={selectedItem.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hf-btn hf-btn--ghost"
              >
                View on Brabble.ai <FaExternalLinkAlt aria-hidden="true" />
              </a>
            )}
          </section>
        </div>
      )}
    </section>
  );
};

export default HackathonFinder;
