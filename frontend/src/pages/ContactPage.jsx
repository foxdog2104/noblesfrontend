import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import contactImage from '../assets/images/contact-hero.png';
import { ROUTES } from '../constants';
import './ContactPage.css';

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-script';
const BLOCKED_CONTACT_WORDS = [
  'fuck',
  'fck',
  'shit',
  'sht',
  'bitch',
  'btch',
  'asshole',
  'ashole',
  'bastard',
  'dick',
  'porn',
  'kill',
  'killing',
  'murder',
  'suicide',
  'die',
  'death',
  'harm',
  'hate',
  'racist',
  'sexist',
  'terrorist',
  'threat',
];

const ALLOWED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.ca',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'mail.com',
  'gmx.com',
  'zoho.com',
  'telus.net',
  'shaw.ca',
  'rogers.com',
  'bell.net',
]);

const isAllowedEmailDomain = (email) => {
  const domain = email.trim().toLowerCase().split('@').pop();
  return ALLOWED_EMAIL_DOMAINS.has(domain);
};

const normalizeContactText = (text) => {
  const leetMap = {
    '0': 'o',
    '1': 'i',
    '!': 'i',
    '3': 'e',
    '4': 'a',
    '@': 'a',
    '5': 's',
    '$': 's',
    '7': 't',
  };

  return text
    .toLowerCase()
    .replace(/[0134@5$7!]/g, (character) => leetMap[character] || character)
    .replace(/[^a-z]/g, '');
};

const hasBlockedLanguage = (values) => {
  const text = `${values.name} ${values.subject} ${values.message}`.toLowerCase();
  const compactText = normalizeContactText(text);
  const collapsedText = compactText.replace(/(.)\1+/g, '$1');

  return BLOCKED_CONTACT_WORDS.some((word) => (
    text.includes(word)
    || compactText.includes(word)
    || collapsedText.includes(word)
  ));
};

