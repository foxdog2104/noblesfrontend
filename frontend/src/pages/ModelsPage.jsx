import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import ModelCard from '../components/ModelCard';
import { getModelsByDivision } from '../services/modelsService';
import './ModelsPage.css';

const getUniqueOptions = (items) => (
  [...new Set(items.filter(Boolean))]
    .sort((first, second) => first.localeCompare(second))
);

const DIVISION_MODEL_LIMITS = {
  capcon: 20,
};

const parseHeightInches = (value = '') => {
  const text = String(value).trim();
  const feetInches = text.match(/(\d+)\s*'\s*(\d+)?/);

  if (feetInches) {
    return Number(feetInches[1]) * 12 + Number(feetInches[2] || 0);
  }

  const centimeters = text.match(/^(\d+(?:\.\d+)?)\s*cm$/i);

  if (centimeters) {
    return Number(centimeters[1]) / 2.54;
  }

  const inches = text.match(/^(\d+(?:\.\d+)?)\s*(?:in|")?$/i);

  if (inches) {
    return Number(inches[1]);
  }

  return null;
};

// Displays models for one category and filters them using the search input.
const ModelsPage = ({ category = 'International' }) => {
  const [models, setModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [heightFilter, setHeightFilter] = useState('');
  const [hairFilter, setHairFilter] = useState('');
  const [eyeFilter, setEyeFilter] = useState('');

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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const locationOptions = getUniqueOptions(
    models.map((model) => model.basedIn || model.location)
  );
  const hairOptions = getUniqueOptions(
    models.map((model) => model.stats?.hairColor)
  );
  const eyeOptions = getUniqueOptions(
    models.map((model) => model.stats?.eyeColor)
  );

  const matchesHeightFilter = (model) => {
    if (!heightFilter) return true;

    const height = parseHeightInches(model.stats?.height);

    if (!height) return false;
    if (heightFilter === 'under-5-7') return height < 67;
    if (heightFilter === '5-7-to-5-9') return height >= 67 && height <= 69;
    if (heightFilter === '5-10-plus') return height >= 70;

    return true;
  };

  const matchingModels = models.filter((model) => (
    (
      !normalizedSearch
      || model.name?.toLowerCase().includes(normalizedSearch)
      || model.location?.toLowerCase().includes(normalizedSearch)
      || model.basedIn?.toLowerCase().includes(normalizedSearch)
    )
    && (!locationFilter || (model.basedIn || model.location) === locationFilter)
    && (!hairFilter || model.stats?.hairColor === hairFilter)
    && (!eyeFilter || model.stats?.eyeColor === eyeFilter)
    && matchesHeightFilter(model)
  ));
  const divisionLimit = DIVISION_MODEL_LIMITS[category.toLowerCase()];
  const visibleModels = divisionLimit ? matchingModels.slice(0, divisionLimit) : matchingModels;

  const hasActiveFilters = searchTerm
    || locationFilter
    || heightFilter
    || hairFilter
    || eyeFilter;

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setHeightFilter('');
    setHairFilter('');
    setEyeFilter('');
  };

  return (
    <MainLayout>
      <div className="models-page">

        <div className="models-header">
          <h1 className="models-title">{category}</h1>
          <div className="models-controls" aria-label="Filter models">
            <input
              type="text"
              className="models-search"
              placeholder="Search name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search models by name or location"
            />
            <select
              className="models-filter"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              aria-label="Filter models by location"
            >
              <option value="">All locations</option>
              {locationOptions.map((location) => (
                <option value={location} key={location}>{location}</option>
              ))}
            </select>
            <select
              className="models-filter"
              value={heightFilter}
              onChange={(e) => setHeightFilter(e.target.value)}
              aria-label="Filter models by height"
            >
              <option value="">All heights</option>
              <option value="under-5-7">Under 5'7"</option>
              <option value="5-7-to-5-9">5'7" to 5'9"</option>
              <option value="5-10-plus">5'10" plus</option>
            </select>
            <select
              className="models-filter"
              value={hairFilter}
              onChange={(e) => setHairFilter(e.target.value)}
              aria-label="Filter models by hair color"
            >
              <option value="">All hair</option>
              {hairOptions.map((hair) => (
                <option value={hair} key={hair}>{hair}</option>
              ))}
            </select>
            <select
              className="models-filter"
              value={eyeFilter}
              onChange={(e) => setEyeFilter(e.target.value)}
              aria-label="Filter models by eye color"
            >
              <option value="">All eyes</option>
              {eyeOptions.map((eyes) => (
                <option value={eyes} key={eyes}>{eyes}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                className="models-clear-filter"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="models-grid">
          {visibleModels.length > 0 ? (
            visibleModels.map((model) => (
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
