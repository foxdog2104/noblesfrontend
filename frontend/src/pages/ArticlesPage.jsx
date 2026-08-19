import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import ArticleCard from '../components/ArticleCard';
import HighlightLightbox from '../components/HighlightLightbox';
import { getArticles } from '../services/articlesService';
import { ARTICLE_CATEGORIES, getArticleCategoryLabel } from '../constants/articleCategories';
import { checkClubNoblesMembership } from '../services/membershipService';
import { ROUTES } from '../constants';
import './ArticlesPage.css';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];
const IMAGE_ONLY_CATEGORIES = ['recent-shoots', 'magazine-features'];

// Shows the member-only Club Nobles article library with a simple search box.
const ArticlesPage = ({
  embedded = false,
  requireAdmin = false,
  section = 'club-nobles',
  eyebrow = 'Member Library',
  title = 'Club Nobles Articles',
  subtitle = 'Our Noble Diary',
  requireMembership = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [articles, setArticles] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const [membershipReady, setMembershipReady] = useState(!requireMembership);
  const [hasClubMembership, setHasClubMembership] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('noblesTestUser') || 'null');
  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email?.toLowerCase());

  useEffect(() => {
    if (!requireMembership) return undefined;

    const checkMembership = async () => {
      const membershipStatus = await checkClubNoblesMembership();
      setHasClubMembership(Boolean(membershipStatus.active));
      setMembershipReady(true);
    };

    checkMembership();

    window.addEventListener('storage', checkMembership);
    window.addEventListener('nobles-auth-change', checkMembership);
    window.addEventListener('nobles-membership-change', checkMembership);

    return () => {
      window.removeEventListener('storage', checkMembership);
      window.removeEventListener('nobles-auth-change', checkMembership);
      window.removeEventListener('nobles-membership-change', checkMembership);
    };
  }, [requireMembership]);

  useEffect(() => {
    if (requireMembership && !isAdmin && !hasClubMembership) return undefined;

    const loadArticles = async () => {
    const nextArticles = await getArticles({ section });
    setArticles(nextArticles);
  };

  loadArticles();

  window.addEventListener(
    'nobles-admin-content-change',
    loadArticles
  );

  return () => {
    window.removeEventListener(
      'nobles-admin-content-change',
      loadArticles
    );
  };
  }, [hasClubMembership, isAdmin, requireMembership, section]);

  const normalizedSearchTerm = searchTerm.toLowerCase();
  const matchesSearch = (article) => (
    !normalizedSearchTerm
    || article.title?.toLowerCase().includes(normalizedSearchTerm)
    || article.author?.toLowerCase().includes(normalizedSearchTerm)
    || getArticleCategoryLabel(article.category).toLowerCase().includes(normalizedSearchTerm)
    || article.content?.toLowerCase().includes(normalizedSearchTerm)
  );
  const visible = articles.filter((article) => (
    (section !== 'club-nobles' || categoryFilter === 'all' || article.category === categoryFilter)
    && matchesSearch(article)
  ));
  const showGroupedClubNobles = section === 'club-nobles' && categoryFilter === 'all';
  const groupedArticles = ARTICLE_CATEGORIES.map((category) => ({
    ...category,
    articles: articles.filter((article) => article.category === category.value && matchesSearch(article)),
  })).filter((category) => category.articles.length > 0);
  const lightboxArticles = visible.filter((article) => (
    IMAGE_ONLY_CATEGORIES.includes(article.category) && article.cover
  ));
  const lightboxImages = lightboxArticles.map((article) => ({
    src: article.cover,
  }));
  const openImageViewer = (article) => {
    const nextIndex = lightboxArticles.findIndex((item) => item.slug === article.slug);
    if (nextIndex >= 0) {
      setActiveImageIndex(nextIndex);
    }
  };

  if (requireAdmin && !isAdmin) {
    return (
      <MainLayout>
        <main className="articles-page">
          <header className="articles-header">
            <p className="articles-eyebrow">Admin</p>
            <h1>Access Required</h1>
            <p className="articles-subtitle">Log in with an admin account to view articles.</p>
          </header>
        </main>
      </MainLayout>
    );
  }

  if (requireMembership && !membershipReady) {
    return null;
  }

  if (requireMembership && !isAdmin && !hasClubMembership) {
    return (
      <MainLayout>
        <main className="articles-page">
          <header className="articles-header">
            <p className="articles-eyebrow">Membership</p>
            <h1>Access Required</h1>
            <p className="articles-subtitle">Join Club Nobles to access the member library.</p>
            <a href={ROUTES.CLUB_NOBLES} className="articles-membership-link">View Club Nobles</a>
          </header>
        </main>
      </MainLayout>
    );
  }

  const content = (
      <main className={`articles-page${embedded ? ' articles-page-embedded' : ''}`}>
        <header className="articles-header">
          <p className="articles-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="articles-subtitle">{subtitle}</p>
          <input
            type="text"
            className="articles-search"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search articles"
          />
          {section === 'club-nobles' && (
            <div className="articles-category-tabs" aria-label="Filter articles by category">
              <button
                type="button"
                className={categoryFilter === 'all' ? 'articles-category-tab active' : 'articles-category-tab'}
                onClick={() => setCategoryFilter('all')}
              >
                All
              </button>
              {ARTICLE_CATEGORIES.map((category) => (
              <button
                type="button"
                className={categoryFilter === category.value ? 'articles-category-tab active' : 'articles-category-tab'}
                onClick={() => setCategoryFilter(category.value)}
                key={category.value}
              >
                {category.label}
              </button>
              ))}
            </div>
          )}
        </header>

        {showGroupedClubNobles ? (
          <div className="articles-sections" aria-label="Club Nobles sections">
            {groupedArticles.length > 0 ? (
              groupedArticles.map((category) => (
                <section className="articles-section-group" key={category.value}>
                  <div className="articles-section-heading">
                    <h2>{category.label}</h2>
                    <button
                      type="button"
                      className="articles-section-link"
                      onClick={() => setCategoryFilter(category.value)}
                      aria-label={`View more ${category.label}`}
                    >
                      <span>View More</span>
                      <span aria-hidden="true">&gt;</span>
                    </button>
                  </div>
                  <div className="articles-grid">
                    {category.articles.slice(0, category.value === 'articles' ? 3 : 4).map((article) => (
                      <ArticleCard key={article.slug} article={article} onImageClick={openImageViewer} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <p className="articles-empty">No articles found.</p>
            )}
          </div>
        ) : (
          <section className="articles-grid" aria-label="Club Nobles article list">
            {visible.length > 0 ? (
              visible.map((article) => (
                <ArticleCard key={article.slug} article={article} onImageClick={openImageViewer} />
              ))
            ) : (
              <p className="articles-empty">No articles found.</p>
            )}
          </section>
        )}
        <HighlightLightbox
          highlights={lightboxImages}
          activeIndex={activeImageIndex}
          onClose={() => setActiveImageIndex(null)}
          onIndexChange={setActiveImageIndex}
        />
      </main>
  );

  if (embedded) {
    return content;
  }

  return (
    <MainLayout>
      {content}
    </MainLayout>
  );
};

export default ArticlesPage;

