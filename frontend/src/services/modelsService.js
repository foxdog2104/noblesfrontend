import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { models } from '../data/models';
import { auth, db } from '../firebase';

const ADMIN_MODELS_KEY = 'noblesAdminModels';
const MODELS_COLLECTION = 'adminModels';

const normalizeAdminModels = (adminModels) => (
  adminModels.map((model) => ({
    ...model,
    showOnModelsPage: model.showOnModelsPage !== false,
  }))
);

const getStoredModels = () => {
  try {
    const savedModels = JSON.parse(
      localStorage.getItem(ADMIN_MODELS_KEY) || 'null'
    );

    if (!Array.isArray(savedModels)) {
      return [];
    }

    return normalizeAdminModels(savedModels);
  } catch (error) {
    console.warn('Could not read stored admin models:', error);
    return [];
  }
};

const saveStoredModels = (nextModels) => {
  localStorage.setItem(
    ADMIN_MODELS_KEY,
    JSON.stringify(nextModels)
  );
};

const cleanRecord = (record) => {
  const cleaned = JSON.parse(JSON.stringify(record));

  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });

  return cleaned;
};

const getFirestoreModels = async () => {
  const snap = await getDocs(
    collection(db, MODELS_COLLECTION)
  );

  return normalizeAdminModels(
    snap.docs
      .map((modelDoc) => {
        const data = modelDoc.data();
        const { updatedBy, ...model } = data;

        return {
          ...model,
          slug: data.slug || modelDoc.id,
          order: data.order ?? 0,
        };
      })
      .sort(
        (firstModel, secondModel) =>
          firstModel.order - secondModel.order
      )
  );
};

const saveFirestoreModels = async (nextModels) => {
  if (!auth.currentUser) {
    throw new Error(
      'You must be logged in with Firebase before saving models.'
    );
  }

  const collectionRef = collection(
    db,
    MODELS_COLLECTION
  );

  const existingSnap = await getDocs(collectionRef);

  const nextSlugs = new Set(
    nextModels.map((model) => model.slug)
  );

  const recordsToDelete = existingSnap.docs.filter(
    (modelDoc) => !nextSlugs.has(modelDoc.id)
  );

  await Promise.all(
    recordsToDelete.map((modelDoc) =>
      deleteDoc(
        doc(db, MODELS_COLLECTION, modelDoc.id)
      )
    )
  );

  await Promise.all(
    nextModels.map((model, index) => {
      if (!model.slug) {
        throw new Error('Every model must have a slug.');
      }

      return setDoc(
        doc(db, MODELS_COLLECTION, model.slug),
        {
          ...cleanRecord(model),
          slug: model.slug,
          order: index,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser.email || 'unknown',
        }
      );
    })
  );
};

export const saveAdminModels = async (nextModels) => {
  if (!Array.isArray(nextModels)) {
    throw new Error('Models must be an array.');
  }

  try {
    await saveFirestoreModels(nextModels);
  } catch (error) {
    console.error('Firebase model save failed:', error);

    window.alert(
      `Firebase model save failed: ${error.message}`
    );

    throw error;
  }

  saveStoredModels(nextModels);

  window.dispatchEvent(
    new Event('nobles-admin-content-change')
  );
};

export const getModels = async () => {
  try {
    const firestoreModels = await getFirestoreModels();
    return [
      ...models,
      ...firestoreModels.filter(
        (model) => model.showOnModelsPage !== false
      ),
    ];
  } catch (error) {
    console.warn(
      'Firebase models unavailable, using local models:',
      error
    );
    console.log('something went wrong')
    return [
      ...models,
      ...getStoredModels().filter(
        (model) => model.showOnModelsPage !== false
      ),
    ];
  }
};

export const getModelsByDivision = async (division) => {
  const allModels = await getModels();

  return allModels.filter(
    (model) =>
      model.division === division.toLowerCase()
  );
};

export const getModelBySlug = async (slug) => {
  const allModels = await getModels();

  return (
    allModels.find(
      (model) => model.slug === slug
    ) ?? null
  );
};

export const getAdminModels = async () => {
  try {
    const firestoreModels = await getFirestoreModels();
    return firestoreModels.length > 0 ? firestoreModels : getStoredModels();
  } catch (error) {
    console.warn(
      'Firebase admin models unavailable:',
      error
    );

    return getStoredModels();
  }
};
