import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { auth, db } from '../firebase';
import { ROUTES } from '../constants';
import arrowLeft from '../assets/images/arrow-left.svg';
import './AdminContactMessagePage.css';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];

const demoContactSubmission = {
  id: 'demo-contact-message',
  name: 'Ava Example',
  email: 'ava.example@email.com',
  subject: 'Booking Inquiry',
  message: 'Hello, I would like to ask about booking a model for an upcoming creative project in Calgary.',
  submittedAt: new Date('2026-08-01T11:15:00'),
};

const formatDate = (value) => {
  if (!value) return 'No date';
  if (value.toDate) return value.toDate().toLocaleString();
  if (value.seconds) return new Date(value.seconds * 1000).toLocaleString();
  return String(value);
};

// Shows one contact message from the admin dashboard in a full detail view.
const AdminContactMessagePage = () => {
  const { messageId } = useParams();
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState(null);
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

    const loadMessage = async () => {
      if (messageId === demoContactSubmission.id) {
        setMessage(demoContactSubmission);
        return;
      }

      const messageSnap = await getDoc(doc(db, 'contactSubmissions', messageId));

      if (!messageSnap.exists()) {
        setNotFound(true);
        return;
      }

      setMessage({ id: messageSnap.id, ...messageSnap.data() });
    };

    loadMessage().catch(() => setNotFound(true));
  }, [authReady, isAdmin, messageId]);

  if (!authReady) {
    return (
      <MainLayout>
        <main className="admin-contact-message-page admin-contact-message-centered">
          <section className="admin-contact-message-access">
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
        <main className="admin-contact-message-page admin-contact-message-centered">
          <section className="admin-contact-message-access">
            <p>Admin</p>
            <h1>Access Required</h1>
            <span>Log in with an admin account to view contact messages.</span>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (notFound) {
    return (
      <MainLayout>
        <main className="admin-contact-message-page admin-contact-message-centered">
          <section className="admin-contact-message-access">
            <p>Admin / Contact Messages</p>
            <h1>Message Not Found</h1>
            <Link to={`${ROUTES.ADMIN}?tab=contact`}>Back To Contact Messages</Link>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (!message) return null;

  return (
    <MainLayout>
      <main className="admin-contact-message-page">
        <header className="admin-contact-message-header">
          <p>Admin / Contact Messages</p>
          <div className="admin-contact-message-title-row">
            <Link to={`${ROUTES.ADMIN}?tab=contact`} className="admin-contact-message-back" aria-label="Back to contact messages">
              <img src={arrowLeft} alt="" />
            </Link>
            <h1>Contact Message</h1>
          </div>
          <span>{message.subject || 'No subject'}</span>
        </header>

        <article className="admin-contact-message-shell">
          <div className="admin-contact-message-meta">
            <div>
              <span>Name</span>
              <p>{message.name || 'No name'}</p>
            </div>
            <div>
              <span>Email</span>
              <p>{message.email || 'No email'}</p>
            </div>
            <div>
              <span>Submitted</span>
              <p>{formatDate(message.submittedAt)}</p>
            </div>
          </div>

          <section className="admin-contact-message-body">
            <span>Message</span>
            <p>{message.message || 'No message provided.'}</p>
          </section>

          <Link to={`${ROUTES.ADMIN}?tab=contact`} className="admin-contact-message-button">Back To Contact Messages</Link>
        </article>
      </main>
    </MainLayout>
  );
};

export default AdminContactMessagePage;
