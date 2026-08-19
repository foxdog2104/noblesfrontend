import React from "react";
import { Link } from 'react-router-dom';
import { getArticleCategoryLabel } from '../constants/articleCategories';
import './ArticleCard.css';

const isClubNoblesArticle = (article) => (
  article.section === 'club-nobles'
  || ['articles', 'recent-shoots', 'agency-announcements', 'magazine-features'].includes(article.category)
);

const isImageOnlyCategory = (article) => (
  article.category === 'recent-shoots'
  || article.category === 'magazine-features'
);

const isTextOnlyCategory = (article) => article.category === 'agency-announcements';

const ArticleCard = ({ article, onImageClick }) => {
  const cleanContent = article.content?.trim() || '';
  const preview = cleanContent.slice(0, 170);
  const lastSpaceIndex = preview.lastIndexOf(' ');
  const previewText = lastSpaceIndex > 0 ? preview.slice(0, lastSpaceIndex) : preview;

  if (isImageOnlyCategory(article)) {
    return (
      <button
        type="button"
        className="article-card article-card-image-only"
        onClick={() => onImageClick?.(article)}
        aria-label={`View ${article.title || getArticleCategoryLabel(article.category)}`}
      >
        {article.cover && <img src={article.cover} alt={article.title || getArticleCategoryLabel(article.category)} />}
      </button>
    );
  }

  return (
    <Link
      to={`/articles/${article.slug}`}
      className={isTextOnlyCategory(article) ? 'article-card article-card-text-only' : 'article-card'}
    >
      {!isTextOnlyCategory(article) && (
        <div className="article-card-image" aria-hidden="true">
          {article.cover && <img src={article.cover} alt="" />}
        </div>
      )}
      <div className="article-card-content">
        {isClubNoblesArticle(article) && (
          <span className="article-card-category">{getArticleCategoryLabel(article.category)}</span>
        )}
        <p>{article.author} / {article.dateWritten}</p>
        <h2>{article.title}</h2>
        {previewText && <span className="article-card-preview">{previewText}.....</span>}
      </div>
    </Link>
  );
};

export default ArticleCard;

