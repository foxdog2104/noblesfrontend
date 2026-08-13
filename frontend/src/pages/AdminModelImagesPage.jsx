import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { ROUTES } from '../constants';
import { getAdminModels } from '../services/modelsService';
import { getAdminModelEditDraft, setAdminModelEditDraft } from '../services/adminModelDraftStore';
import arrowLeft from '../assets/images/arrow-left.svg';
import './AdminModelImagesPage.css';

const getUniqueImages = (model) => {
  const images = [model.coverImage, ...(model.portfolio || [])].filter(Boolean);
  return [...new Set(images)];
};

const modelToImageForm = (model) => {
  const images = getUniqueImages(model);
  const coverIndex = Math.max(0, images.findIndex((src) => src === model.coverImage));

  return {
    images,
    mainImageIndex: coverIndex,
  };
};

// Displays every image for one admin model and lets admins reorder the draft before returning to edit.
const AdminModelImagesPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ images: [], mainImageIndex: 0 });
  const [modelName, setModelName] = useState('Model Images');
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const savedDraft = getAdminModelEditDraft();

    if (savedDraft?.slug === slug) {
      setForm(savedDraft.form);
      setModelName(`${savedDraft.form.firstName || ''} ${savedDraft.form.lastName || ''}`.trim() || 'Model Images');
      return;
    }

    getAdminModels().then((records) => {
      const model = records.find((item) => item.slug === slug);
      if (!model) {
        setNotFound(true);
        return;
      }

      setForm((prev) => ({ ...prev, ...modelToImageForm(model) }));
      setModelName(model.name || 'Model Images');
    });
  }, [slug]);

  const persistAndBack = (nextForm = form) => {
    const savedDraft = getAdminModelEditDraft();
    setAdminModelEditDraft({
      slug,
      form: savedDraft?.slug === slug ? { ...savedDraft.form, ...nextForm } : nextForm,
    });
    navigate(`/admin/models/${slug}/edit`);
  };

  const setMainImage = (index) => {
    setForm((prev) => {
      if (index === prev.mainImageIndex) return prev;

      const selectedImage = prev.images[index];
      const currentMainImage = prev.images[prev.mainImageIndex];
      const remainingImages = prev.images.filter((_, imageIndex) => (
        imageIndex !== index && imageIndex !== prev.mainImageIndex
      ));

      return {
        ...prev,
        images: [selectedImage, currentMainImage, ...remainingImages].filter(Boolean),
        mainImageIndex: 0,
      };
    });
  };

  const removeImage = (index) => {
    setForm((prev) => {
      const images = prev.images.filter((_, imageIndex) => imageIndex !== index);
      const mainImage = prev.images[prev.mainImageIndex];
      const mainImageIndex = Math.max(0, images.findIndex((src) => src === mainImage));

      return {
        ...prev,
        images,
        mainImageIndex: index === prev.mainImageIndex ? 0 : mainImageIndex,
      };
    });
  };

  const moveImage = (fromIndex, toIndex) => {
    if (
      fromIndex === null
      || fromIndex === toIndex
      || fromIndex === form.mainImageIndex
      || toIndex === form.mainImageIndex
    ) return;

    setForm((prev) => {
      const images = [...prev.images];
      const [movedImage] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, movedImage);
      const mainImage = prev.images[prev.mainImageIndex];
      const mainImageIndex = Math.max(0, images.findIndex((src) => src === mainImage));

      return { ...prev, images, mainImageIndex };
    });
  };

  const handleDrop = (index) => {
    if (index === form.mainImageIndex) {
      setDraggedImageIndex(null);
      setDragOverImageIndex(null);
      return;
    }

    moveImage(draggedImageIndex, index);
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  const getImageCardClassName = (index) => [
    'admin-model-image-card',
    index === form.mainImageIndex ? 'admin-model-image-card-main admin-model-image-card-locked' : '',
    index === draggedImageIndex ? 'admin-model-image-card-dragging' : '',
    index === dragOverImageIndex && index !== draggedImageIndex ? 'admin-model-image-card-drop-target' : '',
  ].filter(Boolean).join(' ');

  if (notFound) {
    return (
      <MainLayout>
        <main className="admin-model-images-page admin-model-images-centered">
          <Link to={`${ROUTES.ADMIN}?tab=models`} className="admin-model-images-back" aria-label="Back to admin"><img src={arrowLeft} alt="" /></Link>
          <section className="admin-model-images-empty">
            <p>Admin / Models</p>
            <h1>Model Not Found</h1>
          </section>
        </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="admin-model-images-page">
        <button type="button" className="admin-model-images-back" onClick={() => persistAndBack()} aria-label="Back to edit model">
          <img src={arrowLeft} alt="" />
        </button>

        <header className="admin-model-images-header">
          <p>Admin / Model Images</p>
          <h1>{modelName}</h1>
          <span>Drag images into the order you want. The main image is used on the model card.</span>
        </header>

        <section className="admin-model-images-grid" aria-label="All model images">
          {form.images.length > 0 ? form.images.map((src, index) => (
            <article
              className={getImageCardClassName(index)}
              draggable={index !== form.mainImageIndex}
              onDragStart={(e) => {
                if (index === form.mainImageIndex) {
                  e.preventDefault();
                  return;
                }

                e.dataTransfer.effectAllowed = 'move';
                setDraggedImageIndex(index);
              }}
              onDragOver={(e) => {
                if (index === form.mainImageIndex) return;

                e.preventDefault();
                setDragOverImageIndex(index);
              }}
              onDrop={() => handleDrop(index)}
              onDragLeave={() => setDragOverImageIndex((current) => (current === index ? null : current))}
              onDragEnd={() => {
                setDraggedImageIndex(null);
                setDragOverImageIndex(null);
              }}
              key={`${src}-${index}`}
            >
              <img src={src} alt={`${modelName} ${index + 1}`} />
              <div className="admin-model-image-card-actions">
                <button type="button" onClick={() => setMainImage(index)}>{index === form.mainImageIndex ? 'Main' : 'Set Main'}</button>
                <button type="button" onClick={() => setViewImage(src)}>View</button>
                <button type="button" onClick={() => removeImage(index)}>Remove</button>
              </div>
            </article>
          )) : (
            <p className="admin-model-images-none">No images added.</p>
          )}
        </section>

        <div className="admin-model-images-actions">
          <button type="button" onClick={() => persistAndBack()}>Back To Edit</button>
        </div>

        {viewImage && (
          <button type="button" className="admin-model-image-lightbox" onClick={() => setViewImage(null)} aria-label="Close image preview">
            <img src={viewImage} alt="Selected model" />
          </button>
        )}
      </main>
    </MainLayout>
  );
};

export default AdminModelImagesPage;


