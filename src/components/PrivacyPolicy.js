import React from 'react';
import { SITE_CONTACT } from '../config/siteContact';

function PrivacyPolicy() {
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      maxWidth: '800px',
      margin: 'auto',
      backgroundColor: '#f9f9f9',
      color: '#333',
      lineHeight: '1.8',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    header: {
      color: '#0078d7',
      fontSize: '2.5rem',
      marginBottom: '20px',
      borderBottom: '3px solid #0078d7',
      paddingBottom: '10px',
    },
    sectionHeader: {
      color: '#0078d7',
      fontSize: '1.8rem',
      marginBottom: '15px',
      borderLeft: '4px solid #0078d7',
      paddingLeft: '10px',
    },
    paragraph: {
      marginBottom: '15px',
      fontSize: '1rem',
      textAlign: 'justify',
    },
    list: {
      marginBottom: '20px',
      paddingLeft: '20px',
    },
    listItem: {
      marginBottom: '10px',
    },
    link: {
      color: '#0078d7',
      textDecoration: 'none',
    },
    linkHover: {
      textDecoration: 'underline',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Privacy Policy</h1>
      <p style={styles.paragraph}>
        ExamMeta provides academic resources and student tools. Information handled by the site
        depends on the features you use, including account sign-in, support messages, and site
        analytics. Review the privacy information from the authentication, hosting, and analytics
        providers used by those features as well.
      </p>

      <h2 style={styles.sectionHeader}>Information We Collect</h2>
      <p style={styles.paragraph}>
        We may collect the following types of information when you use our website:
      </p>
      <ul style={styles.list}>
        <li style={styles.listItem}>
          <strong>Account and support information:</strong> Sign-in is provided through Firebase Authentication. If you submit the support form, the name, email address, and message you enter are stored by the site's configured Firebase service.
        </li>
        <li style={styles.listItem}>
          <strong>Usage information:</strong> The site records page view counts in its configured Firebase database. Hosting, authentication, and analytics providers may process technical information as described in their own policies.
        </li>
      </ul>

      <h2 style={styles.sectionHeader}>How We Use Your Information</h2>
      <p style={styles.paragraph}>
        The information we collect is used for the following purposes:
      </p>
      <ul style={styles.list}>
        <li style={styles.listItem}>To improve and personalize your user experience on our website.</li>
        <li style={styles.listItem}>To send you important updates, notifications, and promotional content (if you have opted in to receive them).</li>
        <li style={styles.listItem}>To respond to your inquiries and provide customer support.</li>
      </ul>

      <h2 style={styles.sectionHeader}>How We Protect Your Information</h2>
      <p style={styles.paragraph}>
        Account and database security depend on the Firebase project configuration and its deployed
        security rules. Do not submit sensitive information through the support form.
      </p>

      <h2 style={styles.sectionHeader}>Sharing Your Information</h2>
      <p style={styles.paragraph}>
        Site features rely on third-party services, including Firebase. Those providers process data
        under their own terms and privacy policies. No claim is made here about data practices beyond
        the information described above.
      </p>

      <h2 style={styles.sectionHeader}>Cookies</h2>
      <p style={styles.paragraph}>
        Authentication and other integrated services may use browser storage or similar technologies.
        Their use is subject to the settings and policies of those services.
      </p>

      <h2 style={styles.sectionHeader}>Your Rights</h2>
      <p style={styles.paragraph}>
        For questions about a support request you submitted, use the site's contact form and include
        enough detail to identify the request, or email <a href={`mailto:${SITE_CONTACT.email}`} style={styles.link}>{SITE_CONTACT.email}</a>.
      </p>

      <h2 style={styles.sectionHeader}>Changes to This Policy</h2>
      <p style={styles.paragraph}>
        We reserve the right to update or modify this privacy policy at any time. We will notify you of any
        significant changes by posting the updated policy on our website.
      </p>

      <h2 style={styles.sectionHeader}>Contact Us</h2>
      <p style={styles.paragraph}>
        If you have any questions or concerns about our privacy policy, please contact us at{' '}
        <a href={`mailto:${SITE_CONTACT.email}`} style={styles.link}>{SITE_CONTACT.email}</a> or the{' '}
        <a href="/contact" style={styles.link}>ExamMeta contact form</a>.
      </p>
    </div>
  );
}

export default PrivacyPolicy;
