import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut } from 'firebase/auth';
import MainLayout from '../layouts/MainLayout';
import { checkClubNoblesMembership } from '../services/membershipService';
import { getProfile, saveProfile, uploadAvatar } from '../services/profileService';
import { auth } from '../firebase';
import { ROUTES } from '../constants';
import { COUNTRIES } from '../constants/countries';
import './SettingsPage.css';

const NAV = [
  { id: 'profile', label: 'Profile' },
  { id: 'measurements', label: 'Measurements & Comp Card' },
  { id: 'membership', label: 'Membership' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
];

const DISPLAY_NAME_MAX = 60;
const BIO_MAX = 400;
const MEASUREMENT_FIELD_MAX = 20;
const CROP_PREVIEW_SIZE = 280;
const CROP_OUTPUT_SIZE = 520;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const canvasToBlob = (canvas, type = 'image/jpeg', quality = 0.9) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not crop image.'));
    }, type, quality);
  });

const createCroppedAvatarFile = async ({ src, fileName, fileType, offset, zoom }) => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = CROP_OUTPUT_SIZE;
  canvas.height = CROP_OUTPUT_SIZE;
  const context = canvas.getContext('2d');
  const baseScale = Math.max(CROP_OUTPUT_SIZE / image.naturalWidth, CROP_OUTPUT_SIZE / image.naturalHeight);
  const scale = baseScale * zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const offsetScale = CROP_OUTPUT_SIZE / CROP_PREVIEW_SIZE;
  const drawX = (CROP_OUTPUT_SIZE - drawWidth) / 2 + offset.x * offsetScale;
  const drawY = (CROP_OUTPUT_SIZE - drawHeight) / 2 + offset.y * offsetScale;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE);
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const outputType = fileType === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, outputType, 0.86);
  const extension = outputType === 'image/png' ? 'png' : 'jpg';
  const cleanedName = fileName.replace(/\.[^.]+$/, '') || 'profile-picture';
  return new File([blob], `${cleanedName}-cropped.${extension}`, { type: outputType });
};

function SignInPrompt({ title, copy }) {
  return (
    <div className="settings-cta">
      <div>
        <p className="settings-cta-title">{title}</p>
        <p className="settings-cta-copy">{copy}</p>
      </div>
      <Link to={ROUTES.LOGIN} className="settings-button">Sign in</Link>
    </div>
  );
}

