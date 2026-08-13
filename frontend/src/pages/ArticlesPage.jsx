import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import ArticleCard from '../components/ArticleCard';
import { getArticles } from '../services/articlesService';
import './ArticlesPage.css';

// Shows the member-only Club Nobles article library with a simple search box.
const ArticlesPage = ({ embedded = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const loadArticles = async () => {
    const nextArticles = await getArticles();
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
  }, []);

  const visible = searchTerm
    ? articles.filter((article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase())
      || article.author.toLowerCase().includes(searchTerm.toLowerCase())
      || article.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : articles;

  const content = (
      <main className={`articles-page${embedded ? ' articles-page-embedded' : ''}`}>
        <header className="articles-header">
          <p className="articles-eyebrow">Member Library</p>
          <h1>Club Nobles Articles</h1>
          <p className="articles-subtitle">Our Noble Diary</p>
          <input
            type="text"
            className="articles-search"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search articles"
          />
        </header>

        <section className="articles-grid" aria-label="Club Nobles article list">
          {visible.length > 0 ? (
            visible.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))
          ) : (
            <p className="articles-empty">No articles found.</p>
          )}
        </section>
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

