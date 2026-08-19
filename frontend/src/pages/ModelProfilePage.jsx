import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { getModelBySlug } from '../services/modelsService';
import './ModelProfilePage.css';

// Maps model stat keys to the labels shown on the profile page.
const STAT_LABELS = {
  height:    'Height',
  bust:      'Bust',
  waist:     'Waist',
  hips:      'Hips',
  shoeSize:  'Shoe',
  hairColor: 'Hair',
  eyeColor:  'Eyes',
};

// Renders one model's full profile using the slug from the URL.
const ModelProfilePage = () => {
  const { slug } = useParams();
  const [model, setModel] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getModelBySlug(slug).then((data) => {
      if (data) setModel(data);
      else setNotFound(true);
    });
  }, [slug]);

  if (notFound) {
    return (
      <MainLayout>
        <div className="profile-not-found">
          <p>Model not found.</p>
          <Link to="/" className="profile-back">← Back</Link>
        </div>
      </MainLayout>
    );
  }

  if (!model) return null;

  const portfolioImages = (model.portfolio || []).filter((src) => src && src !== model.coverImage);
  const isCapCon = model.division === 'capcon';
  const hasQuote = Boolean(model.quote?.trim());

  return (
    <MainLayout>
      <div className={`profile-page${isCapCon ? ' profile-page-capcon' : ''}`}>

        {/* Header */}
        <header className="profile-header">
          <p className="profile-agency">{model.agency}</p>
          <h1 className="profile-name">{model.name}</h1>
          <p className="profile-location">Based in {model.basedIn}</p>
        </header>

        <div className="profile-divider" />

        {/* Stats + Hero photo */}
        <div className={`profile-body${isCapCon ? ' profile-body-capcon' : ''}`}>
          {!isCapCon && (
            <aside className="profile-stats">
              {Object.entries(STAT_LABELS).map(([key, label]) =>
                model.stats?.[key] ? (
                <div key={key} className="profile-stat-row">
                  <span className="profile-stat-label">{label}</span>
                  <span className="profile-stat-value">{model.stats[key]}</span>
                </div>
                ) : null
              )}

              {model.instagramHandle && (
                <a
                  href={`https://instagram.com/${model.instagramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-instagram"
                >
                  {model.instagramHandle}
                </a>
              )}
            </aside>
          )}

          <div className="profile-hero-wrap">
            {model.coverImage && (
              <img
                src={model.coverImage}
                alt={model.name}
                className="profile-hero-img"
              />
            )}
          </div>

          {isCapCon && hasQuote && (
            <blockquote className="profile-quote">
              "{model.quote}"
            </blockquote>
          )}

          {model.bio && (
            <div className="profile-bio">
              <p className="profile-bio-label">About</p>
              <p className="profile-bio-text">{model.bio}</p>
            </div>
          )}
        </div>

        {/* Runway shows */}
        {model.runwayShows.length > 0 && (
          <section className="profile-section">
            <div className="profile-section-header">
              <span className="profile-section-tag">Runway</span>
              <div className="profile-section-line" />
            </div>
            <ul className="profile-shows-list">
              {model.runwayShows.map((show, i) => (
                <li key={i} className="profile-show-item">
                  <span className="profile-show-name">{show.name}</span>
                  <span className="profile-show-season">{show.season}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Portfolio */}
        {portfolioImages.length > 0 && (
          <section className="profile-section">
            <div className="profile-section-header">
              <span className="profile-section-tag">Photography</span>
              <div className="profile-section-line" />
            </div>
            <div className="profile-portfolio-grid">
              {portfolioImages.map((src, i) => (
                <div key={i} className="profile-portfolio-item">
                  <img src={src} alt={`${model.name} ${i + 1}`} className="profile-portfolio-img" />
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </MainLayout>
  );
};

export default ModelProfilePage;
