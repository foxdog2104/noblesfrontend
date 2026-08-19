import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToAzureBlob } from './azureStorageService';

const PROFILE_AVATAR_STORAGE_MODE = process.env.REACT_APP_PROFILE_AVATAR_STORAGE_MODE || 'local';
const LOCAL_AVATAR_STORAGE_KEY = 'noblesProfileAvatars';

const DEFAULT_NOTIFICATIONS = {
  castingCalls: true,
  membershipUpdates: true,
  compCardViews: true,
  clubNoblesNews: false,
};

const getLocalAvatars = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_AVATAR_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveLocalAvatar = (uid, avatarUrl) => {
  const avatars = getLocalAvatars();
  avatars[uid] = avatarUrl;
  localStorage.setItem(LOCAL_AVATAR_STORAGE_KEY, JSON.stringify(avatars));
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
  const localAvatarUrl = getLocalAvatars()[uid] || null;

  if (!snapshot.exists()) {
    return {
      displayName: '',
      bio: '',
      basedIn: '',
      avatarUrl: localAvatarUrl,
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
    avatarUrl: localAvatarUrl || data.avatarUrl || null,
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

// Defaults to local storage for development. To switch this back to the backend,
// set REACT_APP_PROFILE_AVATAR_STORAGE_MODE=backend and keep the same UI call.
export const uploadAvatar = async (uid, file) => {
  if (PROFILE_AVATAR_STORAGE_MODE === 'backend') {
    const avatarUrl = await uploadToAzureBlob(file, 'avatars');
    await saveProfile(uid, { avatarUrl });
    return avatarUrl;
  }

  const avatarUrl = await fileToDataUrl(file);
  saveLocalAvatar(uid, avatarUrl);
  return avatarUrl;
};
