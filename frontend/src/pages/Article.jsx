import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { getArticleBySlug } from '../services/articlesService';
import { ROUTES } from '../constants';
import { getArticleCategoryLabel } from '../constants/articleCategories';
import './Article.css';

const isClubNoblesArticle = (article) => (
  article.section === 'club-nobles'
  || ['articles', 'recent-shoots', 'agency-announcements', 'magazine-features'].includes(article.category)
);

// Shows one full Club Nobles article selected from the member library.
const Article = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getArticleBySlug(slug).then((data) => {
      if (data) setArticle(data);
      else setNotFound(true);
    });
  }, [slug]);

  if (notFound) {
    return (
      <MainLayout>
        <main className="article-page">
          <section className="article-shell">
            <h1>Article Not Found</h1>
            <Link to={ROUTES.ARTICLES} className="article-back-link">Back To Articles</Link>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (!article) return null;
  const articleMeta = isClubNoblesArticle(article)
    ? `${getArticleCategoryLabel(article.category)} / ${article.author} / ${article.dateWritten}`
    : `${article.author} / ${article.dateWritten}`;
  const backRoute = isClubNoblesArticle(article) ? ROUTES.ARTICLES : ROUTES.ARTICLES;

  return (
    <MainLayout>
      <main className="article-page">
        <article className="article-shell">
          <Link to={backRoute} className="article-back-link">Back To Articles</Link>
          <header className="article-header">
            <p className="article-eyebrow">{articleMeta}</p>
            <h1>{article.title}</h1>
          </header>
          {article.cover && <img src={article.cover} alt={article.title} className="article-cover-image" />}
          {article.content && <p className="article-body">{article.content}</p>}
        </article>
      </main>
    </MainLayout>
  );
};

export default Article;

