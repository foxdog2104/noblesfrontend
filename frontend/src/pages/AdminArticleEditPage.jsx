import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { auth } from '../firebase';
import { ROUTES } from '../constants';
import { ARTICLE_CATEGORIES } from '../constants/articleCategories';
import { getAdminArticles, saveAdminArticles, saveAdminArticlesLocal } from '../services/articlesService';
import { imageFileToCompressedDataUrl } from '../utils/imageCompression';
import arrowLeft from '../assets/images/arrow-left.svg';
import './AdminArticleEditPage.css';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];
const ARTICLE_SECTION = 'articles';
const CLUB_NOBLES_SECTION = 'club-nobles';
const imageOnlyArticleCategories = new Set(['recent-shoots', 'magazine-features']);
const writtenClubNoblesArticleCategories = new Set(['articles', 'agency-announcements']);
const isClubNoblesArticle = (article) => (
  article.section === CLUB_NOBLES_SECTION
  || ARTICLE_CATEGORIES.some((category) => category.value === article.category)
);

const emptyForm = {
  title: '',
  author: '',
  dateWritten: '',
  section: ARTICLE_SECTION,
  category: '',
  content: '',
  cover: '',
  coverFileName: '',
  showOnArticlesPage: true,
};

const makeSlug = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const formatDateForInput = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().split('T')[0];
};
// Lets admins edit one article on its own page before saving it back to local admin content.
const AdminArticleEditPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [articles, setArticles] = useState([]);
  const [originalArticle, setOriginalArticle] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notFound, setNotFound] = useState(false);
  const isClubNoblesForm = isClubNoblesArticle(form);
  const isStandardArticleForm = !isClubNoblesForm;
  const isImageOnlyArticleForm = isClubNoblesForm && imageOnlyArticleCategories.has(form.category);
  const isAgencyAnnouncementArticleForm = isClubNoblesForm && form.category === 'agency-announcements';
  const isMembershipArticleForm = isClubNoblesForm && form.category === 'articles';
  const isWrittenClubNoblesArticleForm = isClubNoblesForm && writtenClubNoblesArticleCategories.has(form.category);
  const showsCoverPanel = isStandardArticleForm || isImageOnlyArticleForm || isMembershipArticleForm;
  const adminBackRoute = isClubNoblesForm && form.category && form.category !== 'articles'
    ? `${ROUTES.ADMIN}?tab=club-nobles`
    : ROUTES.ADMIN;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(ADMIN_EMAILS.includes(user?.email?.toLowerCase() || ''));
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady || !isAdmin) return;

    getAdminArticles().then((records) => {
      const article = records.find((item) => item.slug === slug);
      setArticles(records);

      if (!article) {
        setNotFound(true);
        return;
      }

      setOriginalArticle(article);
      setForm({
        ...emptyForm,
        ...article,
        dateWritten: formatDateForInput(article.dateWritten),
        coverFileName: article.cover ? 'Current cover image' : '',
        showOnArticlesPage: article.showOnArticlesPage !== false,
      });
    });
  }, [authReady, isAdmin, slug]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cover = await imageFileToCompressedDataUrl(file);
    setForm((prev) => ({ ...prev, cover, coverFileName: file.name }));
  };

  const saveArticle = async (e) => {
    e.preventDefault();
    if (!originalArticle) return;

    const nextSlug = makeSlug(form.title);
    if (!nextSlug) return;
    if (isImageOnlyArticleForm && !form.cover) return;
    if ((isWrittenClubNoblesArticleForm || isStandardArticleForm) && !form.content.trim()) return;

    const updatedArticle = {
      ...originalArticle,
      ...form,
      section: isClubNoblesForm ? CLUB_NOBLES_SECTION : ARTICLE_SECTION,
      category: isClubNoblesForm ? form.category : '',
      slug: nextSlug,
      dateWritten: form.dateWritten || new Date().toISOString().split('T')[0],
      content: isImageOnlyArticleForm ? '' : form.content,
      cover: isAgencyAnnouncementArticleForm ? '' : form.cover,
      coverFileName: isAgencyAnnouncementArticleForm ? '' : form.coverFileName,
    };
    const nextArticles = [
      ...articles.filter((article) => article.slug !== slug && article.slug !== nextSlug),
      updatedArticle,
    ];

    if (isClubNoblesForm && form.category !== 'articles') {
      await saveAdminArticlesLocal(nextArticles);
    } else {
      await saveAdminArticles(nextArticles);
    }

    navigate(adminBackRoute);
  };

  if (!authReady) {
    return (
      <MainLayout>
        <main className="admin-article-edit-page admin-article-edit-centered">
          <section className="admin-article-edit-access">
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
        <main className="admin-article-edit-page admin-article-edit-centered">
          <section className="admin-article-edit-access">
            <p>Admin</p>
            <h1>Access Required</h1>
            <span>Log in with an admin account to edit articles.</span>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (notFound) {
    return (
      <MainLayout>
        <main className="admin-article-edit-page admin-article-edit-centered">
          <section className="admin-article-edit-access">
            <p>Admin</p>
            <h1>Article Not Found</h1>
            <Link to={ROUTES.ADMIN}>Back To Admin</Link>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (!originalArticle) return null;

  return (
    <MainLayout>
      <main className="admin-article-edit-page">
        <header className="admin-article-edit-header">
          <p>Admin / Articles</p>
          <div className="admin-article-edit-title-row">
            <Link to={adminBackRoute} className="admin-article-edit-back" aria-label="Back to admin"><img src={arrowLeft} alt="" /></Link>
            <h1>Edit Article</h1>
          </div>
          <span>{originalArticle.title}</span>
        </header>

        <form
          className={`admin-article-edit-layout${!showsCoverPanel ? ' admin-article-edit-layout-no-cover' : ''}`}
          onSubmit={saveArticle}
        >
          {showsCoverPanel && (
            <aside className="admin-article-cover-panel" aria-label={isStandardArticleForm ? 'Article cover image' : 'Club Nobles image'}>
              <div className="admin-article-cover-panel-header">
                <span>
                  {isStandardArticleForm
                    ? 'Cover Image'
                    : form.category === 'articles'
                      ? 'Article Cover Image'
                      : form.category === 'recent-shoots'
                      ? 'Recent Shoot Image'
                      : 'Magazine Feature Image'}
                </span>
                <label className="admin-article-upload-button">
                  Add
                  <input type="file" accept="image/*" onChange={handleCoverChange} />
                </label>
              </div>
              <span className="admin-article-upload-name">{form.coverFileName || 'No file chosen'}</span>
              {form.cover ? (
                <img src={form.cover} alt="Club Nobles preview" className="admin-article-cover-preview" />
              ) : (
                <div className="admin-article-cover-placeholder" />
              )}
            </aside>
          )}

          <div className="admin-article-edit-form">
            {isClubNoblesForm && (
              <label className="admin-article-field">
                <span>Category</span>
                <select name="category" value={form.category} onChange={handleChange}>
                  {ARTICLE_CATEGORIES.map((category) => (
                    <option value={category.value} key={category.value}>{category.label}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="admin-article-field"><span>Title</span><input name="title" placeholder="Title" value={form.title} onChange={handleChange} required /></label>
            {(isWrittenClubNoblesArticleForm || isStandardArticleForm) && (
              <>
                <label className="admin-article-field"><span>Author</span><input name="author" placeholder="Author" value={form.author} onChange={handleChange} required /></label>
                <label className="admin-article-field"><span>Date Written</span><input type="date" name="dateWritten" value={form.dateWritten} onChange={handleChange} /></label>
                <label className="admin-article-field"><span>Content</span><textarea name="content" placeholder="Article content" value={form.content} onChange={handleChange} required /></label>
              </>
            )}

            <label className="admin-article-toggle-row">
              <input type="checkbox" name="showOnArticlesPage" checked={form.showOnArticlesPage} onChange={handleChange} />
              <span>Show on articles page</span>
            </label>

            <div className="admin-article-edit-actions">
              <button type="submit">Save Article</button>
              <Link to={adminBackRoute}>Back</Link>
            </div>
          </div>
        </form>
      </main>
    </MainLayout>
  );
};

export default AdminArticleEditPage;






