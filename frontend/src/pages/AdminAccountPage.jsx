import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { auth, db } from '../firebase';
import { ROUTES } from '../constants';
import arrowLeft from '../assets/images/arrow-left.svg';
import './AdminAccountPage.css';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];

const demoAccount = {
  id: 'demo-account',
  firstName: 'Nobles',
  lastName: 'Admin',
  email: 'noblesadmintest@gmail.com',
  phoneNumber: '(403) 555-0124',
  createdAt: new Date('2026-08-01T09:00:00'),
};

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
};

const formatDate = (value) => {
  if (!value) return 'No date';
  if (value.toDate) return value.toDate().toLocaleString();
  if (value.seconds) return new Date(value.seconds * 1000).toLocaleString();
  return String(value);
};

// Lets an admin view, edit, or delete a single website account record.
const AdminAccountPage = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState('');
  const isDemoAccount = accountId === demoAccount.id;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(ADMIN_EMAILS.includes(user?.email?.toLowerCase() || ''));
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady || !isAdmin) return;

    const loadAccount = async () => {
      if (isDemoAccount) {
        setAccount(demoAccount);
        setForm({
          firstName: demoAccount.firstName,
          lastName: demoAccount.lastName,
          email: demoAccount.email,
          phoneNumber: demoAccount.phoneNumber,
        });
        return;
      }

      const accountRef = doc(db, 'users', accountId);
      const accountSnap = await getDoc(accountRef);

      if (!accountSnap.exists()) {
        setNotFound(true);
        return;
      }

      const accountData = { id: accountSnap.id, ...accountSnap.data() };
      setAccount(accountData);
      setForm({
        firstName: accountData.firstName || '',
        lastName: accountData.lastName || '',
        email: accountData.email || '',
        phoneNumber: accountData.phoneNumber || '',
      });
    };

    loadAccount().catch((error) => setMessage(error.message));
  }, [accountId, authReady, isAdmin, isDemoAccount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveAccount = async (e) => {
    e.preventDefault();

    if (isDemoAccount) {
      setAccount((prev) => ({ ...prev, ...form }));
      setMessage('Demo account updated on this page only.');
      return;
    }

    await updateDoc(doc(db, 'users', accountId), {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phoneNumber: form.phoneNumber,
    });

    setAccount((prev) => ({ ...prev, ...form }));
    setMessage('Account saved.');
  };

  const deleteAccount = async () => {
    if (isDemoAccount) {
      setMessage('The demo account cannot be deleted.');
      return;
    }

    if (!window.confirm('Delete this account record? This cannot be undone.')) return;

    await deleteDoc(doc(db, 'users', accountId));
    navigate(`${ROUTES.ADMIN}?tab=accounts`);
  };

  if (!authReady) {
    return (
      <MainLayout>
        <main className="admin-account-page admin-account-centered">
          <section className="admin-account-access">
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
        <main className="admin-account-page admin-account-centered">
          <section className="admin-account-access">
            <p>Admin</p>
            <h1>Access Required</h1>
            <span>Log in with an admin account to view accounts.</span>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (notFound) {
    return (
      <MainLayout>
        <main className="admin-account-page admin-account-centered">
          <section className="admin-account-access">
            <p>Admin</p>
            <h1>Account Not Found</h1>
            <Link to={`${ROUTES.ADMIN}?tab=accounts`}>Back To Admin</Link>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (!account) return null;

  return (
    <MainLayout>
      <main className="admin-account-page">
        <header className="admin-account-header">
          <p>Admin / Accounts</p>
          <div className="admin-account-title-row">
            <Link to={`${ROUTES.ADMIN}?tab=accounts`} className="admin-account-back" aria-label="Back to admin">
              <img src={arrowLeft} alt="" />
            </Link>
            <h1>Account Info</h1>
          </div>
          <span>{account.email}</span>
        </header>

        <section className="admin-account-layout">
          <aside className="admin-account-summary">
            <p>Account ID</p>
            <strong>{account.id}</strong>
            <p>Created</p>
            <strong>{formatDate(account.createdAt)}</strong>
          </aside>

          <form className="admin-account-form" onSubmit={saveAccount}>
            <label className="admin-account-field">
              <span>First Name</span>
              <input name="firstName" value={form.firstName} onChange={handleChange} />
            </label>
            <label className="admin-account-field">
              <span>Last Name</span>
              <input name="lastName" value={form.lastName} onChange={handleChange} />
            </label>
            <label className="admin-account-field">
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={handleChange} />
            </label>
            <label className="admin-account-field">
              <span>Phone Number</span>
              <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
            </label>

            {message && <p className="admin-account-message">{message}</p>}

            <div className="admin-account-actions">
              <button type="button" onClick={() => navigate(`${ROUTES.ADMIN}?tab=accounts`)}>Back To Admin</button>
              <button type="submit">Save Changes</button>
              <button type="button" onClick={deleteAccount}>Delete Account</button>
            </div>
          </form>
        </section>
      </main>
    </MainLayout>
  );
};

export default AdminAccountPage;



