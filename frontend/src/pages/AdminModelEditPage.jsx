import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { auth } from '../firebase';
import { ROUTES } from '../constants';
import { getAdminModels, saveAdminModels } from '../services/modelsService';
import { clearAdminModelEditDraft, getAdminModelEditDraft, setAdminModelEditDraft } from '../services/adminModelDraftStore';
import { imageFileToCompressedDataUrl } from '../utils/imageCompression';
import arrowLeft from '../assets/images/arrow-left.svg';
import './AdminModelEditPage.css';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];
const MODEL_PREVIEW_KEY = 'noblesAdminModelPreview';
const emptyForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  division: 'international',
  location: '',
  basedIn: '',
  height: '',
  bust: '',
  waist: '',
  hips: '',
  shoeSize: '',
  hairColor: '',
  eyeColor: '',
  quote: '',
  images: [],
  mainImageIndex: 0,
  photoFileName: '',
  runwayShows: [],
  runwayName: '',
  runwaySeason: '',
  showOnModelsPage: true,
};

const MODEL_DIVISIONS = [
  { value: 'international', label: 'International' },
  { value: 'local', label: 'Local' },
  { value: 'junior', label: 'Junior' },
  { value: 'capcon', label: 'CapCon' },
];

const applyCapConDefaults = (form) => (
  form.division === 'capcon'
    ? { ...form, location: 'Canada', basedIn: 'Calgary' }
    : form
);

const splitModelName = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
};

const buildModelName = ({ firstName, middleName, lastName }) => (
  [firstName, middleName, lastName].filter(Boolean).join(' ').trim()
);

const getUniqueImages = (model) => {
  const images = [model.coverImage, ...(model.portfolio || [])].filter(Boolean);
  return [...new Set(images)];
};

const normalizeRunwayShow = (show) => {
  if (typeof show === 'string') {
    return { name: show, season: '' };
  }

  return {
    name: show?.name || show?.show || show?.title || '',
    season: show?.season || show?.year || show?.date || '',
  };
};

const normalizeModelForm = (form) => applyCapConDefaults({
  ...emptyForm,
  ...form,
  images: Array.isArray(form?.images) ? form.images : [],
  mainImageIndex: Number.isInteger(form?.mainImageIndex) ? form.mainImageIndex : 0,
  runwayShows: Array.isArray(form?.runwayShows) ? form.runwayShows.map(normalizeRunwayShow) : [],
  runwayName: form?.runwayName || '',
  runwaySeason: form?.runwaySeason || '',
  quote: form?.quote || '',
});

const modelToForm = (model) => {
  const images = getUniqueImages(model);
  const coverIndex = Math.max(0, images.findIndex((src) => src === model.coverImage));

  return normalizeModelForm({
    ...emptyForm,
    ...splitModelName(model.name),
    division: model.division || 'international',
    location: model.location || '',
    basedIn: model.basedIn || '',
    height: model.stats?.height || '',
    bust: model.stats?.bust || '',
    waist: model.stats?.waist || '',
    hips: model.stats?.hips || '',
    shoeSize: model.stats?.shoeSize || '',
    hairColor: model.stats?.hairColor || '',
    eyeColor: model.stats?.eyeColor || '',
    quote: model.quote || '',
    images,
    mainImageIndex: coverIndex,
    photoFileName: images.length ? `${images.length} current image${images.length === 1 ? '' : 's'}` : '',
    runwayShows: model.runwayShows || model.runway || model.shows || [],
    showOnModelsPage: model.showOnModelsPage !== false,
  });
};

const formToModel = (form, originalModel) => {
  const name = buildModelName(form);
  const mainImage = form.images[form.mainImageIndex] || form.images[0] || '';
  const portfolioImages = form.images.filter((src) => src && src !== mainImage);
  const isCapCon = form.division === 'capcon';
  return {
    ...originalModel,
    name,
    division: form.division,
    location: isCapCon ? 'Canada' : form.location,
    basedIn: isCapCon ? 'Calgary' : form.basedIn,
    agency: originalModel.agency || 'The Nobles Management',
    coverImage: mainImage,
    portfolio: portfolioImages,
    quote: isCapCon ? form.quote : '',
    stats: isCapCon ? {} : {
      height: form.height,
      bust: form.bust,
      waist: form.waist,
      hips: form.hips,
      shoeSize: form.shoeSize,
      hairColor: form.hairColor,
      eyeColor: form.eyeColor,
    },
    bio: originalModel.bio || null,
    instagramHandle: originalModel.instagramHandle || null,
    runwayShows: (form.runwayShows || []).map(normalizeRunwayShow).filter((show) => show.name || show.season),
    featured: originalModel.featured || false,
    showOnModelsPage: form.showOnModelsPage,
  };
};

