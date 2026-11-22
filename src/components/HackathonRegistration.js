import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendar, FaMapMarkerAlt, FaTrophy, FaLink,
  FaFileImage, FaGraduationCap, FaArrowRight, FaLock
} from 'react-icons/fa';
import { registerForHackathon } from '../supabaseClient';
import './HackathonRegistration.css';

const HackathonRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    hackathonName: '',
    organizerName: '',
    contactEmail: '',
    registrationStartDate: '',
    registrationDeadline: '',
    eventDate: '',
    location: '',
    mode: 'Online',
    domain: '',
    description: '',
    registrationLink: '',
    posterUrl: '',
    prizes: '',
    terms: false,
  });

  const isEnvConfigured = Boolean(
    process.env.REACT_APP_SUPABASE_URL &&
    process.env.REACT_APP_SUPABASE_ANON_KEY
  );

  const domains = [
    'AI / Machine Learning',
    'Web Development',
    'Mobile App Development',
    'Blockchain',
    'Cybersecurity',
    'IoT / Embedded Systems',
    'Data Science / Analytics',
    'AR / VR',
    'Cloud Computing',
    'Other',
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isEnvConfigured) {
      setError('Supabase environment variables are missing. Check your .env file.');
      setLoading(false);
      return;
    }

    if (
      formData.hackathonName.trim().length < 3 ||
      formData.organizerName.trim().length < 2 ||
      !formData.contactEmail.trim() ||
      !formData.location.trim() ||
      !formData.domain ||
      formData.description.trim().length < 20 ||
      !formData.registrationLink.trim()
    ) {
      setError('Complete the required event details before submitting.');
      setLoading(false);
      return;
    }

    if (
      formData.registrationStartDate &&
      formData.registrationStartDate > formData.registrationDeadline
    ) {
      setError('The registration start date must be on or before the registration deadline.');
      setLoading(false);
      return;
    }

    if (formData.eventDate < formData.registrationDeadline) {
      setError('The event date must be on or after the registration deadline.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await registerForHackathon({
        name: formData.hackathonName.trim(),
        organizer: formData.organizerName.trim(),
        contact_email: formData.contactEmail.trim(),
        registration_start_date: formData.registrationStartDate || null,
        registration_deadline: formData.registrationDeadline,
        event_date: formData.eventDate,
        location: formData.location.trim(),
        mode: formData.mode,
        tech_tags: [formData.domain],
        description: formData.description.trim(),
        registration_url: formData.registrationLink.trim(),
        poster_url: formData.posterUrl.trim() || null,
        prizes: formData.prizes.trim() || null,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      let message = err?.message || 'The hackathon could not be submitted. Please try again.';
      if (err?.message === 'Failed to fetch') {
        message = 'Could not reach Supabase. Check your internet connection and Supabase project settings, then try again.';
      } else if (err?.code === 'PGRST205' || err?.code === '42P01') {
        message = 'The hackathon submission table is missing. Apply the Supabase migrations, then try again.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="reg-success-page">
        <div className="success-card">
          <div className="success-icon">
            <FaGraduationCap size={64} className="success-icon-svg" />
          </div>
          <h2>Hackathon Submitted</h2>
          <p>Your event details were submitted for review. Approved events can then appear in the ExamMeta hackathon finder.</p>
          <div className="success-details">
            <div className="detail-item">
              <span className="detail-label">Hackathon:</span>
              <span className="detail-value">{formData.hackathonName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Organizer:</span>
              <span className="detail-value">{formData.organizerName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Registration deadline:</span>
              <span className="detail-value">{formData.registrationDeadline}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Event date:</span>
              <span className="detail-value">{formData.eventDate}</span>
            </div>
          </div>
          <Link to="/" className="btn-back-home">
            <FaArrowRight size={18} /> Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="hackathon-reg-page">
      <div className="reg-header">
        <div className="reg-header-content">
          <div className="reg-badge">
            <FaTrophy size={20} />
            <span>Hackathon Registration</span>
          </div>
          <h1>Register Your Hackathon</h1>
          <p>Submit your event for review and inclusion in the ExamMeta hackathon finder.</p>
        </div>
        <div className="reg-header-decoration">
          <div className="decoration-shape dec-1"></div>
          <div className="decoration-shape dec-2"></div>
        </div>
      </div>

      <div className="reg-container">
        <div className="reg-card">
          <form className="reg-form" onSubmit={handleSubmit}>
            {error && (
              <div className="reg-error" role="alert" aria-live="assertive">
                <FaLock size={16} /> {error}
              </div>
            )}
            <div className="form-section">
              <h3 className="section-title">
                <FaCalendar size={18} className="section-icon" />
                Event Details
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="hackathonName">Hackathon Name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="hackathonName"
                    name="hackathonName"
                    placeholder="e.g., Campus Innovation Hackathon"
                    minLength={3}
                    maxLength={160}
                    value={formData.hackathonName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="organizerName">Organizer Name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="organizerName"
                    name="organizerName"
                    placeholder="e.g., CSE Department"
                    minLength={2}
                    maxLength={160}
                    value={formData.organizerName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contactEmail">Contact Email <span className="required">*</span></label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    placeholder="e.g., hackfest@college.edu"
                    autoComplete="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="location"><FaMapMarkerAlt /> Location <span className="required">*</span></label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    placeholder="e.g., Bengaluru, Karnataka or Online"
                    maxLength={200}
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="mode">Event Mode <span className="required">*</span></label>
                  <select
                    id="mode"
                    name="mode"
                    value={formData.mode}
                    onChange={handleChange}
                    required
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="registrationStartDate">Registration Opens</label>
                  <input
                    type="date"
                    id="registrationStartDate"
                    name="registrationStartDate"
                    max={formData.registrationDeadline || undefined}
                    value={formData.registrationStartDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="registrationDeadline">Registration Deadline <span className="required">*</span></label>
                  <input
                    type="date"
                    id="registrationDeadline"
                    name="registrationDeadline"
                    min={formData.registrationStartDate || undefined}
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="eventDate">Event Date <span className="required">*</span></label>
                  <input
                    type="date"
                    id="eventDate"
                    name="eventDate"
                    min={formData.registrationDeadline || undefined}
                    value={formData.eventDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="domain">Primary Domain <span className="required">*</span></label>
                  <select
                    id="domain"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a domain</option>
                    {domains.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="description">Description <span className="required">*</span></label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Tell us about your hackathon..."
                    rows={3}
                    minLength={20}
                    maxLength={5000}
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="registrationLink"><FaLink /> Registration URL (HTTPS) <span className="required">*</span></label>
                  <input
                    type="url"
                    id="registrationLink"
                    name="registrationLink"
                    placeholder="https://devpost.com/..."
                    pattern="https://.+"
                    title="Enter a secure URL beginning with https://"
                    value={formData.registrationLink}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="posterUrl"><FaFileImage /> Poster URL (optional)</label>
                  <input
                    type="url"
                    id="posterUrl"
                    name="posterUrl"
                    placeholder="https://example.com/poster.png"
                    pattern="https://.+"
                    title="Enter a secure URL beginning with https://"
                    value={formData.posterUrl}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="prizes">Prizes (optional)</label>
                  <input
                    type="text"
                    id="prizes"
                    name="prizes"
                    placeholder="e.g., ₹50,000 + Goodies"
                    maxLength={1000}
                    value={formData.prizes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section terms-section">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  required
                />
                <label className="form-label terms-label" htmlFor="terms">
                  I agree to the <a href="/terms-and-conditions" className="terms-link">Terms and Conditions</a> and confirm that all information provided is accurate.
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="reg-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span>Registering...</span>
              ) : (
                <>
                  Submit Hackathon <FaArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HackathonRegistration;
