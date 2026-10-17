import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaBookOpen, FaExternalLinkAlt, FaRegEye, FaSearch } from "react-icons/fa";
import {
  getResourceModuleNumber,
  isAnswerResource,
  isQuestionResource,
  studyResources
} from "../data/studyResources";
import "./StudyFeatures.css";

const MostRepeatedQuestions = () => {
  const subjects = useMemo(() => {
    const uniqueSubjects = new Map();
    studyResources.forEach(item => {
      if (!uniqueSubjects.has(item.subjectKey)) {
        uniqueSubjects.set(item.subjectKey, {
          key: item.subjectKey,
          title: item.subject,
          code: item.code,
          branch: item.branch,
          semester: item.semester
        });
      }
    });
    return Array.from(uniqueSubjects.values());
  }, []);

  const [selectedSubjectKey, setSelectedSubjectKey] = useState(subjects[0]?.key || "");
  const [selectedModule, setSelectedModule] = useState(1);
  const [openResourceId, setOpenResourceId] = useState("");
  const [search, setSearch] = useState("");

  const selectedSubject = subjects.find(subject => subject.key === selectedSubjectKey);
  const subjectResources = studyResources.filter(item => item.subjectKey === selectedSubjectKey);
  const moduleNumbers = Array.from(new Set(
    subjectResources
      .map(getResourceModuleNumber)
      .filter(number => number !== null)
  )).sort((a, b) => a - b);
  const availableModules = moduleNumbers.length ? moduleNumbers : [1, 2, 3, 4, 5];
  const resourcesForModule = subjectResources.filter(item => {
    const moduleNumber = getResourceModuleNumber(item);
    return moduleNumber === null || moduleNumber === Number(selectedModule);
  });
  const questionResources = resourcesForModule.filter(
    item => isQuestionResource(item) && !isAnswerResource(item)
  );
  const filterResources = items => items.filter(item =>
    `${item.resource.title} ${item.resource.description || ""}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const visibleQuestionResources = filterResources(questionResources);
  const openResource = questionResources
    .find(item => item.id === openResourceId);

  const renderResourceCards = (items) => (
    <div className="study-resource-list">
      {items.map(item => (
        <article className="study-resource-card" key={item.id}>
          <div className="study-resource-copy">
            <span className="study-resource-kicker">
              {getResourceModuleNumber(item) === null
                ? "Uploaded PYQ question paper"
                : `Module ${getResourceModuleNumber(item)} PYQ question paper`}
            </span>
            <h4>{item.resource.title}</h4>
            <p>{item.resource.description || "From the website's existing VTU study resources."}</p>
          </div>
          <div className="study-resource-actions">
            <button
              className="study-resource-button"
              type="button"
              onClick={() => setOpenResourceId(openResourceId === item.id ? "" : item.id)}
              aria-expanded={openResourceId === item.id}
            >
              <FaRegEye />
                {openResourceId === item.id ? "Hide PDF" : "Show question PDF"}
            </button>
            <a
              className="study-resource-link"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              Open original <FaExternalLinkAlt />
            </a>
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <section className="study-feature-section repeated-questions" id="repeated-questions">
      <div className="study-feature-heading">
        <span className="study-feature-eyebrow">VTU QUESTION BANK</span>
        <h2>Uploaded PYQ Question Papers</h2>
        <p>
          Browse only the previous-year question papers already uploaded to ExamMeta. Important
          repeated-question predictions are not shown in this section.
        </p>
      </div>

      <div className="study-resource-filters">
        <label>
          Search papers
          <span className="hackathon-search"><FaSearch aria-hidden="true" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title or topic" /></span>
        </label>
        <label>
          Subject
          <select
            value={selectedSubjectKey}
            onChange={event => {
              setSelectedSubjectKey(event.target.value);
              setSelectedModule(1);
              setOpenResourceId("");
            }}
          >
            {subjects.map(subject => (
              <option key={subject.key} value={subject.key}>
                {subject.title} ({subject.code})
              </option>
            ))}
          </select>
        </label>
        <label>
          Module
          <select
            value={selectedModule}
            onChange={event => {
              setSelectedModule(Number(event.target.value));
              setOpenResourceId("");
            }}
          >
            {availableModules.map(moduleNumber => (
              <option key={moduleNumber} value={moduleNumber}>Module {moduleNumber}</option>
            ))}
          </select>
        </label>
        {selectedSubject && (
          <span className="study-resource-subject">
            {selectedSubject.branch} · Semester {selectedSubject.semester}
          </span>
        )}
      </div>

      {openResource && (
        <div className="study-resource-preview">
          <div className="study-resource-preview-heading">
            <FaBookOpen />
            <strong>{openResource.resource.title}</strong>
          </div>
          <iframe
            title={openResource.resource.title}
            src={openResource.resource.previewUrl || openResource.resource.fileUrl}
            loading="lazy"
            allow="autoplay"
          />
        </div>
      )}

      <div className="study-question-columns pyq-only-grid">
        <div>
          <h3>Uploaded question papers</h3>
          {visibleQuestionResources.length
            ? renderResourceCards(visibleQuestionResources)
            : <p className="study-empty-state">No uploaded PYQ paper is listed for this selection.</p>}
        </div>
      </div>

      <p className="study-resource-note">
        Every item above comes from an uploaded source PDF. This page does not invent or
        frequency-rank question text.
        {" "}
        <Link to="/model-papers">Browse all model papers</Link>
      </p>
    </section>
  );
};

export default MostRepeatedQuestions;
