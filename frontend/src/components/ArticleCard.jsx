import React from "react";
import { Link } from 'react-router-dom';
import './ArticleCard.css';

const ArticleCard = ({ article }) => {
  const cleanContent = article.content.trim();
  const preview = cleanContent.slice(0, 170);
  const lastSpaceIndex = preview.lastIndexOf(' ');
  const previewText = lastSpaceIndex > 0 ? preview.slice(0, lastSpaceIndex) : preview;

  return (
    <Link to={`/articles/${article.slug}`} className="article-card">
      <div className="article-card-image" aria-hidden="true">
        {article.cover && <img src={article.cover} alt="" />}
      </div>
      <div className="article-card-content">
        <p>{article.author} / {article.dateWritten}</p>
        <h2>{article.title}</h2>
        <span>{previewText}.....</span>
      </div>
    </Link>
  );
};

export default ArticleCard;

