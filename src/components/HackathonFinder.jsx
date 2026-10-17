import React, { useState } from "react";
import { readApiResponse } from "../api/gemini";
import { FaExternalLinkAlt, FaSearch, FaSpinner } from "react-icons/fa";
import "./StudyFeatures.css";

const HackathonFinder = () => {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("India");
  const [type, setType] = useState("hackathons");
  const [items, setItems] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedAt, setSearchedAt] = useState("");
  const [lastQuery, setLastQuery] = useState("");

  const search = async event => {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);
    setLastQuery(query.trim());
    try {
      const response = await fetch("/api/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, query, type }),
      });
      const data = await readApiResponse(response, `Live ${type} search failed.`);
      const nextItems = type === "internships" ? data.internships : data.events;
      setItems(Array.isArray(nextItems) ? nextItems : []);
      setSearchedAt(data.searchedAt || "");
    } catch (searchError) {
      setItems([]);
      const message = searchError.message || `Could not load verified ${type}.`;
      setError(message.replace(/hackathon search/gi, internships ? "internship search" : "hackathon search"));
    } finally {
      setLoading(false);
    }
  };

  const internships = type === "internships";
  return (
    <section className="study-feature-section hackathon-finder" id="hackathon-finder">
      <div className="study-feature-heading">
        <span className="study-feature-eyebrow">LIVE, SOURCE-LINKED LISTINGS</span>
        <h2>Hackathons &amp; Internships</h2>
        <p>Search current, source-linked opportunities for students. Results are checked against official pages before they appear here.</p>
      </div>

      <div className="opportunity-tabs" role="tablist" aria-label="Opportunity type">
        <button type="button" role="tab" aria-selected={!internships} className={!internships ? "active" : ""} onClick={() => { setType("hackathons"); setItems([]); setSearched(false); setError(""); }}>Hackathons</button>
        <button type="button" role="tab" aria-selected={internships} className={internships ? "active" : ""} onClick={() => { setType("internships"); setItems([]); setSearched(false); setError(""); }}>Internships</button>
      </div>

      <form className="hackathon-filters" onSubmit={search}>
        <label className="hackathon-region">
          Location
          <select value={region} onChange={event => setRegion(event.target.value)} aria-label="Search location">
            <option value="India">India-wide</option>
            <option value="Karnataka">Karnataka</option>
          </select>
        </label>
        <label className="hackathon-search">
          <FaSearch aria-hidden="true" />
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Role, technology, or domain" aria-label="Search terms" />
        </label>
        <button className="hackathon-search-button" type="submit" disabled={loading}>
          {loading ? <><FaSpinner className="spin" /> Searching live sources…</> : <><FaSearch /> Find {internships ? "internships" : "hackathons"}</>}
        </button>
      </form>

      <div className="hackathon-results" aria-live="polite">
        {error && <p className="hackathon-state error" role="alert">{error}</p>}
        {loading && <p className="hackathon-state loading-state">Checking official sources for {internships ? "internships" : "hackathons"}…</p>}
        {!error && searched && !loading && items.length === 0 && (
          <p className="hackathon-state">No {internships ? "currently open internships" : "upcoming hackathons"} with a verifiable official listing were found{lastQuery ? ` for “${lastQuery}”` : ""}. Try a broader search or check again later.</p>
        )}
        {items.map((item, index) => (
          <article className="hackathon-event-card" key={`${internships ? item.officialUrl : item.eventUrl}-${index}`}>
            <div className="hackathon-event-meta"><span>{item.mode || (internships ? "Internship" : "Event")}</span>{item.location && <span>{item.location}</span>}{internships && item.domain && <span>{item.domain}</span>}</div>
            <h3>{item.title}</h3>
            {item.organizer && <p className="hackathon-organizer">{item.organizer}</p>}
            {internships ? (
              <p className="hackathon-date">No application fee · {item.applicationDeadline ? `Apply by ${item.applicationDeadline}` : "Deadline not listed by employer"}</p>
            ) : (
              <p className="hackathon-date">{item.startDate}{item.endDate && item.endDate !== item.startDate ? ` – ${item.endDate}` : ""}</p>
            )}
            <div className="hackathon-event-actions">
              {internships ? <a href={item.applicationUrl} target="_blank" rel="noopener noreferrer">Apply on official page <FaExternalLinkAlt /></a> : item.registrationUrl ? <a href={item.registrationUrl} target="_blank" rel="noopener noreferrer">Official registration <FaExternalLinkAlt /></a> : <span>Registration link not confirmed yet</span>}
              <a href={internships ? item.officialUrl : item.eventUrl} target="_blank" rel="noopener noreferrer">Official source <FaExternalLinkAlt /></a>
            </div>
            <small>Source: Google Search · official {internships ? "employer" : "organizer"} page</small>
          </article>
        ))}
      </div>

      <p className="hackathon-source-note">{searchedAt ? `Last searched ${new Date(searchedAt).toLocaleString()}. ` : ""}Listings are searched live and are not a guaranteed-complete calendar. Confirm details and eligibility with the official source.</p>
    </section>
  );
};

export default HackathonFinder;
