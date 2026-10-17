import React, { useEffect, useMemo, useState } from "react";
import { auth, database } from "../firebase";
import { readApiResponse } from "../api/gemini";
import { get, ref, set } from "firebase/database";
import { FaCalendarAlt, FaClock, FaGraduationCap, FaSpinner } from "react-icons/fa";
import "./StudyPlanner.css";

const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const StudyPlanner = () => {
  const [userId, setUserId] = useState(null);
  const [subjectsText, setSubjectsText] = useState("");
  const [studyDays, setStudyDays] = useState(14);
  const [studyHours, setStudyHours] = useState(4);
  const [startDate, setStartDate] = useState(() => localDate(new Date()));
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => auth.onAuthStateChanged(user => setUserId(user?.uid || null)), []);

  useEffect(() => {
    if (!userId) return;
    get(ref(database, `users/${userId}/studyPlans`)).then(snapshot => {
      if (!snapshot.exists()) return;
      const plans = Object.values(snapshot.val()).filter(item => item && item.plan && item.createdAt);
      plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (plans[0]) setPlan(plans[0].plan);
    }).catch(() => setError("Could not load your saved study plan. Check your connection and try again."));
  }, [userId]);

  const subjects = useMemo(() => subjectsText.split(/[\n,;]+/).map(value => value.trim()).filter(Boolean), [subjectsText]);

  const createPlan = async event => {
    event.preventDefault();
    setError("");
    if (!userId) {
      setError("Sign in again to save your personal study plan.");
      return;
    }
    if (!subjects.length) {
      setError("Enter at least one subject.");
      return;
    }
    if (subjects.length > 12) {
      setError("Add up to 12 subjects per plan.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "study-plan", subjects, studyDays: Number(studyDays), studyHours: Number(studyHours), startDate }),
      });
      const data = await readApiResponse(response, "The AI could not build your study plan.");
      const savedPlan = data.plan;
      if (!savedPlan?.days?.length) throw new Error("The AI returned an incomplete plan. Try again.");
      const planId = `${Date.now()}`;
      await set(ref(database, `users/${userId}/studyPlans/${planId}`), { plan: savedPlan, createdAt: new Date().toISOString() });
      setPlan(savedPlan);
    } catch (planError) {
      setError(planError.message || "Could not create your plan. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="study-planner exam-study-planner">
      <header className="study-planner-hero">
        <span className="study-feature-eyebrow">YOUR PERSONAL EXAM ROADMAP</span>
        <h1>AI Study Planner</h1>
        <p>Tell ExamMeta what subjects you have and how many days remain. It will organize a day-by-day plan around your available study time.</p>
      </header>

      <form className="ai-plan-form" onSubmit={createPlan}>
        <label className="ai-plan-subjects">
          Subjects <span>Separate subjects with commas or put one on each line</span>
          <textarea value={subjectsText} onChange={event => setSubjectsText(event.target.value)} placeholder={"Example: Data Structures\nOperating Systems\nComputer Networks"} rows={4} maxLength={1200} required />
        </label>
        <div className="ai-plan-fields">
          <label><FaCalendarAlt aria-hidden="true" /> Days until exam
            <input type="number" min="1" max="365" value={studyDays} onChange={event => setStudyDays(event.target.value)} required />
          </label>
          <label><FaClock aria-hidden="true" /> Study hours per day
            <input type="number" min="1" max="16" value={studyHours} onChange={event => setStudyHours(event.target.value)} required />
          </label>
          <label><FaCalendarAlt aria-hidden="true" /> Start date
            <input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} required />
          </label>
        </div>
        <button type="submit" className="ai-plan-submit" disabled={loading || !userId}>
          {loading ? <><FaSpinner className="spin" /> Creating your plan…</> : <><FaGraduationCap /> Create my study plan</>}
        </button>
        {!userId && <p className="ai-plan-note">Loading your signed-in student account…</p>}
        {error && <p className="ai-plan-error" role="alert">{error}</p>}
        <p className="ai-plan-note">Plans are saved to your student account. Check specific topics against your official syllabus; this schedule does not claim to know your exam paper.</p>
      </form>

      {plan && (
        <section className="ai-generated-plan" aria-live="polite">
          <div className="ai-plan-heading">
            <div><span className="study-feature-eyebrow">GENERATED FOR YOUR EXAM</span><h2>{plan.title}</h2><p>{plan.summary}</p></div>
            <div className="ai-plan-exam-date"><span>Exam date</span><strong>{plan.examDate}</strong></div>
          </div>
          <div className="ai-plan-day-list">
            {plan.days.map(day => (
              <article className="ai-plan-day" key={`${day.day}-${day.date}`}>
                <header><div><span>DAY {day.day}</span><h3>{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h3></div><small>{day.sessions.reduce((sum, session) => sum + session.minutes, 0)} min planned</small></header>
                <div className="ai-plan-session-list">
                  {day.sessions.map((session, index) => (
                    <div className="ai-plan-session" key={`${day.day}-${session.subject}-${index}`}>
                      <div><strong>{session.subject}</strong><span>{session.focus}</span><p>{session.activity}</p><small>{session.method}</small></div>
                      <b>{session.minutes} min</b>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default StudyPlanner;
