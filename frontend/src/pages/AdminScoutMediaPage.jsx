import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { auth, db } from '../firebase';
import { ROUTES } from '../constants';
import getScoutedDemoPhoto from '../assets/images/get-scouted-bg.png';
import arrowLeft from '../assets/images/arrow-left.svg';
import './AdminScoutMediaPage.css';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];

const demoScoutSubmission = {
  id: 'demo-get-scouted-submission',
  firstName: 'Mia',
  lastName: 'Example',
  photoUrl: getScoutedDemoPhoto,
  videos: [],
};

const toList = (...values) => values.flat().filter(Boolean);

// Shows the photos and videos attached to one Get Scouted submission.
const AdminScoutMediaPage = () => {
  const { submissionId } = useParams();
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(ADMIN_EMAILS.includes(user?.email?.toLowerCase() || ''));
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady || !isAdmin) return;

    const loadSubmission = async () => {
      if (submissionId === demoScoutSubmission.id) {
        setSubmission(demoScoutSubmission);
        return;
      }

      const submissionSnap = await getDoc(doc(db, 'scoutSubmissions', submissionId));

      if (!submissionSnap.exists()) {
        setNotFound(true);
        return;
      }

      setSubmission({ id: submissionSnap.id, ...submissionSnap.data() });
    };

    loadSubmission().catch(() => setNotFound(true));
  }, [authReady, isAdmin, submissionId]);

  if (!authReady) {
    return (
      <MainLayout>
        <main className="admin-scout-media-page admin-scout-media-centered">
          <section className="admin-scout-media-access">
            <p>Admin</p>
            <h1>Loading</h1>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <main className="admin-scout-media-page admin-scout-media-centered">
          <section className="admin-scout-media-access">
            <p>Admin</p>
            <h1>Access Required</h1>
            <span>Log in with an admin account to view Get Scouted media.</span>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (notFound) {
    return (
      <MainLayout>
        <main className="admin-scout-media-page admin-scout-media-centered">
          <section className="admin-scout-media-access">
            <p>Admin / Get Scouted</p>
            <h1>Media Not Found</h1>
            <Link to={`${ROUTES.ADMIN}?tab=scouted`}>Back To Get Scouted</Link>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (!submission) return null;

  const photos = toList(submission.photoUrl, submission.photos, submission.photoUrls);
  const videos = toList(submission.videoUrl, submission.videos, submission.videoUrls);
  const applicantName = [submission.firstName, submission.lastName].filter(Boolean).join(' ') || 'Get Scouted Applicant';

  return (
    <MainLayout>
      <main className="admin-scout-media-page">
        <header className="admin-scout-media-header">
          <p>Admin / Get Scouted</p>
          <div className="admin-scout-media-title-row">
            <Link to={`${ROUTES.ADMIN}?tab=scouted`} className="admin-scout-media-back" aria-label="Back to get scouted submissions">
              <img src={arrowLeft} alt="" />
            </Link>
            <h1>Photos / Videos</h1>
          </div>
          <span>{applicantName}</span>
        </header>

        <section className="admin-scout-media-section">
          <h2>Photos</h2>
          {photos.length > 0 ? (
            <div className="admin-scout-photo-grid">
              {photos.map((src, index) => (
                <a href={src} target="_blank" rel="noreferrer" className="admin-scout-photo-card" key={`${src}-${index}`}>
                  <img src={src} alt={`${applicantName} ${index + 1}`} />
                </a>
              ))}
            </div>
          ) : (
            <p className="admin-scout-media-empty">No photos submitted.</p>
          )}
        </section>

        <section className="admin-scout-media-section">
          <h2>Videos</h2>
          {videos.length > 0 ? (
            <div className="admin-scout-video-grid">
              {videos.map((src, index) => (
                <video controls className="admin-scout-video-card" key={`${src}-${index}`}>
                  <source src={src} />
                  Your browser does not support the video tag.
                </video>
              ))}
            </div>
          ) : (
            <p className="admin-scout-media-empty">No videos submitted.</p>
          )}
        </section>
      </main>
    </MainLayout>
  );
};

export default AdminScoutMediaPage;
