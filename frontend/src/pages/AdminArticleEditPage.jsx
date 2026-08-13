import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { auth } from '../firebase';
import { ROUTES } from '../constants';
import { getAdminArticles, saveAdminArticles } from '../services/articlesService';
import arrowLeft from '../assets/images/arrow-left.svg';
import './AdminArticleEditPage.css';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];

const emptyForm = {
  title: '',
  author: '',
  dateWritten: '',
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
const readImageFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

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

    const cover = await readImageFile(file);
    setForm((prev) => ({ ...prev, cover, coverFileName: file.name }));
  };

  const saveArticle = async (e) => {
    e.preventDefault();
    if (!originalArticle) return;

    const nextSlug = makeSlug(form.title);
    if (!nextSlug) return;

    const updatedArticle = {
      ...originalArticle,
      ...form,
      slug: nextSlug,
      dateWritten: form.dateWritten || new Date().toISOString().split('T')[0],
    };
    const nextArticles = [
      ...articles.filter((article) => article.slug !== slug && article.slug !== nextSlug),
      updatedArticle,
    ];

    await saveAdminArticles(nextArticles);
    navigate(`${ROUTES.ADMIN}?tab=articles`);
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
            <Link to={`${ROUTES.ADMIN}?tab=articles`}>Back To Admin</Link>
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
            <Link to={`${ROUTES.ADMIN}?tab=articles`} className="admin-article-edit-back" aria-label="Back to admin"><img src={arrowLeft} alt="" /></Link>
            <h1>Edit Article</h1>
          </div>
          <span>{originalArticle.title}</span>
        </header>

        <form className="admin-article-edit-layout" onSubmit={saveArticle}>
          <aside className="admin-article-cover-panel" aria-label="Article cover image">
            <div className="admin-article-cover-panel-header">
              <span>Cover Image</span>
              <label className="admin-article-upload-button">
                Add
                <input type="file" accept="image/*" onChange={handleCoverChange} />
              </label>
            </div>
            <span className="admin-article-upload-name">{form.coverFileName || 'No file chosen'}</span>
            {form.cover ? (
              <img src={form.cover} alt="Article cover preview" className="admin-article-cover-preview" />
            ) : (
              <div className="admin-article-cover-placeholder" />
            )}
          </aside>

          <div className="admin-article-edit-form">
            <label className="admin-article-field"><span>Title</span><input name="title" placeholder="Title" value={form.title} onChange={handleChange} required /></label>
            <label className="admin-article-field"><span>Author</span><input name="author" placeholder="Author" value={form.author} onChange={handleChange} required /></label>
            <label className="admin-article-field"><span>Date Written</span><input type="date" name="dateWritten" value={form.dateWritten} onChange={handleChange} /></label>
            <label className="admin-article-field"><span>Content</span><textarea name="content" placeholder="Article content" value={form.content} onChange={handleChange} required /></label>

            <label className="admin-article-toggle-row">
              <input type="checkbox" name="showOnArticlesPage" checked={form.showOnArticlesPage} onChange={handleChange} />
              <span>Show on articles page</span>
            </label>

            <div className="admin-article-edit-actions">
              <button type="submit">Save Article</button>
              <Link to={`${ROUTES.ADMIN}?tab=articles`}>Back</Link>
            </div>
          </div>
        </form>
      </main>
    </MainLayout>
  );
};

export default AdminArticleEditPage;






