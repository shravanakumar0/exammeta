import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen, FileText, CheckCircle2, ArrowUpRight } from "lucide-react";
import { moduleDetails } from "../data/moduleDetails";
import "./Notes.css";

const branchNames = {
  "first-year": "First Year",
  cse: "Computer Science (CSE)",
  ece: "Electronics (ECE)",
};

const categoryOptions = [
  { value: "all", label: "All resources" },
  { value: "notes", label: "Notes" },
  { value: "pyq", label: "Question papers" },
  { value: "solved-qp", label: "Solutions" },
];

export default function Notes() {
  const [branch, setBranch] = useState("all");
  const [semester, setSemester] = useState("all");
  const [category, setCategory] = useState("all");
  const [scheme, setScheme] = useState("all");
  const [query, setQuery] = useState("");

  const semesters = useMemo(() => {
    if (branch === "all") return [];
    return Object.keys(moduleDetails[branch] || {}).sort((a, b) => Number(a) - Number(b));
  }, [branch]);

  const resources = useMemo(() => {
    const groups = new Map();
    Object.entries(moduleDetails).forEach(([branchKey, semesterMap]) => {
      if (branch !== "all" && branch !== branchKey) return;
      Object.entries(semesterMap).forEach(([semesterKey, subjects]) => {
        if (semester !== "all" && semester !== semesterKey) return;
        subjects.forEach((subject) => {
          const modules = subject.modules || [];
          const subjectScheme = subject.scheme || subject.vtuScheme || subject.syllabus || "";
          if (scheme !== "all" && subjectScheme !== scheme) return;
          const key = [subjectScheme, branchKey, semesterKey, subject.code || subject.vtuCode || subject.title].join("|").toLowerCase();
          if (!groups.has(key)) groups.set(key, { branchKey, semesterKey, subject, scheme: subjectScheme, modules: [] });
          groups.get(key).modules.push(...modules);
        });
      });
    });
    return [...groups.values()].filter(group => {
      const matching = group.modules.filter(module => {
        const kind = module.category || module.type;
        return category === "all" || kind === category || module.type === category;
      });
      if (!matching.length) return false;
      group.matchingModules = matching;
      const searchable = `${group.subject.title} ${group.subject.code || group.subject.vtuCode || ""} ${matching.map(module => `${module.title} ${module.description || ""}`).join(" ")}`.toLowerCase();
      return !query || searchable.includes(query.trim().toLowerCase());
    });
  }, [branch, semester, category, query, scheme]);

  const resetFilters = () => {
    setBranch("all");
    setSemester("all");
    setCategory("all");
    setScheme("all");
    setQuery("");
  };

  return (
    <main className="notes-page">
      <section className="notes-hero">
        <span className="notes-eyebrow"><BookOpen size={15} /> EXAMMETA STUDY LIBRARY</span>
        <h1>Find the right material for your next exam.</h1>
        <p>Browse existing VTU notes, question papers, and solutions by branch, semester, and subject.</p>
        <label className="notes-search">
          <Search size={19} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subjects, codes, or modules" aria-label="Search study resources" />
          {query && <button type="button" onClick={() => setQuery("")}>Clear</button>}
        </label>
      </section>

      <section className="notes-library" aria-label="Study material catalog">
        <div className="notes-library-heading">
          <div><span className="notes-eyebrow">RESOURCE CATALOG</span><h2>Notes &amp; question papers</h2></div>
          <span className="notes-result-count">{resources.length} {resources.length === 1 ? "subject" : "subjects"}</span>
        </div>
        <div className="notes-summary" aria-label="Library summary">
          <div><strong>{Object.keys(moduleDetails).length}</strong><span>Branches</span></div>
          <div><strong>{resources.length}</strong><span>Subjects</span></div>
          <div><strong>{resources.reduce((n, group) => n + group.modules.filter(m => (m.category || m.type) === "pyq").length, 0)}</strong><span>PYQ papers</span></div>
          <div><strong>{resources.reduce((n, group) => n + group.modules.filter(m => (m.category || m.type) === "notes").length, 0)}</strong><span>Notes</span></div>
        </div>
        <div className="notes-filters">
          <label>Scheme<select value={scheme} onChange={event => setScheme(event.target.value)}><option value="all">All schemes</option>{[...new Set(Object.values(moduleDetails).flatMap(semesters => Object.values(semesters).flatMap(subjects => subjects.map(subject => subject.scheme || subject.vtuScheme || subject.syllabus).filter(Boolean))))].sort().map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label>Branch<select value={branch} onChange={(event) => { setBranch(event.target.value); setSemester("all"); }}><option value="all">All branches</option>{Object.keys(moduleDetails).map((key) => <option key={key} value={key}>{branchNames[key] || key.toUpperCase()}</option>)}</select></label>
          <label>Semester<select value={semester} onChange={(event) => setSemester(event.target.value)} disabled={branch === "all"}><option value="all">All semesters</option>{semesters.map((item) => <option key={item} value={item}>Semester {item}</option>)}</select></label>
          <label>Resource type<select value={category} onChange={(event) => setCategory(event.target.value)}>{categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          {(branch !== "all" || semester !== "all" || category !== "all" || scheme !== "all" || query) && <button className="notes-reset" type="button" onClick={resetFilters}>Reset filters</button>}
        </div>

        {resources.length ? <div className="notes-resource-grid">{resources.map(({ branchKey, semesterKey, subject, modules, matchingModules, scheme: subjectScheme }) => {
          const target = `/branch/${branchKey}/${semesterKey}/modules/${encodeURIComponent(subject.title)}`;
          const moduleCount = new Set(modules.map(m => (m.tags || []).find(tag => /^module-\d+$/i.test(tag)) || m.title.match(/module\s*\d+/i)?.[0]).filter(Boolean)).size;
          return <article className="notes-resource-card" key={`${subjectScheme}-${branchKey}-${semesterKey}-${subject.code || subject.vtuCode || subject.title}`}>
            <div className="notes-resource-icon is-notes"><BookOpen size={19} /></div>
            <div className="notes-resource-meta"><span>{branchNames[branchKey] || branchKey.toUpperCase()} <i>·</i> SEM {semesterKey}</span>{subjectScheme && <span className="notes-resource-type">{subjectScheme}</span>}</div>
            <h3>{subject.title}</h3><p className="notes-subject-code">Subject code: {subject.code || subject.vtuCode || "Not listed"}</p>
            <p className="notes-module-title">{moduleCount} modules · {matchingModules.length} available materials</p>
            <Link className="notes-resource-link" to={target}>View subject materials <ArrowUpRight size={16} /></Link>
          </article>;
        })}</div> : <div className="notes-empty"><CheckCircle2 size={25} /><h3>No matching materials</h3><p>Try another branch, semester, or search term. The catalog only lists resources already available in ExamMeta.</p><button type="button" onClick={resetFilters}>Show all resources</button></div>}
      </section>
    </main>
  );
}
