import { collection, doc, getDocs, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import articles from '../data/articles';
import { auth, db } from '../firebase';

const ADMIN_ARTICLES_KEY = 'noblesAdminArticles';
const ARTICLES_COLLECTION = 'adminArticles';
const CLUB_NOBLES_SECTION = 'club-nobles';
const MEMBERSHIP_CATEGORIES = ['articles', 'recent-shoots', 'agency-announcements', 'magazine-features'];
// Keep Club Nobles admin uploads local for now. Set this to "backend" when the
// Firestore rules/storage setup is ready, without changing the admin UI.
const CLUB_NOBLES_STORAGE_MODE = process.env.REACT_APP_CLUB_NOBLES_STORAGE_MODE || 'local';
const isClubNoblesBackendEnabled = CLUB_NOBLES_STORAGE_MODE === 'backend';

const getArticleCategory = (article) => (
  article.category
  || (article.section === 'articles' ? 'articles' : '')
);

const getArticleSection = (article) => (
  MEMBERSHIP_CATEGORIES.includes(getArticleCategory(article))
    ? CLUB_NOBLES_SECTION
    : article.section || 'articles'
);

const isLocalOnlyClubNoblesArticle = (article) => {
  const category = getArticleCategory(article);

  return !isClubNoblesBackendEnabled
    && category !== 'articles'
    && MEMBERSHIP_CATEGORIES.includes(category);
};

const isClubNoblesAdminArticle = (article) => {
  const category = getArticleCategory(article);

  return category !== 'articles' && MEMBERSHIP_CATEGORIES.includes(category);
};

const normalizeArticleRecord = (article) => {
  const category = getArticleCategory(article);

  return {
    ...article,
    category,
    section: getArticleSection(article),
    cover: category === 'agency-announcements' ? '' : article.cover,
    coverFileName: category === 'agency-announcements' ? '' : article.coverFileName,
  };
};

const getStoredArticles = () => {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_ARTICLES_KEY) || '[]');
  } catch (error) {
    return [];
  }
};

const getStoredClubNoblesArticles = () => (
  isClubNoblesBackendEnabled
    ? []
    : getStoredArticles().filter(isClubNoblesAdminArticle)
);

const saveStoredArticles = (nextArticles) => {
  localStorage.setItem(
    ADMIN_ARTICLES_KEY,
    JSON.stringify(nextArticles.filter(isClubNoblesAdminArticle))
  );
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

  const backendArticles = nextArticles.filter((article) => !isLocalOnlyClubNoblesArticle(article));

   const existingSnap = await getDocs(
    collection(db, ARTICLES_COLLECTION)
  );

  const nextSlugs = new Set(
    backendArticles.map((article) => article.slug)
  );

  await Promise.all(
    existingSnap.docs
      .filter((articleDoc) => !isLocalOnlyClubNoblesArticle(articleDoc.data()))
      .filter((articleDoc) => !nextSlugs.has(articleDoc.id))
      .map((articleDoc) =>
        deleteDoc(doc(db, ARTICLES_COLLECTION, articleDoc.id))
      )
  );

  await Promise.all(
    backendArticles.map((article, index) =>
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

  baseArticles.forEach((article) => articleMap.set(article.slug, normalizeArticleRecord(article)));
  storedArticles.forEach((article) => articleMap.set(article.slug, normalizeArticleRecord(article)));

  return [...articleMap.values()];
};

export const saveAdminArticles = async (nextArticles) => {
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

export const saveAdminArticlesLocal = async (nextArticles) => {
  if (isClubNoblesBackendEnabled) {
    await saveFirestoreArticles(nextArticles);
  } else {
    saveStoredArticles(nextArticles);
  }

  window.dispatchEvent(new Event('nobles-admin-content-change'));
};

export const getArticles = async ({ section = CLUB_NOBLES_SECTION } = {}) => {
  const storedArticles = getStoredClubNoblesArticles();

  try {
    const firestoreArticles = await getFirestoreArticles();
    return mergeArticlesBySlug(mergeArticlesBySlug(articles, firestoreArticles), storedArticles)
      .filter((article) => article.showOnArticlesPage !== false)
      .filter((article) => section === 'all' || getArticleSection(article) === section);
  } catch (error) {
    return mergeArticlesBySlug(articles, storedArticles)
      .filter((article) => article.showOnArticlesPage !== false)
      .filter((article) => section === 'all' || getArticleSection(article) === section);
  }
};

export const getArticleBySlug = async (slug) => {
  const allArticles = await getArticles({ section: 'all' });
  return allArticles.find((article) => article.slug === slug) ?? null;
};

export const getAdminArticles = async () => {
  const storedArticles = getStoredClubNoblesArticles();

  try {
    const firestoreArticles = await getFirestoreArticles();
    return mergeArticlesBySlug(
      firestoreArticles.length ? mergeArticlesBySlug(articles, firestoreArticles) : articles,
      storedArticles
    ).map(normalizeArticleRecord);
  } catch (error) {
    return (storedArticles.length ? storedArticles : articles).map(normalizeArticleRecord);
  }
};
