import { collection, doc, getDocs, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import articles from '../data/articles';
import { auth, db } from '../firebase';

const ADMIN_ARTICLES_KEY = 'noblesAdminArticles';
const ARTICLES_COLLECTION = 'adminArticles';

const getStoredArticles = () => {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_ARTICLES_KEY) || '[]');
  } catch (error) {
    return [];
  }
};

const saveStoredArticles = (nextArticles) => {
  localStorage.setItem(ADMIN_ARTICLES_KEY, JSON.stringify(nextArticles));
};

const cleanRecord = (record) => JSON.parse(JSON.stringify(record));

const getFirestoreArticles = async () => {
  const snap = await getDocs(collection(db, ARTICLES_COLLECTION));

  return snap.docs
    .map((articleDoc) => {
      const data = articleDoc.data();
      const { updatedAt, ...article } = data;

      return {
        ...article,
        slug: data.slug || articleDoc.id,
        order: data.order ?? 0,
      };
    })
    .sort((firstArticle, secondArticle) => firstArticle.order - secondArticle.order);
};

const saveFirestoreArticles = async (nextArticles) => {
  if (!auth.currentUser) {
    throw new Error('You must be logged in with Firebase before saving articles.');
  }

   const existingSnap = await getDocs(
    collection(db, ARTICLES_COLLECTION)
  );

  const nextSlugs = new Set(
    nextArticles.map((article) => article.slug)
  );

  await Promise.all(
    existingSnap.docs
      .filter((articleDoc) => !nextSlugs.has(articleDoc.id))
      .map((articleDoc) =>
        deleteDoc(doc(db, ARTICLES_COLLECTION, articleDoc.id))
      )
  );

  await Promise.all(
    nextArticles.map((article, index) =>
      setDoc(
        doc(db, ARTICLES_COLLECTION, article.slug),
        {
          ...cleanRecord(article),
          order: index,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser.email || 'unknown',
        }
      )
    )
  );
};

const mergeArticlesBySlug = (baseArticles, storedArticles) => {
  const articleMap = new Map();

  baseArticles.forEach((article) => articleMap.set(article.slug, article));
  storedArticles.forEach((article) => articleMap.set(article.slug, article));

  return [...articleMap.values()];
};

export const saveAdminArticles = async (nextArticles) => {
  saveStoredArticles(nextArticles);

  try {
    await saveFirestoreArticles(nextArticles);
  } catch (error) {
    const message = `Firebase article save failed: ${error.message}`;
    console.error(message);
    window.alert(message);
    throw error;
  }

  window.dispatchEvent(new Event('nobles-admin-content-change'));
};

export const getArticles = async () => {
  try {
    const firestoreArticles = await getFirestoreArticles();
    return mergeArticlesBySlug(articles, firestoreArticles)
      .filter((article) => article.showOnArticlesPage !== false);
  } catch (error) {
    return mergeArticlesBySlug(articles, getStoredArticles())
      .filter((article) => article.showOnArticlesPage !== false);
  }
};

export const getArticleBySlug = async (slug) => {
  const allArticles = await getArticles();
  return allArticles.find((article) => article.slug === slug) ?? null;
};

export const getAdminArticles = async () => {
  try {
    const firestoreArticles = await getFirestoreArticles();
    return firestoreArticles.length ? firestoreArticles : articles;
  } catch (error) {
    const storedArticles = getStoredArticles();
    return storedArticles.length ? storedArticles : articles;
  }
};
