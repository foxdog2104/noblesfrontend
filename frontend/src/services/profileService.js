import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToAzureBlob } from './azureStorageService';

const DEFAULT_NOTIFICATIONS = {
  castingCalls: true,
  membershipUpdates: true,
  compCardViews: true,
  clubNoblesNews: false,
};

const DEFAULT_MEASUREMENTS = {
  height: '',
  bust: '',
  waist: '',
  hips: '',
  shoeSize: '',
  hairColor: '',
  eyeColor: '',
};

// Reads users/{uid}. Returns sensible defaults if the doc doesn't exist yet.
export const getProfile = async (uid) => {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return {
      displayName: '',
      bio: '',
      basedIn: '',
      avatarUrl: null,
      deactivated: false,
      notifications: DEFAULT_NOTIFICATIONS,
      measurements: DEFAULT_MEASUREMENTS,
    };
  }

  const data = snapshot.data();
  return {
    displayName: data.displayName || '',
    bio: data.bio || '',
    basedIn: data.basedIn || '',
    avatarUrl: data.avatarUrl || null,
    deactivated: !!data.deactivated,
    notifications: { ...DEFAULT_NOTIFICATIONS, ...(data.notifications || {}) },
    measurements: { ...DEFAULT_MEASUREMENTS, ...(data.measurements || {}) },
  };
};

// Merges partial updates into users/{uid} so saving one section doesn't
// wipe out fields owned by another section.
export const saveProfile = async (uid, updates) => {
  await setDoc(doc(db, 'users', uid), updates, { merge: true });
};

// Uploads a headshot to Azure Blob (same storage used for scout-submission
// photos) and returns its public URL. Caller is responsible for saving that
// URL via saveProfile.
export const uploadAvatar = async (uid, file) => uploadToAzureBlob(file, 'avatars');