// Lets admins edit one model on its own page before saving it back to local admin content.
const AdminModelEditPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [models, setModels] = useState([]);
  const [originalModel, setOriginalModel] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notFound, setNotFound] = useState(false);
  const [largeImage, setLargeImage] = useState(null);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(ADMIN_EMAILS.includes(user?.email?.toLowerCase() || ''));
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady || !isAdmin) return;

    getAdminModels().then((records) => {
      const model = records.find((item) => item.slug === slug);
      setModels(records);

      if (!model) {
        setNotFound(true);
        return;
      }

      const savedDraft = getAdminModelEditDraft();
      setOriginalModel(model);
      setForm(savedDraft?.slug === slug ? normalizeModelForm(savedDraft.form) : modelToForm(model));
    });
  }, [authReady, isAdmin, slug]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      return applyCapConDefaults(next);
    });
  };

  const handlePhotoChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const newImages = await Promise.all(
      selectedFiles.map((file) => imageFileToCompressedDataUrl(file))
    );
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
      mainImageIndex: prev.images.length ? prev.mainImageIndex : 0,
      photoFileName: `${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'} added`,
    }));
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
      const nextImages = prev.images.filter((_, imageIndex) => imageIndex !== index);
      const nextMainIndex = Math.min(prev.mainImageIndex, Math.max(0, nextImages.length - 1));

      return {
        ...prev,
        images: nextImages,
        mainImageIndex: index === prev.mainImageIndex ? 0 : nextMainIndex,
      };
    });
  };

  const addRunwayShow = (e) => {
    e?.preventDefault();
    const name = form.runwayName.trim();
    const season = form.runwaySeason.trim();
    if (!name && !season) return;

    setForm((prev) => ({
      ...prev,
      runwayShows: [...(prev.runwayShows || []), { name, season }],
      runwayName: '',
      runwaySeason: '',
    }));
  };

  const removeRunwayShow = (index) => {
    setForm((prev) => ({
      ...prev,
      runwayShows: (prev.runwayShows || []).filter((_, showIndex) => showIndex !== index),
    }));
  };

  const saveModel = async (e) => {
    e.preventDefault();
    if (!originalModel) return;

    const updatedModel = formToModel(form, originalModel);
    const nextModels = models.map((model) => (model.slug === slug ? updatedModel : model));
    await saveAdminModels(nextModels);
    sessionStorage.removeItem(MODEL_PREVIEW_KEY);
    clearAdminModelEditDraft();
    navigate(`${ROUTES.ADMIN}?tab=models`);
  };

  const previewModel = () => {
    if (!originalModel) return;
    const preview = formToModel(form, originalModel);
    sessionStorage.setItem(MODEL_PREVIEW_KEY, JSON.stringify(preview));
    navigate(`/admin/models/${slug}/preview`);
  };

  const openImagesPage = () => {
    setAdminModelEditDraft({ slug, form });
    navigate(`/admin/models/${slug}/images`);
  };

  if (!authReady) {
    return (
      <MainLayout>
        <main className="admin-model-edit-page admin-model-edit-centered">
          <section className="admin-model-edit-access">
            <p>Admin</p>
            <h1>Loading</h1>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <main className="admin-model-edit-page admin-model-edit-centered">
          <section className="admin-model-edit-access">
            <p>Admin</p>
            <h1>Access Required</h1>
            <span>Log in with an admin account to edit models.</span>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (notFound) {
    return (
      <MainLayout>
        <main className="admin-model-edit-page admin-model-edit-centered">
          <section className="admin-model-edit-access">
            <p>Admin</p>
            <h1>Model Not Found</h1>
            <Link to={`${ROUTES.ADMIN}?tab=models`}>Back To Admin</Link>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (!originalModel) return null;

  const hasHiddenImages = form.images.length > 1;
  const visibleImages = hasHiddenImages ? [form.images[form.mainImageIndex] || form.images[0]] : form.images;
  const hiddenImageCount = Math.max(0, form.images.length - 1);
  const isCapConForm = form.division === 'capcon';

  return (
    <MainLayout>
      <main className="admin-model-edit-page">
        <header className="admin-model-edit-header">
          <p>Admin / Models</p>
          <div className="admin-model-edit-title-row">
            <Link to={`${ROUTES.ADMIN}?tab=models`} className="admin-model-edit-back" aria-label="Back to admin"><img src={arrowLeft} alt="" /></Link>
            <h1>Edit Model</h1>
          </div>
          <span>{originalModel.name}</span>
        </header>

        <form className="admin-model-edit-layout" onSubmit={saveModel}>
          <aside className="admin-model-image-panel" aria-label="Model images">
            <div className="admin-model-image-panel-header">
              <span>Images</span>
              <label className="admin-image-add-btn">
                Add
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
              </label>
            </div>
            <span className="upload-filename">{form.photoFileName || 'No file chosen'}</span>
            <div className={`admin-model-thumbs${hasHiddenImages ? ' admin-model-thumbs-compact' : ''}`}>
              {form.images.length > 0 ? (
                <>
                  {visibleImages.map((src, index) => (
                    <div
                      className={`admin-model-thumb${hasHiddenImages || index === form.mainImageIndex ? ' admin-model-thumb-main' : ''}`}
                      key={`${src}-${index}`}
                    >
                      <button type="button" className="admin-model-thumb-image" onClick={() => setLargeImage(src)}>
                        <img src={src} alt={`${buildModelName(form) || 'Model'} ${index + 1}`} />
                      </button>
                      <div className="admin-model-thumb-actions">
                        <button type="button" onClick={() => setMainImage(index)}>{index === form.mainImageIndex ? 'Main' : 'Set Main'}</button>
                        <button type="button" onClick={() => removeImage(index)}>Remove</button>
                      </div>
                    </div>
                  ))}
                  {hasHiddenImages && (
                    <button
                      type="button"
                      className="admin-model-thumb admin-model-thumb-overflow"
                      onClick={openImagesPage}
                    >
                      <span>+{hiddenImageCount}</span>
                    </button>
                  )}
                </>
              ) : (
                <p className="admin-model-image-empty">No images added.</p>
              )}
            </div>
          </aside>

          <div className="admin-model-edit-form">
            <div className="admin-name-grid">
              <label className="admin-field"><span>First Name</span><input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} required /></label>
              <label className="admin-field"><span>Middle</span><input name="middleName" placeholder="Middle" value={form.middleName} onChange={handleChange} /></label>
              <label className="admin-field"><span>Last Name</span><input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} required /></label>
            </div>
            <label className="admin-field"><span>Division</span><select name="division" value={form.division} onChange={handleChange}>
              {MODEL_DIVISIONS.map((division) => (
                <option value={division.value} key={division.value}>{division.label}</option>
              ))}
            </select></label>
            <label className="admin-field"><span>Location</span><input name="location" placeholder="Location" value={form.location} onChange={handleChange} disabled={isCapConForm} /></label>
            <label className="admin-field"><span>Based In</span><input name="basedIn" placeholder="Based in" value={form.basedIn} onChange={handleChange} disabled={isCapConForm} /></label>
            {isCapConForm ? (
              <label className="admin-field"><span>Quote</span><textarea name="quote" placeholder="Quote" value={form.quote} onChange={handleChange} /></label>
            ) : (
              <div className="admin-form-grid">
                <label className="admin-field"><span>Height</span><input name="height" placeholder="Height" value={form.height} onChange={handleChange} /></label>
                <label className="admin-field"><span>Bust</span><input name="bust" placeholder="Bust" value={form.bust} onChange={handleChange} /></label>
                <label className="admin-field"><span>Waist</span><input name="waist" placeholder="Waist" value={form.waist} onChange={handleChange} /></label>
                <label className="admin-field"><span>Hips</span><input name="hips" placeholder="Hips" value={form.hips} onChange={handleChange} /></label>
                <label className="admin-field"><span>Shoe</span><input name="shoeSize" placeholder="Shoe" value={form.shoeSize} onChange={handleChange} /></label>
                <label className="admin-field"><span>Hair</span><input name="hairColor" placeholder="Hair" value={form.hairColor} onChange={handleChange} /></label>
                <label className="admin-field"><span>Eyes</span><input name="eyeColor" placeholder="Eyes" value={form.eyeColor} onChange={handleChange} /></label>
              </div>
            )}

            <section className="admin-runway-editor">
              <div className="admin-runway-header">Runway Shows</div>
              <div className="admin-runway-inputs">
                <label className="admin-field"><span>Show Name</span><input name="runwayName" placeholder="Show name" value={form.runwayName} onChange={handleChange} /></label>
                <label className="admin-field"><span>Season</span><input name="runwaySeason" placeholder="Season" value={form.runwaySeason} onChange={handleChange} /></label>
                <button type="button" onClick={addRunwayShow}>Add Show</button>
              </div>
              <div className="admin-runway-list">
                {form.runwayShows.length > 0 ? form.runwayShows.map((show, index) => (
                  <div className="admin-runway-item" key={`${show.name}-${show.season}-${index}`}>
                    <span>{show.name || 'Untitled show'}</span>
                    <span>{show.season || 'No season'}</span>
                    <button type="button" onClick={() => removeRunwayShow(index)}>Remove</button>
                  </div>
                )) : (
                  <p>No runway shows added.</p>
                )}
              </div>
            </section>

            <label className="admin-toggle-row">
              <input type="checkbox" name="showOnModelsPage" checked={form.showOnModelsPage} onChange={handleChange} />
              <span>Show on models page</span>
            </label>
            <div className="admin-model-edit-actions">
              <button type="submit">Save Model</button>
              <button type="button" onClick={previewModel}>Preview Page</button>
              <Link to={`${ROUTES.ADMIN}?tab=models`}>Back</Link>
            </div>
          </div>
        </form>

        {largeImage && (
          <button type="button" className="admin-image-lightbox" onClick={() => setLargeImage(null)} aria-label="Close image preview">
            <img src={largeImage} alt="Selected model preview" />
          </button>
        )}
      </main>
    </MainLayout>
  );
};

export default AdminModelEditPage;



