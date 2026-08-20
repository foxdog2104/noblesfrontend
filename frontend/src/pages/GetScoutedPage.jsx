import React, { useEffect, useRef, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import getScoutedImage from '../assets/images/imgi_1_Beige+Gray+Pastel+Trendy+Aesthetic+Minimalist+Moodboard+Photo+Collage.jpg';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { uploadToAzureBlob } from '../services/azureStorageService';
import { COUNTRIES } from '../constants/countries';
import './GetScoutedPage.css';

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-script';

// Max characters per field — stops oversized strings from reaching the database
const CHAR_LIMITS = {
  firstName: 50, lastName: 50, email: 100, phone: 20,
  instagramHandle: 30,
  height: 10, bustChest: 10, waist: 10, hips: 10,
  hairColor: 30, eyeColor: 30, shoeSize: 6,
};

// 10 MB cap — prevents huge uploads from abusing our Azure storage quota
const MAX_PHOTO_MB = 10;

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

// ─── Profanity + spam filter ──────────────────────────────────────────────────
// Checked against name fields before anything is saved
const BAD_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'cock', 'pussy',
  'nigger', 'nigga', 'faggot', 'cunt', 'whore', 'slut', 'kill', 
  'hate', 'ass', 'killing' , 'killed' , 'suicide', 'kys'
];
const hasBadWords = (text) =>
  BAD_WORDS.some((w) => text.toLowerCase().includes(w));

// Flags repeated characters, URLs, and all-caps — common bot/spam patterns
const isSpam = (text) =>
  /(.)\1{5,}/.test(text) ||
  /https?:\/\//i.test(text) ||
  (text.length > 10 && text === text.toUpperCase());

// ─── Validation ──────────────────────────────────────────────────────────────
const validate = (formData, uploads) => {
  const e = {};

  if (!formData.firstName.trim()) e.firstName = 'Required';
  else if (hasBadWords(formData.firstName) || isSpam(formData.firstName)) e.firstName = 'Invalid content';

  if (!formData.lastName.trim()) e.lastName = 'Required';
  else if (hasBadWords(formData.lastName) || isSpam(formData.lastName)) e.lastName = 'Invalid content';

  if (!formData.email.trim()) e.email = 'Required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
  else if (!isAllowedEmailDomain(formData.email)) e.email = 'Use a valid email.';

  if (!formData.phone.trim()) e.phone = 'Required';
  // Only digits, spaces, and common punctuation — rejects freeform text
  else if (!/^[\d\s+\-().]{7,20}$/.test(formData.phone)) e.phone = 'Invalid phone number';

  if (!formData.countryOfResidence.trim()) e.countryOfResidence = 'Required';
  if (!formData.gender) e.gender = 'Required';

  if (!formData.dateOfBirth) {
    e.dateOfBirth = 'Required';
  } else {
    // Reject future dates — an obvious fake entry
    const dob = new Date(formData.dateOfBirth);
    if (dob > new Date()) e.dateOfBirth = 'Date cannot be in the future';
  }

  if (!formData.isCurrentlyModel) e.isCurrentlyModel = 'Required';

  const measurementFields = ['height', 'bustChest', 'waist', 'hips', 'shoeSize'];
  for (const field of measurementFields) {
    if (!formData[field].trim()) e[field] = 'Required';
  }

  if (!formData.hairColor.trim()) e.hairColor = 'Required';
  if (!formData.eyeColor.trim()) e.eyeColor = 'Required';

  if (!uploads.photo) e.photo = 'A photo is required';

  return e;
};

