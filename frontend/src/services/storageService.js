import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { storage } from '../firebase';

const sanitizeFileName = (name) => (
  name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
);

export const uploadImage = async (file, folder) => {
  if (!file) return null;

  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const storageRef = ref(storage, `${folder}/${fileName}`);

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  return getDownloadURL(storageRef);
};

export const deleteImageByUrl = async (url) => {
  if (!url || !url.includes('firebasestorage')) return;

  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    // The Firestore record should still be removable if the image
    // has already been deleted.
    console.warn('Could not delete Firebase image:', error);
  }
};