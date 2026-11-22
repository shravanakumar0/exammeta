import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaBookOpen, FaExternalLinkAlt, FaRegEye, FaSearch } from "react-icons/fa";
import {
  getResourceModuleNumber,
  isAnswerResource,
  isQuestionResource,
  studyResources
} from "../data/studyResources";
import "./StudyFeatures.css";
import { analyzePyqResources, getQuestionAnswer } from "../api/gemini";
import { getFrequentQuestions } from "../supabaseClient";

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

  const firstPyqSubject = subjects.find(subject =>
    studyResources.some(item =>
      item.subjectKey === subject.key &&
      isQuestionResource(item) &&
      !isAnswerResource(item)
    )
  );
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(
    firstPyqSubject?.key || subjects[0]?.key || ""
  );
  const [selectedModule, setSelectedModule] = useState(1);
  const [openResourceId, setOpenResourceId] = useState("");
  const [search, setSearch] = useState("");
  const [importantQuestions, setImportantQuestions] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [activeQuestion, setActiveQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [storedQuestions, setStoredQuestions] = useState([]);
  const [storedLoading, setStoredLoading] = useState(false);
  const [storedError, setStoredError] = useState("");
  const selectedSubject = subjects.find(subject => subject.key === selectedSubjectKey);

  useEffect(() => {
    if (!selectedSubject) return;
    let active = true;
    setStoredLoading(true);
    setStoredError("");
    getFrequentQuestions({
      subjectCode: selectedSubject.code || selectedSubject.title,
      subjectTitle: selectedSubject.title,
      moduleNumber: selectedModule,
      scheme: "2022",
    }).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setStoredQuestions([]);
        const missingClusterTable =
          error.code === "PGRST205" ||
          /question_clusters|Could not find the table/i.test(error.message || "");
        setStoredError(
          missingClusterTable
            ? "Processed question history is not installed yet. Apply supabase/migrations/202611220002_repeated_questions.sql in the Supabase SQL Editor."
            : error.message || "Could not load stored frequent questions."
        );
      } else {
        setStoredQuestions(data || []);
      }
    }).finally(() => {
      if (active) setStoredLoading(false);
    });
    return () => { active = false; };
  }, [selectedSubject, selectedModule]);
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

  const handleGetAnswer = async (question) => {
    setActiveQuestion(question);
    setAnswer("");
    setAnswerLoading(true);
    try {
      const resourceUrl = visibleQuestionResources[0]?.url || "";
      const result = await getQuestionAnswer({
        subject: `${selectedSubject.title} (${selectedSubject.code})`,
        moduleNumber: selectedModule,
        question,
        resourceUrl,
      });
      setAnswer(result.answer || "");
    } catch (error) {
      setAnswer(error.message || "Could not generate an answer.");
    } finally {
      setAnswerLoading(false);
    }
  };

  const analyzeSelectedPapers = async () => {
    if (!selectedSubject || !visibleQuestionResources.length) {
      setAnalysisError("Select a subject that has an uploaded PYQ question paper.");
      return;
    }
    setAnalysisLoading(true);
    setAnalysisError("");
    setImportantQuestions([]);
    try {
      const result = await analyzePyqResources({
        subject: `${selectedSubject.title} (${selectedSubject.code})`,
        moduleNumber: selectedModule,
        resourceUrls: visibleQuestionResources
          .filter(item => !isAnswerResource(item))
          .slice(0, 2)
          .map(item => item.url),
      });
      setImportantQuestions(Array.isArray(result.questions) ? result.questions : []);
    } catch (error) {
      const message = error.message || "Could not analyze the uploaded question papers.";
      setAnalysisError(
        /timed out|502|bad gateway/i.test(message)
          ? `${message} The analysis can take longer for large PDFs. Choose Analyze important questions to retry.`
          : message
      );
    } finally {
      setAnalysisLoading(false);
    }
  };

  const autoAnalysisKey = `${selectedSubjectKey}-${selectedModule}-${visibleQuestionResources.map(item => item.id).join("|")}`;
  useEffect(() => {
    if (!selectedSubject || !visibleQuestionResources.length || storedLoading) return;
    if (storedQuestions.length > 0) return;
    if (!analysisLoading) analyzeSelectedPapers();
    // The derived key identifies exactly which subject, module, and uploaded
    // PYQ resources should trigger an analysis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalysisKey]);

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
        <h2>Important PYQ Questions</h2>
        <p>
          Analyze uploaded PYQ PDFs, see repeated questions by module and open a detailed answer for each question.
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
              setImportantQuestions([]);
              setAnalysisError("");
              setActiveQuestion("");
              setAnswer("");
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
              setImportantQuestions([]);
              setAnalysisError("");
              setActiveQuestion("");
              setAnswer("");
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
        <button
          type="button"
          className="study-resource-button"
          disabled={analysisLoading || !visibleQuestionResources.length}
          onClick={analyzeSelectedPapers}
        >
          <FaSearch aria-hidden="true" />
          {analysisLoading ? "Analyzing PYQs…" : "Analyze important questions"}
        </button>
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
          <h3>Frequently asked questions</h3>
          {storedLoading && <p className="study-empty-state">Loading processed question history…</p>}
          {!storedLoading && storedError && <p className="study-empty-state" role="alert">{storedError}</p>}
          {!storedLoading && !storedError && storedQuestions.length > 0 && (
            <div className="study-resource-list">
              {storedQuestions.map((item) => (
                <article className="study-resource-card" key={item.id}>
                  <div className="study-resource-copy">
                    <span className="study-resource-kicker">
                      Asked {item.repeat_count} {item.repeat_count === 1 ? "time" : "times"}
                      {" "}· Module {item.module_number}
                      {" "}· {item.typical_marks || "Marks not specified"}
                    </span>
                    <h4>{item.representative_question}</h4>
                    {item.years_appeared?.length > 0 && (
                      <p>Appeared in: {item.years_appeared.join(", ")}</p>
                    )}
                  </div>
                  <div className="study-resource-actions">
                    <button
                      type="button"
                      className="study-resource-button"
                      disabled={answerLoading && activeQuestion === item.representative_question}
                      onClick={() => handleGetAnswer(item.representative_question)}
                    >
                      <FaBookOpen />
                      {answerLoading && activeQuestion === item.representative_question ? "Generating answer…" : "Get answer"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {analysisLoading && <p className="study-empty-state">Analyzing uploaded question papers…</p>}
          {!analysisLoading && analysisError && <p className="study-empty-state" role="alert">{analysisError}</p>}
          {!storedLoading && !storedError && storedQuestions.length === 0 &&
            !analysisLoading && !analysisError && importantQuestions.length === 0 && (
              <p className="study-empty-state">
                Select the subject and module, then choose <strong>Analyze important questions</strong>.
              </p>
            )}
          {!analysisLoading && storedQuestions.length === 0 && importantQuestions.length > 0 && (
            <div className="study-resource-list">
              {importantQuestions.map((item, index) => (
                <article className="study-resource-card" key={`${item.question}-${index}`}>
                  <div className="study-resource-copy">
                    <span className="study-resource-kicker">
                      {item.module || `Module ${selectedModule}`} · {item.marks || "Marks not specified"}
                      {" "}· Frequency {item.frequency || 1}
                    </span>
                    <h4>{item.question}</h4>
                    {item.reason && <p>{item.reason}</p>}
                  </div>
                  <div className="study-resource-actions">
                    <button
                      type="button"
                      className="study-resource-button"
                      disabled={answerLoading && activeQuestion === item.question}
                      onClick={() => handleGetAnswer(item.question)}
                    >
                      <FaBookOpen />
                      {answerLoading && activeQuestion === item.question ? "Generating answer…" : "Get answer"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {activeQuestion && (
            <div className="study-resource-preview" aria-live="polite">
              <div className="study-resource-preview-heading">
                <FaBookOpen />
                <strong>{activeQuestion}</strong>
              </div>
              <div style={{ padding: "18px", whiteSpace: "pre-wrap" }}>
                {answerLoading ? "Generating an exam-ready answer…" : answer}
              </div>
            </div>
          )}
        </div>
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
