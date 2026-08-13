import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { ROUTES } from '../constants';
import { getModelBySlug } from '../services/modelsService';
import './ModelProfilePage.css';
import './AdminModelPreviewPage.css';

const MODEL_PREVIEW_KEY = 'noblesAdminModelPreview';

const STAT_LABELS = {
  height: 'Height',
  bust: 'Bust',
  waist: 'Waist',
  hips: 'Hips',
  shoeSize: 'Shoe',
  hairColor: 'Hair',
  eyeColor: 'Eyes',
};

// Shows an unsaved admin model draft using the same layout as the public model profile.
const AdminModelPreviewPage = () => {
  const { slug } = useParams();
  const [model, setModel] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const savedPreview = JSON.parse(sessionStorage.getItem(MODEL_PREVIEW_KEY) || 'null');

    if (savedPreview?.slug === slug) {
      setModel(savedPreview);
      return;
    }

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
          <Link to={`${ROUTES.ADMIN}?tab=models`} className="profile-back">Back To Admin</Link>
        </div>
      </MainLayout>
    );
  }

  if (!model) return null;

  const portfolioImages = (model.portfolio || []).filter((src) => src && src !== model.coverImage);

  return (
    <MainLayout>
      <div className="admin-preview-bar">
        <span>Unsaved Preview</span>
        <Link to={`/admin/models/${slug}/edit`}>Back To Edit</Link>
      </div>

      <div className="profile-page">
        <header className="profile-header">
          <p className="profile-agency">{model.agency}</p>
          <h1 className="profile-name">{model.name}</h1>
          <p className="profile-location">Based in {model.basedIn}</p>
        </header>

        <div className="profile-divider" />

        <div className="profile-body">
          <aside className="profile-stats">
            {Object.entries(STAT_LABELS).map(([key, label]) => (
              model.stats?.[key] ? (
                <div key={key} className="profile-stat-row">
                  <span className="profile-stat-label">{label}</span>
                  <span className="profile-stat-value">{model.stats[key]}</span>
                </div>
              ) : null
            ))}
          </aside>

          <div className="profile-hero-wrap">
            {model.coverImage && (
              <img src={model.coverImage} alt={model.name} className="profile-hero-img" />
            )}
          </div>
        </div>

        {model.runwayShows?.length > 0 && (
          <section className="profile-section">
            <div className="profile-section-header">
              <span className="profile-section-tag">Runway</span>
              <div className="profile-section-line" />
            </div>
            <ul className="profile-shows-list">
              {model.runwayShows.map((show, index) => (
                <li key={`${show.name}-${show.season}-${index}`} className="profile-show-item">
                  <span className="profile-show-name">{show.name}</span>
                  <span className="profile-show-season">{show.season}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {portfolioImages.length > 0 && (
          <section className="profile-section">
            <div className="profile-section-header">
              <span className="profile-section-tag">Photography</span>
              <div className="profile-section-line" />
            </div>
            <div className="profile-portfolio-grid">
              {portfolioImages.map((src, index) => (
                <div key={`${src}-${index}`} className="profile-portfolio-item">
                  <img src={src} alt={`${model.name} ${index + 1}`} className="profile-portfolio-img" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminModelPreviewPage;


