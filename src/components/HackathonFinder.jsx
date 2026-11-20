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
import React, { useState, useMemo } from "react";
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

const HackathonFinder = ({ initialType = "hackathons", showTabs = true }) => {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("India");
  const [type, setType] = useState(initialType);
  const [items, setItems] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedAt, setSearchedAt] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState("soonest");
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();

  const resetState = () => {
    setItems([]);
    setSearched(false);
    setError("");
    setSelectedTag("all");
    setSortOrder("soonest");
    setOnlineOnly(false);
  };

  const search = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);
    setLastQuery(query.trim());

    try {
      if (type === "internships") {
        const fetched = await fetchInternships(region, query.trim());
        setItems(fetched);
        if (fetched.length === 0) {
          setError(
            "No free public internship API available without an API key. " +
            "Try searching on Internshala, LinkedIn, or Wellfound directly."
          );
        }
      } else {
        const fetched = await fetchAllHackathons(region);
        const q = query.trim().toLowerCase();
        const filtered = q
          ? fetched.filter(
              (item) =>
                item.title.toLowerCase().includes(q) ||
                item.organizer.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.tags?.some((t) => t.toLowerCase().includes(q))
            )
          : fetched;
        setItems(filtered);
      }
      setSearchedAt(new Date().toISOString());
    } catch (searchError) {
      setItems([]);
      setError(searchError.message || `Could not load verified ${type}.`);
    } finally {
      setLoading(false);
    }
  };

  const isInternships = type === "internships";

  const tags = useMemo(() => {
    const tagSet = new Set(["all"]);
    items.forEach((item) => {
      (item.tags || []).forEach((t) => tagSet.add(t));
    });
    return [...tagSet].sort();
  }, [items]);

  const visibleItems = items
    .filter(
      (item) =>
        (selectedTag === "all" || (item.tags || []).includes(selectedTag)) &&
        (!onlineOnly ||
          /online|remote/i.test(`${item.mode || ""} ${item.location || ""}`))
    )
    .sort((a, b) => {
      const aDate = Date.parse(
        a.startDate || a.registrationDeadline || a.applicationDeadline || ""
      ) || Infinity;
      const bDate = Date.parse(
        b.startDate || b.registrationDeadline || b.applicationDeadline || ""
      ) || Infinity;
      return sortOrder === "latest" ? bDate - aDate : aDate - bDate;
    });

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
            : "LIVE FROM DEVPOST & UNSTOP — INDIA"}
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
            : "Upcoming hackathons sourced live from Devpost and Unstop, filtered for India & Karnataka."}
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
      <form className="hf-search-form" onSubmit={search}>
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
                  : "Technology, theme, or domain"
              }
              aria-label="Search terms"
              className="hf-input"
            />
          </div>
        </label>

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
              Find {isInternships ? "Internships" : "Hackathons"}
            </>
          )}
        </button>
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
      <div aria-live="polite">
        {/* Error */}
        {error && (
          <div className="hf-state hf-state--error" role="alert">
            <strong>Search error:</strong> {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="hf-grid">
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
            {lastQuery ? ` for "${lastQuery}"` : ""} in {region}.
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
              {lastQuery ? ` matching "${lastQuery}"` : ""}
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
                          ? `Register by ${formatDate(item.registrationDeadline)}`
                          : ""}
                        {item.startDate ? ` · Event ${formatDate(item.startDate)}` : ""}
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
                          <span className="hf-stat">
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
                        : `Listed via ${item.provider || "Devpost / Unstop"} · Verify details on the official event page.`}
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
        {searchedAt ? `Last searched ${new Date(searchedAt).toLocaleString()}. ` : ""}
        {isInternships
          ? "Free public internship APIs without keys are limited. Try Internshala, LinkedIn, or Wellfound directly."
          : "Listings are fetched live from Devpost and Unstop and are not a guaranteed-complete calendar. Confirm details with the official source."}
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
                <dt>Registration deadline</dt>
                <dd>
                  {selectedItem.registrationDeadline ||
                    formatDate(selectedItem.registrationDeadline) ||
                    "Check event page"}
                </dd>
              </div>
              <div>
                <dt>Event date</dt>
                <dd>
                  {selectedItem.startDate ||
                    formatDate(selectedItem.startDate) ||
                    "Check event page"}
                </dd>
              </div>
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
          </section>
        </div>
      )}
    </section>
  );
};

export default HackathonFinder;
