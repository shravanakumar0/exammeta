import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendar, FaMapMarkerAlt, FaUsers, FaTrophy, FaLink, 
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
    email: '',
    phone: '',
    collegeName: '',
    teamName: '',
    teamMembers: '1',
    domain: '',
    description: '',
    registrationLink: '',
    eventDate: '',
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
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
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

    try {
      const { error } = await registerForHackathon({
        hackathon_name: formData.hackathonName,
        organizer_name: formData.organizerName,
        email: formData.email,
        phone: formData.phone,
        college_name: formData.collegeName,
        team_name: formData.teamName,
        team_members: parseInt(formData.teamMembers),
        domain: formData.domain,
        description: formData.description,
        registration_link: formData.registrationLink,
        event_date: formData.eventDate,
        prizes: formData.prizes,
        terms_accepted: formData.terms,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      let message = err.message;
      if (err.message === 'Failed to fetch') {
        message = 'Cannot connect to Supabase. Check your .env file and CORS settings (add http://localhost:3000 to Supabase CORS origins).';
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
          <h2>Registration Successful!</h2>
          <p>You've successfully registered for the hackathon. We'll send a confirmation email to {formData.email}.</p>
          <div className="success-details">
            <div className="detail-item">
              <span className="detail-label">Hackathon:</span>
              <span className="detail-value">{formData.hackathonName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Team:</span>
              <span className="detail-value">{formData.teamName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Event Date:</span>
              <span className="detail-value">{formData.eventDate || 'TBD'}</span>
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
          <p>Submit your hackathon details and join the ExamMeta community of innovators.</p>
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
              <div className="reg-error">
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
                  <label className="form-label">Hackathon Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="hackathonName"
                    placeholder="e.g., TechFest 2026"
                    value={formData.hackathonName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Organizer Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="organizerName"
                    placeholder="e.g., CSE Department"
                    value={formData.organizerName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span className="required">*</span></label>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g., hackfest@college.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g., +91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">College / Institution</label>
                  <input
                    type="text"
                    name="collegeName"
                    placeholder="e.g., VTU College of Engineering"
                    value={formData.collegeName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Domain <span className="required">*</span></label>
                  <select
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
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    placeholder="Tell us about your hackathon..."
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Registration Link</label>
                  <input
                    type="url"
                    name="registrationLink"
                    placeholder="https://devpost.com/..."
                    value={formData.registrationLink}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Prizes</label>
                  <input
                    type="text"
                    name="prizes"
                    placeholder="e.g., ₹50,000 + Goodies"
                    value={formData.prizes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">
                <FaUsers size={18} className="section-icon" />
                Team Details
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Team Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="teamName"
                    placeholder="e.g., Code Warriors"
                    value={formData.teamName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Team Members</label>
                  <select
                    name="teamMembers"
                    value={formData.teamMembers}
                    onChange={handleChange}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n.toString()}>
                        {n} Member{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section terms-section">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  required
                />
                <label className="form-label terms-label">
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
                  Register for Hackathon <FaArrowRight size={18} />
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