// ─── Component ───────────────────────────────────────────────────────────────
const GetScoutedPage = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    countryOfResidence: '', gender: '', dateOfBirth: '',
    instagramHandle: '', isCurrentlyModel: '',
    height: '', bustChest: '', waist: '', hips: '',
    hairColor: '', eyeColor: '', shoeSize: '', parentalConsent: '',
  });
  const [uploads, setUploads] = useState({ photo: null });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const recaptchaRef = useRef(null);
  const widgetIdRef = useRef(null);

  // reCAPTCHA — stops bots from mass-submitting the form
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return undefined;

    const renderRecaptcha = () => {
      if (!window.grecaptcha || !recaptchaRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token) => { setRecaptchaToken(token); setCaptchaError(''); },
        'expired-callback': () => setRecaptchaToken(''),
        'error-callback': () => { setRecaptchaToken(''); setCaptchaError('Captcha could not load. Please try again.'); },
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
      if (window.onNoblesRecaptchaLoad === renderRecaptcha) window.onNoblesRecaptchaLoad = undefined;
    };
  }, []);

  // Reset after every attempt so a solved captcha can't be reused
  const resetRecaptcha = () => {
    if (window.grecaptcha && widgetIdRef.current !== null) window.grecaptcha.reset(widgetIdRef.current);
    setRecaptchaToken('');
  };

  // Measurement helper state
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('0');
  const [measUnit, setMeasUnit] = useState('in');
  const [bustVal, setBustVal] = useState('');
  const [waistVal, setWaistVal] = useState('');
  const [hipsVal, setHipsVal] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Silently block typing past the character limit
    const limit = CHAR_LIMITS[name];
    if (limit && value.length > limit) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files?.[0] ?? null;
    if (file) {
      // Reject oversized files before any upload attempt
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, [name]: `File must be under ${MAX_PHOTO_MB} MB` }));
        e.target.value = '';
        return;
      }
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setUploads((prev) => ({ ...prev, [name]: file }));
  };

  const toCm = (val, unit) => {
    if (!val) return '';
    const n = parseFloat(val);
    return isNaN(n) ? '' : (unit === 'in' ? (n * 2.54).toFixed(1) : String(n));
  };

  const handleHeightFt = (e) => {
    const ft = e.target.value;
    setHeightFt(ft);
    const cm = ft
      ? ((parseFloat(ft) * 30.48) + (parseFloat(heightIn) * 2.54)).toFixed(1)
      : '';
    setFormData((prev) => ({ ...prev, height: cm }));
    if (errors.height) setErrors((prev) => ({ ...prev, height: undefined }));
  };

  const handleHeightIn = (e) => {
    const inch = e.target.value;
    setHeightIn(inch);
    const cm = heightFt
      ? ((parseFloat(heightFt) * 30.48) + (parseFloat(inch) * 2.54)).toFixed(1)
      : '';
    setFormData((prev) => ({ ...prev, height: cm }));
  };

  const handleMeasNumber = (setter, key) => (e) => {
    const val = e.target.value;
    setter(val);
    setFormData((prev) => ({ ...prev, [key]: toCm(val, measUnit) }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleMeasUnit = (unit) => {
    setMeasUnit(unit);
    setFormData((prev) => ({
      ...prev,
      bustChest: toCm(bustVal, unit),
      waist: toCm(waistVal, unit),
      hips: toCm(hipsVal, unit),
    }));
  };

  const uploadFile = async (file, folder) => uploadToAzureBlob(file, folder);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before doing anything — nothing uploads or saves until this passes
    const fieldErrors = validate(formData, uploads);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const first = document.querySelector('.field-error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Block submission if the captcha hasn't been solved
    if (!recaptchaToken) {
      setCaptchaError('Please complete the reCAPTCHA.');
      return;
    }

    setSubmitting(true);
    setSubmitMessage('');
    setSubmitError('');

    try {
      const photoUrl = await uploadFile(uploads.photo, 'photos');

      await addDoc(collection(db, 'scoutSubmissions'), {
        ...formData,
        photoUrl,
        submittedAt: new Date(),
      });

      setSubmitMessage("Application submitted! We'll be in touch.");
      setFormData({
        firstName: '', lastName: '', email: '', phone: '',
        countryOfResidence: '', gender: '', dateOfBirth: '',
        instagramHandle: '', isCurrentlyModel: '',
        height: '', bustChest: '', waist: '', hips: '',
        hairColor: '', eyeColor: '', shoeSize: '', parentalConsent: '',
      });
      setUploads({ photo: null });
      setErrors({});
      resetRecaptcha();
      setHeightFt(''); setHeightIn('0');
      setBustVal(''); setWaistVal(''); setHipsVal('');
    } catch (err) {
      console.error('Scout submit error:', err);
      // Generic message — don't expose internal Azure/Firestore error details
      setSubmitError('Something went wrong. Please try again.');
      resetRecaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const getAge = (dob) => {
    const today = new Date();
    const birth = new Date(dob);
    return today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
  };
  // Under-18 applicants must confirm parental consent — legal requirement for collecting minors' data
  const isUnder18 = formData.dateOfBirth && getAge(formData.dateOfBirth) < 18;
  const submitStatus = submitMessage ? 'success' : submitError ? 'error' : null;

  const closeSubmitScreen = () => {
    setSubmitMessage('');
    setSubmitError('');
  };

  const field = (name, label, type = 'text', extra = {}) => (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        maxLength={CHAR_LIMITS[name]}
        {...extra}
      />
      {errors[name] && <span className="field-error">{errors[name]}</span>}
    </div>
  );

  return (
    <MainLayout>
      <div className="scouted-page">

        {/* Left image */}
        <div className="scouted-left">
          <img src={getScoutedImage} alt="" className="scouted-image" />
        </div>

        {/* Right form */}
        <div className="scouted-right">
          <h1 className="scouted-title">Get Scouted</h1>
          <p className="scouted-subtitle">
            Join our roster and showcase your individuality to top industry professionals.
          </p>

          <section className="scouted-safety-notice" aria-label="Application safety notice">
            <h2>Application Safety</h2>
            <p>
              The Role Models will never ask for nude photos, lingerie photos, or payment to apply.
              If someone contacts you claiming to represent us and something feels wrong, verify with us directly before responding.
            </p>
          </section>

          {submitError && <p className="scouted-message scouted-error">{submitError}</p>}
          {submitMessage && <p className="scouted-message scouted-success">{submitMessage}</p>}

          {/* noValidate — we handle all validation ourselves so rules are applied consistently */}
          <form className="scouted-form" onSubmit={handleSubmit} noValidate>

            {/* ── Personal Information ── */}
            <div className="form-section-label">
              <span>Personal Information</span>
              <div className="form-section-line" />
            </div>

            <div className="form-row">
              {field('firstName', 'First Name*', 'text', { required: true })}
              {field('lastName', 'Last Name*', 'text', { required: true })}
            </div>

            <div className="form-row">
              {field('email', 'Email*', 'email', { required: true })}
              {field('phone', 'Phone*', 'tel', { required: true })}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="countryOfResidence">Country of Residence*</label>
                {/* Dropdown — only valid country names can be submitted, no freeform text */}
                <select
                  id="countryOfResidence"
                  name="countryOfResidence"
                  value={formData.countryOfResidence}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="" disabled>Please select</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.countryOfResidence && <span className="field-error">{errors.countryOfResidence}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="gender">Gender*</label>
                {/* Dropdown — restricts to defined options, no freeform text */}
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required className="form-select">
                  <option value="" disabled>Please select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not">Prefer not to say</option>
                </select>
                {errors.gender && <span className="field-error">{errors.gender}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="dateOfBirth">Date of Birth*</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  max={new Date().toISOString().split('T')[0]} // Prevents picking a future date in the date picker
                />
                {isUnder18 && <small className="field-hint">Parental/guardian consent required if under 18.</small>}
                {errors.dateOfBirth && <span className="field-error">{errors.dateOfBirth}</span>}
              </div>
              {field('instagramHandle', 'Instagram Handle', 'text', { placeholder: '@handle' })}
            </div>

            <div className="form-field">
              <label>Are you currently a model?*</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="isCurrentlyModel" value="yes" checked={formData.isCurrentlyModel === 'yes'} onChange={handleChange} required />
                  Yes
                </label>
                <label className="radio-label">
                  <input type="radio" name="isCurrentlyModel" value="no" checked={formData.isCurrentlyModel === 'no'} onChange={handleChange} />
                  No
                </label>
              </div>
              {errors.isCurrentlyModel && <span className="field-error">{errors.isCurrentlyModel}</span>}
            </div>

            {/* ── Measurements ── */}
            <div className="form-section-label">
              <span>Measurements</span>
              <div className="form-section-line" />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Height*</label>
                {/* Dropdowns with fixed ranges — prevents unrealistic values and text injection */}
                <div className="height-selects">
                  <select value={heightFt} onChange={handleHeightFt} className="form-select height-select" required>
                    <option value="" disabled>ft</option>
                    {[4,5,6,7].map((f) => <option key={f} value={f}>{f} ft</option>)}
                  </select>
                  <select value={heightIn} onChange={handleHeightIn} className="form-select height-select">
                    {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => <option key={i} value={i}>{i} in</option>)}
                  </select>
                </div>
                {errors.height && <span className="field-error">{errors.height}</span>}
              </div>

              <div className="form-field">
                <label>Shoe Size* (EU)</label>
                {/* Dropdown of EU sizes 33–50 — restricts to realistic values only */}
                <select name="shoeSize" value={formData.shoeSize} onChange={handleChange} required className="form-select">
                  <option value="" disabled>Select size</option>
                  {Array.from({ length: 18 }, (_, i) => 33 + i).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.shoeSize && <span className="field-error">{errors.shoeSize}</span>}
              </div>
            </div>

            {/* Unit toggle for bust/waist/hips */}
            <div className="form-field meas-unit-row">
              <label>Measurement unit</label>
              <div className="meas-unit-toggle">
                <button type="button" className={measUnit === 'in' ? 'active' : ''} onClick={() => handleMeasUnit('in')}>in</button>
                <button type="button" className={measUnit === 'cm' ? 'active' : ''} onClick={() => handleMeasUnit('cm')}>cm</button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Bust / Chest* <span className="field-hint-inline">({measUnit})</span></label>
                {/* type="number" with min/max — numeric only, bounds enforced, converted to cm before saving */}
                <input
                  type="number" min="1" max="200"
                  value={bustVal}
                  onChange={handleMeasNumber(setBustVal, 'bustChest')}
                  className="meas-number-input"
                  placeholder={measUnit === 'in' ? 'e.g. 32' : 'e.g. 82'}
                />
                {errors.bustChest && <span className="field-error">{errors.bustChest}</span>}
              </div>
              <div className="form-field">
                <label>Waist* <span className="field-hint-inline">({measUnit})</span></label>
                <input
                  type="number" min="1" max="200"
                  value={waistVal}
                  onChange={handleMeasNumber(setWaistVal, 'waist')}
                  className="meas-number-input"
                  placeholder={measUnit === 'in' ? 'e.g. 24' : 'e.g. 62'}
                />
                {errors.waist && <span className="field-error">{errors.waist}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Hips* <span className="field-hint-inline">({measUnit})</span></label>
                <input
                  type="number" min="1" max="200"
                  value={hipsVal}
                  onChange={handleMeasNumber(setHipsVal, 'hips')}
                  className="meas-number-input"
                  placeholder={measUnit === 'in' ? 'e.g. 35' : 'e.g. 89'}
                />
                {errors.hips && <span className="field-error">{errors.hips}</span>}
              </div>
              <div />
            </div>

            {/* Hair and Eye colour */}
            <div className="form-row">
              <div className="form-field">
                <label>Hair Colour*</label>
                {/* Dropdowns — only predefined colour options accepted */}
                <select name="hairColor" value={formData.hairColor} onChange={handleChange} required className="form-select">
                  <option value="" disabled>Select colour</option>
                  {['Black','Dark Brown','Brown','Light Brown','Blonde','Dark Blonde','Red','Auburn','Gray / Silver','White','Other'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.hairColor && <span className="field-error">{errors.hairColor}</span>}
              </div>
              <div className="form-field">
                <label>Eye Colour*</label>
                <select name="eyeColor" value={formData.eyeColor} onChange={handleChange} required className="form-select">
                  <option value="" disabled>Select colour</option>
                  {['Brown','Dark Brown','Blue','Green','Hazel','Gray','Amber','Other'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.eyeColor && <span className="field-error">{errors.eyeColor}</span>}
              </div>
            </div>

            {/* ── Submissions ── */}
            <div className="form-section-label">
              <span>Submissions</span>
              <div className="form-section-line" />
            </div>

            <div className="form-field">
              <label>Photo Submission* <span className="field-hint-inline">(max {MAX_PHOTO_MB} MB)</span></label>
              <label className="upload-label-btn">
                <span>Add a File</span>
                {/* accept="image/*" restricts the file picker to images only */}
                <input type="file" name="photo" accept="image/*" onChange={handleFileChange} required />
              </label>
              <span className="upload-filename">{uploads.photo ? uploads.photo.name : 'No file chosen'}</span>
              <small className="field-hint">Upload four photos: full-length, knees-up, close-up, and profile. Natural daylight, plain background, simple clothing, no makeup.</small>
              {errors.photo && <span className="field-error">{errors.photo}</span>}
            </div>

            {/* Shown only for under-18 applicants — legal requirement before accepting a minor's application */}
            {isUnder18 && (
              <div className="form-field">
                <label>I confirm I have parental/guardian consent to apply.*</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="parentalConsent" value="yes" checked={formData.parentalConsent === 'yes'} onChange={handleChange} required />
                    Yes
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="parentalConsent" value="no" checked={formData.parentalConsent === 'no'} onChange={handleChange} />
                    No
                  </label>
                </div>
              </div>
            )}

            {/* reCAPTCHA widget — user must complete this before the form will submit */}
            <div className="form-field recaptcha-field">
              <div ref={recaptchaRef} />
              {captchaError && <span className="field-error">{captchaError}</span>}
            </div>

            {/* Disabled while submitting to prevent double-submission */}
            <button type="submit" className="scouted-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>

          </form>
        </div>
          {submitStatus && (
            <div className="scouted-result-screen" role="status" aria-live="polite">
              <div className="scouted-result-panel">
                <p className="scouted-result-label">
                  {submitStatus === 'success' ? 'Application Sent' : 'Application Failed'}
                </p>
                <h2>
                  {submitStatus === 'success'
                    ? 'Your application was submitted successfully.'
                    : 'Your application could not be submitted.'}
                </h2>
                <p>
                  {submitStatus === 'success'
                    ? 'Thank you for applying. The Nobles team will review your application.'
                    : 'Please review the form and try submitting your application again.'}
                </p>
                <button type="button" className="scouted-result-button" onClick={closeSubmitScreen}>
                  Close
                </button>
              </div>
            </div>
          )}

      </div>
    </MainLayout>
  );
};

export default GetScoutedPage;



