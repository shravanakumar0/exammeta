import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { FaComments, FaSearch } from 'react-icons/fa';
import { database } from '../firebase';

const formatTime = (timestamp) => timestamp
  ? new Date(timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  : 'Unknown time';

export default function DiscussionManager() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const messagesRef = ref(database, 'comments');
    return onValue(messagesRef, (snapshot) => {
      const value = snapshot.val() || {};
      setMessages(Object.entries(value)
        .map(([id, message]) => ({ id, ...message }))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.timestamp || 0) - (a.timestamp || 0)));
      setLoading(false);
    }, (readError) => {
      setError(readError.message || 'Could not load discussion messages.');
      setLoading(false);
    });
  }, []);

  const visibleMessages = useMemo(() => {
    const term = search.trim().toLowerCase();
    return !term ? messages : messages.filter((message) =>
      `${message.author || ''} ${message.email || ''} ${message.text || ''}`.toLowerCase().includes(term));
  }, [messages, search]);

  return (
    <section className="admin-resource-manager">
      <div className="admin-resource-intro"><div><p>STUDENT COMMUNITY</p><h1>Discussion messages</h1><span>Read student questions and feedback posted through the discussion form.</span></div><FaComments className="admin-discussion-icon" /></div>
      {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      <div className="admin-toolbar"><label className="admin-search"><FaSearch aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by student, email, or message" aria-label="Search discussion messages" /></label></div>
      {loading ? <p className="admin-status">Loading student messages…</p> : visibleMessages.length === 0 ? <p className="admin-status">No discussion messages found.</p> : <div className="admin-resource-list">
        {visibleMessages.map((message) => <article className="admin-resource-card admin-message-card" key={message.id}>
          <div><span className={message.pinned ? 'admin-status-badge admin-resource-published' : 'admin-status-badge admin-resource-draft'}>{message.pinned ? 'pinned' : 'student message'}</span><h2>{message.author || 'Anonymous student'}</h2><p className="admin-message-email">{message.email || 'No email supplied'} · {formatTime(message.timestamp)}</p><p className="admin-message-text">{message.text || 'No message text'}</p></div>
          <small>{Object.keys(message.replies || {}).length} replies</small>
        </article>)}
      </div>}
    </section>
  );
}
