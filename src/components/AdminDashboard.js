import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCheck,
  FaExternalLinkAlt,
  FaRedo,
  FaSearch,
  FaSignOutAlt,
  FaTrash,
  FaTimes,
  FaTrophy,
} from 'react-icons/fa';
import ResourceManager from './ResourceManager';
import DiscussionManager from './DiscussionManager';
import {
  deleteHackathonSubmission,
  getCurrentUser,
  getHackathonRegistrations,
  getProfile,
  signOut,
  updateHackathonSubmission,
} from '../supabaseClient';
import './AdminDashboard.css';

const statusOptions = ['all', 'pending', 'approved', 'rejected', 'expired'];

const formatDate = (value) => {
  if (!value) return 'Not provided';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
};

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [adminNotes, setAdminNotes] = useState({});
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState('hackathons');

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: loadError } = await getHackathonRegistrations();
      if (loadError) throw loadError;
      setSubmissions(data || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const verifyAdmin = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          if (active) setCheckingAccess(false);
          return;
        }
        const configuredAdminEmail = String(process.env.REACT_APP_ADMIN_EMAIL || '').trim().toLowerCase();
        const signedInEmail = String(user.email || '').trim().toLowerCase();
        const envMatchesAdmin = Boolean(configuredAdminEmail) &&
          configuredAdminEmail === signedInEmail;
        const { data, error: profileError } = await getProfile(user.id);
        if (profileError && !envMatchesAdmin) throw profileError;
        const isAdmin = envMatchesAdmin || (
          data?.is_active &&
          (data.role === 'admin' || data.role === 'super_admin')
        );
        if (!active) return;
        setAuthorized(Boolean(isAdmin));
        if (isAdmin) await loadSubmissions();
      } catch {
        if (active) setError('');
      } finally {
        if (active) setCheckingAccess(false);
      }
    };
    verifyAdmin();
    return () => { active = false; };
  }, [loadSubmissions]);

  const counts = useMemo(() => submissions.reduce((result, item) => {
    result[item.status] = (result[item.status] || 0) + 1;
    return result;
  }, {}), [submissions]);

  const visibleSubmissions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return submissions.filter((item) => {
      const statusMatches = statusFilter === 'all' || item.status === statusFilter;
      const searchMatches = !term || [
        item.name,
        item.organizer,
        item.contact_email,
        item.location,
        item.description,
      ].some((value) => String(value || '').toLowerCase().includes(term));
      return statusMatches && searchMatches;
    });
  }, [submissions, statusFilter, search]);

  const reviewSubmission = async (item, status) => {
    setBusyId(item.id);
    setError('');
    setNotice('');
    try {
      const { data, error: updateError } = await updateHackathonSubmission(
        item.id,
        status,
        adminNotes[item.id] ?? item.admin_note ?? '',
        true
      );
      if (updateError) throw updateError;
      setSubmissions((current) => current.map((submission) =>
        submission.id === item.id
          ? (data || { ...submission, status, admin_note: adminNotes[item.id] ?? item.admin_note ?? '' })
          : submission
      ));
      setNotice(`"${item.name}" was ${status}.`);
    } catch (reviewError) {
      setError(reviewError.message || 'Could not update this submission.');
    } finally {
      setBusyId('');
    }
  };

  const saveNote = async (item) => {
    setBusyId(item.id);
    setError('');
    setNotice('');
    try {
      const { data, error: updateError } = await updateHackathonSubmission(
        item.id,
        item.status,
        adminNotes[item.id] ?? item.admin_note ?? '',
        false
      );
      if (updateError) throw updateError;
      setSubmissions((current) => current.map((submission) =>
        submission.id === item.id
          ? (data || { ...submission, admin_note: adminNotes[item.id] ?? item.admin_note ?? '' })
          : submission
      ));
      setNotice(`Admin note saved for "${item.name}".`);
    } catch (noteError) {
      setError(noteError.message || 'Could not save the admin note.');
    } finally {
      setBusyId('');
    }
  };

  const deleteSubmission = async (item) => {
    if (!window.confirm(`Permanently delete "${item.name}"?`)) return;
    setBusyId(item.id);
    setError('');
    setNotice('');
    try {
      const { error: deleteError } = await deleteHackathonSubmission(item.id);
      if (deleteError) throw deleteError;
      setSubmissions((current) => current.filter((submission) => submission.id !== item.id));
      setNotice(`"${item.name}" was deleted.`);
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete this submission.');
    } finally {
      setBusyId('');
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.assign('/');
  };

  if (checkingAccess) {
    return <main className="admin-dashboard"><p className="admin-status">Checking admin access…</p></main>;
  }

  if (!authorized) {
    return (
      <main className="admin-dashboard">
        <section className="admin-denied">
          <h1>Admin access required</h1>
          <p>This panel is only available to active ExamMeta administrators.</p>
          {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
          <Link className="admin-btn admin-btn-secondary" to="/">Back to ExamMeta</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand"><FaTrophy aria-hidden="true" /><span>ExamMeta Admin</span></div>
        <nav className="admin-nav" aria-label="Admin sections">
          <button type="button" className={section === 'hackathons' ? 'active' : ''} onClick={() => setSection('hackathons')}>Hackathon submissions</button>
          <button type="button" className={section === 'resources' ? 'active' : ''} onClick={() => setSection('resources')}>Study resources</button>
          <button type="button" className={section === 'discussions' ? 'active' : ''} onClick={() => setSection('discussions')}>Student messages</button>
        </nav>
        <button type="button" className="admin-logout" onClick={handleLogout}>
          <FaSignOutAlt aria-hidden="true" /> Sign out
        </button>
      </aside>

      <section className="admin-main">
        {section === 'resources' ? <ResourceManager /> : section === 'discussions' ? <DiscussionManager /> : <>
        <header className="admin-header">
          <div>
            <p>WORKSPACE</p>
            <h1>Hackathon submissions</h1>
          </div>
          <div className="admin-header-actions">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={loadSubmissions} disabled={loading}>
              <FaRedo aria-hidden="true" /> Refresh
            </button>
            <Link className="admin-btn admin-btn-secondary" to="/hackathons">View finder</Link>
          </div>
        </header>

        <div className="admin-stats">
          {statusOptions.map((status) => (
            <button
              type="button"
              key={status}
              className={statusFilter === status ? 'active' : ''}
              onClick={() => setStatusFilter(status)}
              aria-pressed={statusFilter === status}
            >
              <span>{status === 'all' ? submissions.length : counts[status] || 0}</span>
              <small>{status}</small>
            </button>
          ))}
        </div>

        {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
        {notice && <div className="admin-alert admin-alert-success" role="status">{notice}</div>}

        <div className="admin-toolbar">
          <label className="admin-search">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search submissions"
              aria-label="Search hackathon submissions"
            />
          </label>
        </div>

        {loading ? (
          <p className="admin-status">Loading submissions…</p>
        ) : visibleSubmissions.length === 0 ? (
          <p className="admin-status">No submissions match this view.</p>
        ) : (
          <div className="admin-submission-list">
            {visibleSubmissions.map((item) => (
              <article className="admin-submission-card" key={item.id}>
                <div className="admin-card-header">
                  <div>
                    <span className={`admin-status-badge admin-status-${item.status}`}>{item.status}</span>
                    <h2>{item.name}</h2>
                    <p>{item.organizer} · {item.contact_email}</p>
                  </div>
                  <a href={item.registration_url} target="_blank" rel="noopener noreferrer" className="admin-external">
                    Registration <FaExternalLinkAlt aria-hidden="true" />
                  </a>
                </div>

                <p className="admin-description">{item.description}</p>
                <dl className="admin-details">
                  <div><dt>Location</dt><dd>{item.location} · {item.mode}</dd></div>
                  <div><dt>Registration deadline</dt><dd>{formatDate(item.registration_deadline)}</dd></div>
                  <div><dt>Event date</dt><dd>{formatDate(item.event_date)}</dd></div>
                  <div><dt>Technology</dt><dd>{(item.tech_tags || []).join(', ') || 'Not specified'}</dd></div>
                  <div><dt>Prizes</dt><dd>{item.prizes || 'Not specified'}</dd></div>
                  <div><dt>Submitted</dt><dd>{item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : 'Unknown'}</dd></div>
                </dl>

                {item.poster_url && (
                  <a href={item.poster_url} target="_blank" rel="noopener noreferrer" className="admin-poster">
                    View event poster
                  </a>
                )}

                <label className="admin-note" htmlFor={`note-${item.id}`}>Admin note</label>
                <textarea
                  id={`note-${item.id}`}
                  rows={2}
                  maxLength={2000}
                  value={adminNotes[item.id] ?? item.admin_note ?? ''}
                  onChange={(event) => setAdminNotes((current) => ({
                    ...current,
                    [item.id]: event.target.value,
                  }))}
                  placeholder="Optional review note"
                />

                <div className="admin-card-actions">
                  <button type="button" className="admin-btn admin-btn-secondary" disabled={busyId === item.id} onClick={() => saveNote(item)}>
                    Save note
                  </button>
                  {item.status !== 'approved' && (
                    <button type="button" className="admin-btn admin-btn-approve" disabled={busyId === item.id} onClick={() => reviewSubmission(item, 'approved')}>
                      <FaCheck aria-hidden="true" /> Approve
                    </button>
                  )}
                  {item.status !== 'rejected' && (
                    <button type="button" className="admin-btn admin-btn-reject" disabled={busyId === item.id} onClick={() => reviewSubmission(item, 'rejected')}>
                      <FaTimes aria-hidden="true" /> Reject
                    </button>
                  )}
                  {item.status !== 'pending' && (
                    <button type="button" className="admin-btn admin-btn-secondary" disabled={busyId === item.id} onClick={() => reviewSubmission(item, 'pending')}>
                      <FaRedo aria-hidden="true" /> Reopen
                    </button>
                  )}
                  <button type="button" className="admin-btn admin-btn-delete" disabled={busyId === item.id} onClick={() => deleteSubmission(item)}>
                    <FaTrash aria-hidden="true" /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        </>}
      </section>
    </main>
  );
}
