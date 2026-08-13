import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';

const ADMIN_API_URL = process.env.REACT_APP_MEMBERSHIP_API_URL || 'http://localhost:5000';

const waitForCurrentUser = () => new Promise((resolve) => {
  if (auth.currentUser) {
    resolve(auth.currentUser);
    return;
  }

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe();
    resolve(user);
  });
});

const getAdminHeaders = async () => {
  const user = await waitForCurrentUser();

  if (!user) {
    throw new Error('You must be logged in to view admin records.');
  }

  const token = await user.getIdToken(true);

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getAdminJson = async (path) => {
  const headers = await getAdminHeaders();
  const response = await fetch(`${ADMIN_API_URL}${path}`, { headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Unable to load admin data.');
  }

  return data;
};

export const checkAdminAccount = async () => getAdminJson('/api/admin/check');

export const getContactSubmissions = async () => {
  const snap = await getDocs(query(collection(db, 'contactSubmissions'), orderBy('submittedAt', 'desc')));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getScoutSubmissions = async () => {
  const snap = await getDocs(query(collection(db, 'scoutSubmissions'), orderBy('submittedAt', 'desc')));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const deleteScoutSubmission = async (id) => {
  await deleteDoc(doc(db, 'scoutSubmissions', id));
};

export const deleteContactSubmission = async (id) => {
  await deleteDoc(doc(db, 'contactSubmissions', id));
};
