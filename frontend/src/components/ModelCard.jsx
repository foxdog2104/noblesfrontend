import React from 'react';
import { Link } from 'react-router-dom';
import './ModelCard.css';

// Displays a single model card that links to the model's profile page.
const ModelCard = ({ model }) => {
  const parts = model.name.trim().split(' ');
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return (
    <Link to={`/models/${model.slug}`} className="model-card">
      <div className="model-card-img-wrap">
        {model.coverImage ? (
          <img src={model.coverImage} alt={model.name} className="model-card-img" />
        ) : (
          <div className="model-card-placeholder" />
        )}
      </div>
      <div className="model-card-meta">
        <span className="model-card-firstname">{firstName}</span>
        {lastName && <span className="model-card-lastname">{lastName}</span>}
      </div>
    </Link>
  );
};

export default ModelCard;