// Renders the contact page with contact details, a message form, and a map.
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [contentError, setContentError] = useState('');
  const [emailError, setEmailError] = useState('');
  const recaptchaRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return undefined;

    const renderRecaptcha = () => {
      if (!window.grecaptcha || !recaptchaRef.current || widgetIdRef.current !== null) return;

      widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token) => {
          setRecaptchaToken(token);
          setCaptchaError('');
          setContentError('');
        },
        'expired-callback': () => setRecaptchaToken(''),
        'error-callback': () => {
          setRecaptchaToken('');
          setCaptchaError('Captcha could not load. Please try again.');
        },
      });
    };

    if (window.grecaptcha?.render) {
      renderRecaptcha();
    } else {
      window.onNoblesRecaptchaLoad = renderRecaptcha;

      if (!document.getElementById(RECAPTCHA_SCRIPT_ID)) {
        const script = document.createElement('script');
        script.id = RECAPTCHA_SCRIPT_ID;
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onNoblesRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      if (window.onNoblesRecaptchaLoad === renderRecaptcha) {
        window.onNoblesRecaptchaLoad = undefined;
      }
    };
  }, []);

  const resetRecaptcha = () => {
    if (window.grecaptcha && widgetIdRef.current !== null) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
    setRecaptchaToken('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'name' ? value.replace(/[0-9]/g, '') : value;
    if (name === 'email') setEmailError('');
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCaptchaError('');
    setContentError('');
    setEmailError('');

    if (hasBlockedLanguage(formData)) {
      setContentError('Please remove inappropriate language before sending your message.');
      setSubmitStatus('error');
      resetRecaptcha();
      return;
    }

    if (!isAllowedEmailDomain(formData.email)) {
      setEmailError('Use a valid email.');
      setSubmitStatus('error');
      return;
    }

    if (!RECAPTCHA_SITE_KEY) {
      setCaptchaError('Google reCAPTCHA site key is missing.');
      setSubmitStatus('error');
      return;
    }

    if (!recaptchaToken) {
      setCaptchaError('Please complete the Google reCAPTCHA.');
      setSubmitStatus('error');
      return;
    }

    try {
      await addDoc(collection(db, 'contactSubmissions'), {
        ...formData,
        recaptchaToken,
        submittedAt: new Date(),
      });
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      resetRecaptcha();
    } catch (error) {
      setSubmitStatus('error');
      resetRecaptcha();
    }
  };

  const closeSubmitScreen = () => setSubmitStatus(null);

  return (
    <MainLayout>
      <div className="contact-page">
        <section className="contact-hero">
          <img src={contactImage} alt="" className="contact-image" />
          <div className="contact-image-overlay" />
          <div className="contact-hero-copy">
            <p className="contact-eyebrow">The Nobles Management</p>
            <h1 className="contact-title">Contact</h1>
          </div>
        </section>

        <section className="contact-content">
          <div className="contact-info">
            <span className="contact-section-label">Contact Us</span>
            <p className="contact-intro">
              Reach out to the right team member for bookings, international inquiries, communication, or general questions.
            </p>

            <div className="contact-detail-list">
              <div className="contact-detail">
                <span className="contact-detail-label">Bookings & International Inquiries</span>
                <span className="contact-detail-name">Antonija</span>
                <a href="mailto:models@thenoblesmgmt.com" className="contact-detail-link">
                  models@thenoblesmgmt.com
                </a>
              </div>

              <div className="contact-detail">
                <span className="contact-detail-label">Communication & General Inquiries</span>
                <span className="contact-detail-name">Ren�</span>
                <a href="mailto:communication@thenoblesmgmt.com" className="contact-detail-link">
                  communication@thenoblesmgmt.com
                </a>
              </div>

              <div className="contact-detail">
                <span className="contact-detail-label">The Nobles Management</span>
                <span className="contact-detail-text">Unit 213, 214 11th Avenue SE</span>
                <span className="contact-detail-text">Calgary, AB T2G 0X8</span>
                <span className="contact-detail-note">Located next to the Imperial Lofts.</span>
              </div>
            </div>

            <div className="contact-scouted-callout">
              <span className="contact-detail-label">Ready to Get Scouted?</span>
              <Link to={ROUTES.GET_SCOUTED} className="contact-scouted-link">Start Your Application</Link>
            </div>
          </div>

          <div className="contact-action-column">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form-field">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  maxLength={70}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contact-form-field">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  maxLength={70}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {emailError && <small className="contact-captcha-error">{emailError}</small>}
              </div>

              <div className="contact-form-field">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  maxLength={70}
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>

              <div className="contact-form-field">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  maxLength={1000}
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  required
                />
              </div>

              {contentError && <p className="contact-content-error">{contentError}</p>}

              <div className="contact-form-field contact-recaptcha-field">
                <label>Verification</label>
                {RECAPTCHA_SITE_KEY ? (
                  <div ref={recaptchaRef} className="contact-recaptcha" />
                ) : (
                  <p className="contact-recaptcha-missing">
                    Add REACT_APP_RECAPTCHA_SITE_KEY to your .env file to enable Google reCAPTCHA.
                  </p>
                )}
                {captchaError && <small className="contact-captcha-error">{captchaError}</small>}
              </div>

              <button type="submit" className="contact-submit">Send Message</button>
            </form>

            {submitStatus && (
              <div className="contact-result-screen" role="status" aria-live="polite">
                <div className="contact-result-panel">
                  <p className="contact-result-label">
                    {submitStatus === 'success' ? 'Message Sent' : 'Message Failed'}
                  </p>
                  <h2>
                    {submitStatus === 'success'
                      ? 'Your message was sent successfully.'
                      : 'Your message could not be sent.'}
                  </h2>
                  <p>
                    {submitStatus === 'success'
                      ? 'Thank you for reaching out. The Nobles team will review your message.'
                      : 'Please review the form and try sending the message again.'}
                  </p>
                  <button type="button" className="contact-result-button" onClick={closeSubmitScreen}>
                    Close
                  </button>
                </div>
              </div>
            )}

            <div className="contact-map">
              <iframe
                title="Google Map to The Nobles Management"
                src="https://www.google.com/maps?q=Unit%20213%2C%20214%2011th%20Avenue%20SE%2C%20Calgary%2C%20AB%20T2G%200X8&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default ContactPage;






