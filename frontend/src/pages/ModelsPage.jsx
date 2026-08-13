import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import ModelCard from '../components/ModelCard';
import { getModelsByDivision } from '../services/modelsService';
import './ModelsPage.css';

// Displays models for one category and filters them using the search input.
const ModelsPage = ({ category = 'International' }) => {
  const [models, setModels] = useState([]);

  useEffect(() => {
    const loadModels = async () => {
    try {
      const nextModels = await getModelsByDivision(category);
      setModels(nextModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    }};

  loadModels();

  window.addEventListener(
    'nobles-admin-content-change',
    loadModels
  );

  return () => {
    window.removeEventListener(
      'nobles-admin-content-change',
      loadModels
    );
  };  
}, [category]);

  return (
    <MainLayout>
      <div className="models-page">

        <div className="models-header">
          <h1 className="models-title">{category}</h1>
        </div>

        <div className="models-grid">
          {models.length > 0 ? (
            models.map((model) => (
              <ModelCard key={model.slug} model={model} />
            ))
          ) : (
            <p className="models-empty">No models found.</p>
          )}
        </div>

      </div>
    </MainLayout>
  );
};

export default ModelsPage;