// ---- Profile (real — Firestore + Storage) ----
function ProfileSection({ firebaseUser, authLoading }) {
  const [displayName, setDisplayName] = useState('');
  const [basedIn, setBasedIn] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saved, setSaved] = useState(null); // last-saved snapshot, for Discard
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const cropDragRef = useRef(null);
  const [cropDraft, setCropDraft] = useState(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    getProfile(firebaseUser.uid)
      .then((data) => {
        if (cancelled) return;
        setDisplayName(data.displayName);
        setBasedIn(data.basedIn);
        setBio(data.bio);
        setAvatarUrl(data.avatarUrl);
        setSaved(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Use a JPG or PNG image.');
      e.target.value = '';
      return;
    }

    setError('');
    setSuccess('');
    setCropOffset({ x: 0, y: 0 });
    setCropZoom(1);
    setCropDraft({
      src: URL.createObjectURL(file),
      fileName: file.name,
      fileType: file.type,
    });
    e.target.value = '';
  };

  const closeCropDialog = () => {
    if (cropDraft?.src) URL.revokeObjectURL(cropDraft.src);
    setCropDraft(null);
    setCropOffset({ x: 0, y: 0 });
    setCropZoom(1);
  };

  const handleCropPointerDown = (e) => {
    e.preventDefault();
    cropDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offset: cropOffset,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCropPointerMove = (e) => {
    const drag = cropDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    setCropOffset({
      x: drag.offset.x + e.clientX - drag.startX,
      y: drag.offset.y + e.clientY - drag.startY,
    });
  };

  const handleCropPointerEnd = (e) => {
    const drag = cropDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    cropDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleCropConfirm = async () => {
    if (!cropDraft) return;

    setUploading(true);
    setError('');
    try {
      const croppedFile = await createCroppedAvatarFile({
        ...cropDraft,
        offset: cropOffset,
        zoom: cropZoom,
      });
      const url = await uploadAvatar(firebaseUser.uid, croppedFile);
      setAvatarUrl(url);
      setSaved((prev) => ({ ...prev, avatarUrl: url }));
      setSuccess('Profile picture saved locally.');
      closeCropDialog();
    } catch {
      setError('Could not upload that image. Try a smaller JPG or PNG.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updates = { displayName, basedIn, bio };
      await saveProfile(firebaseUser.uid, updates);
      setSaved((prev) => ({ ...prev, ...updates }));
      setSuccess('Profile saved.');
    } catch {
      setError('Could not save your profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!saved) return;
    setDisplayName(saved.displayName);
    setBasedIn(saved.basedIn);
    setBio(saved.bio);
    setError('');
    setSuccess('');
  };

  if (!authLoading && !firebaseUser) {
    return <SignInPrompt title="You're not signed in" copy="Log in to view your profile." />;
  }

  return (
    <>
      <div className="settings-avatar-row">
        <div className="settings-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Your headshot" />
          ) : (
            <span className="settings-avatar-placeholder">No photo</span>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="settings-button settings-button-outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading}
          >
            {uploading ? 'Uploading…' : 'Replace headshot'}
          </button>
          <div className="settings-hint">JPG or PNG</div>
        </div>
      </div>

      {cropDraft && (
        <div className="settings-crop-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-crop-title">
          <div className="settings-crop-dialog">
            <div className="settings-crop-header">
              <h2 id="settings-crop-title">Crop Profile Picture</h2>
              <p>Drag the image and adjust the zoom.</p>
            </div>

            <div
              className="settings-crop-frame"
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerEnd}
              onPointerCancel={handleCropPointerEnd}
            >
              <img
                src={cropDraft.src}
                alt="Profile crop preview"
                className="settings-crop-image"
                draggable="false"
                style={{
                  transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
                }}
              />
            </div>

            <label className="settings-crop-zoom">
              <span>Zoom</span>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={cropZoom}
                onChange={(e) => setCropZoom(Number(e.target.value))}
              />
            </label>

            <div className="settings-crop-actions">
              <button type="button" className="settings-button" onClick={handleCropConfirm} disabled={uploading}>
                {uploading ? 'Uploading...' : 'OK'}
              </button>
              <button
                type="button"
                className="settings-button settings-button-outline"
                onClick={closeCropDialog}
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="settings-list">
        <div className="settings-row">
          <span>Email</span>
          <strong>{firebaseUser?.email || '—'}</strong>
        </div>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-field-grid">
          <div className="settings-field">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              maxLength={DISPLAY_NAME_MAX}
            />
            <span className="settings-char-count">{displayName.length}/{DISPLAY_NAME_MAX}</span>
          </div>
          <div className="settings-field">
            <label htmlFor="basedIn">Based in</label>
            <select
              id="basedIn"
              value={basedIn}
              onChange={(e) => setBasedIn(e.target.value)}
              disabled={loading}
              className="settings-select"
            >
              <option value="" disabled>Please select</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-field">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            maxLength={BIO_MAX}
          />
          <span className="settings-char-count">{bio.length}/{BIO_MAX}</span>
        </div>

        {error && <p className="settings-error">{error}</p>}
        {success && <p className="settings-success">{success}</p>}

        <div className="settings-form-actions">
          <button type="submit" className="settings-button" disabled={loading || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            className="settings-button settings-button-outline"
            onClick={handleDiscard}
            disabled={loading || saving}
          >
            Discard
          </button>
        </div>
      </form>
    </>
  );
}

// ---- Measurements & Comp Card (real — Firestore, separate from ModelProfilePage/models for now) ----
const MEASUREMENT_FIELDS = [
  { key: 'height', label: 'Height' },
  { key: 'bust', label: 'Bust/Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'shoeSize', label: 'Shoe' },
  { key: 'hairColor', label: 'Hair' },
  { key: 'eyeColor', label: 'Eyes' },
];

function MeasurementsSection({ firebaseUser, authLoading }) {
  const [measurements, setMeasurements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getProfile(firebaseUser.uid)
      .then((data) => {
        if (!cancelled) setMeasurements(data.measurements);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your measurements.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  const handleChange = (key, value) => {
    setMeasurements((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await saveProfile(firebaseUser.uid, { measurements });
      setSuccess('Measurements saved.');
    } catch {
      setError('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!authLoading && !firebaseUser) {
    return <SignInPrompt title="You're not signed in" copy="Log in to view your comp card." />;
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>

      <div className="settings-field-grid settings-field-grid-4">
        {MEASUREMENT_FIELDS.map(({ key, label }) => (
          <div className="settings-field" key={key}>
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              value={measurements?.[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              disabled={loading}
              maxLength={MEASUREMENT_FIELD_MAX}
            />
          </div>
        ))}
      </div>

      {error && <p className="settings-error">{error}</p>}
      {success && <p className="settings-success">{success}</p>}

      <button type="submit" className="settings-button" disabled={loading || saving}>
        {saving ? 'Saving…' : 'Save measurements'}
      </button>
    </form>
  );
}

// ---- Membership (real, unchanged logic) ----
function MembershipSection({ status, loading }) {
  const user = status?.user;
  const membership = status?.membership;

  const membershipLabel = loading
    ? 'Checking…'
    : status?.error
    ? 'Unable to load'
    : status?.active
    ? 'Active'
    : 'Not Active';

  if (!loading && !user) {
    return <SignInPrompt title="You're not signed in" copy="Log in to view your account and membership." />;
  }

  return (
    <>
      <div className="settings-list">
        <div className="settings-row">
          <span>Email</span>
          <strong>{user?.email || '—'}</strong>
        </div>
        <div className="settings-row">
          <span>Club Nobles Membership</span>
          <strong>{membershipLabel}</strong>
        </div>
        {membership && (
          <>
            <div className="settings-row">
              <span>Plan</span>
              <strong>{membership.planLabel}</strong>
            </div>
            <div className="settings-row">
              <span>Price</span>
              <strong>{membership.price}</strong>
            </div>
          </>
        )}
        {status?.error && (
          <p className="settings-error">Couldn't load your membership status. Try refreshing.</p>
        )}
      </div>

      {!loading && !status?.error && !status?.active && (
        <div className="settings-cta">
          <div>
            <p className="settings-cta-title">Not a member yet</p>
            <p className="settings-cta-copy">
              Join Club Nobles for access to member pricing and early booking.
            </p>
          </div>
          <Link to={ROUTES.CLUB_NOBLES} className="settings-button">Become a member</Link>
        </div>
      )}
    </>
  );
}

// ---- Security (real password change + real soft-deactivation) ----
function SecuritySection({ firebaseUser }) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firebaseUser) {
      setError('You need to be signed in to change your password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      setSuccess('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (firebaseError) {
      if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        setError('Current password is incorrect.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else if (firebaseError.code === 'auth/requires-recent-login') {
        setError('Please sign out and back in, then try again.');
      } else {
        setError(firebaseError.message.replace('Firebase: ', ''));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!firebaseUser) return;
    const confirmed = window.confirm(
      'Deactivate your account? Your profile will be removed from active casting. This can be undone by contacting the agency within 90 days.'
    );
    if (!confirmed) return;

    setDeactivating(true);
    setDeactivateError('');
    try {
      await saveProfile(firebaseUser.uid, { deactivated: true, deactivatedAt: new Date().toISOString() });
      await signOut(auth);
      localStorage.removeItem('noblesTestUser');
      window.dispatchEvent(new Event('nobles-auth-change'));
      navigate(ROUTES.HOME);
    } catch {
      setDeactivateError('Could not deactivate your account. Try again.');
      setDeactivating(false);
    }
  };

  if (!firebaseUser) {
    return <SignInPrompt title="You're not signed in" copy="Sign in to manage security settings." />;
  }

  return (
    <div className="settings-stack">
      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-field-grid">
          <div className="settings-field">
            <label htmlFor="currentPassword">Current password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="settings-field">
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="settings-field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="settings-error">{error}</p>}
        {success && <p className="settings-success">{success}</p>}

        <button type="submit" className="settings-button" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <div className="settings-danger-zone">
        <div className="settings-cta-title">Deactivate account</div>
        <p className="settings-cta-copy">
          Removes your card from active casting. Your data is kept for 90 days.
        </p>
        {deactivateError && <p className="settings-error">{deactivateError}</p>}
        <button
          type="button"
          className="settings-button settings-button-danger"
          onClick={handleDeactivate}
          disabled={deactivating}
        >
          {deactivating ? 'Deactivating…' : 'Deactivate my account'}
        </button>
      </div>
    </div>
  );
}

// ---- Notifications (real — Firestore) ----
const NOTIFICATION_ROWS = [
  { key: 'castingCalls', title: 'Casting calls', desc: 'New bookings that match your profile' },
  { key: 'compCardViews', title: 'Comp card views', desc: 'When a client opens your card' },
  { key: 'membershipUpdates', title: 'Membership updates', desc: 'Renewals, receipts, and plan changes' },
  { key: 'clubNoblesNews', title: 'Club Nobles news', desc: 'Occasional notes from the office' },
];

function Toggle({ on, onToggle, disabled }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${on ? 'settings-toggle-on' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={on}
    />
  );
}

function NotificationsSection({ firebaseUser, authLoading }) {
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getProfile(firebaseUser.uid)
      .then((data) => {
        if (!cancelled) setNotifications(data.notifications);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your notification settings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  const handleToggle = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await saveProfile(firebaseUser.uid, { notifications: updated });
    } catch {
      setNotifications(notifications);
      setError('Could not save that change. Try again.');
    }
  };

  if (!authLoading && !firebaseUser) {
    return <SignInPrompt title="You're not signed in" copy="Log in to manage notification preferences." />;
  }

  return (
    <div>
      <div className="settings-list">
        {NOTIFICATION_ROWS.map(({ key, title, desc }) => (
          <div className="settings-row settings-row-toggle" key={key}>
            <div>
              <div className="settings-row-title">{title}</div>
              <div className="settings-row-copy">{desc}</div>
            </div>
            <Toggle
              on={!!notifications?.[key]}
              onToggle={() => handleToggle(key)}
              disabled={loading || !notifications}
            />
          </div>
        ))}
      </div>
      {error && <p className="settings-error" style={{ marginTop: 16 }}>{error}</p>}
    </div>
  );
}

const SettingsPage = () => {
  const [active, setActive] = useState('profile');
  const [status, setStatus] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  const refreshMembership = useCallback(() => {
    setMembershipLoading(true);
    checkClubNoblesMembership()
      .then(setStatus)
      .finally(() => setMembershipLoading(false));
  }, []);

  useEffect(() => {
    refreshMembership();
    window.addEventListener('nobles-auth-change', refreshMembership);
    window.addEventListener('storage', refreshMembership);
    return () => {
      window.removeEventListener('nobles-auth-change', refreshMembership);
      window.removeEventListener('storage', refreshMembership);
    };
  }, [refreshMembership]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setAuthLoading(false);
      refreshMembership();
    });
    return unsubscribe;
  }, [refreshMembership]);

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('noblesTestUser');
    window.dispatchEvent(new Event('nobles-auth-change'));
    navigate(ROUTES.HOME);
  };

  const content = {
    profile: <ProfileSection firebaseUser={firebaseUser} authLoading={authLoading} />,
    measurements: <MeasurementsSection firebaseUser={firebaseUser} authLoading={authLoading} />,
    membership: <MembershipSection status={status} loading={membershipLoading} />,
    security: <SecuritySection firebaseUser={firebaseUser} />,
    notifications: <NotificationsSection firebaseUser={firebaseUser} authLoading={authLoading} />,
  }[active];

  return (
    <MainLayout scrollTarget=".settings-page">
      <main className="settings-page">
        <div className="settings-topbar">
          {firebaseUser && (
            <button className="settings-signout" onClick={handleSignOut}>
              Sign out
            </button>
          )}
        </div>

        <section className="settings-shell">
          <p className="settings-eyebrow">Account</p>
          <h1>Settings</h1>

          <div className="settings-grid">
            <nav className="settings-nav">
              {NAV.map(({ id, label }) => (
                <button
                  key={id}
                  className={`settings-nav-item ${active === id ? 'active' : ''}`}
                  onClick={() => setActive(id)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="settings-content">{content}</div>
          </div>
        </section>
      </main>
    </MainLayout>
  );
};

export default SettingsPage;
