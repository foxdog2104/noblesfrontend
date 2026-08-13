import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { deleteScoutSubmission, getContactSubmissions, getScoutSubmissions } from '../services/adminService';
import { getAdminArticles, saveAdminArticles } from '../services/articlesService';
import { getAdminModels, saveAdminModels } from '../services/modelsService';
import getScoutedDemoPhoto from '../assets/images/get-scouted-bg.png';
import { uploadToAzureBlob } from '../services/azureStorageService';
import './AdminPage.css';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];
const TABS = [
  { id: 'articles', label: 'Articles' },
  { id: 'models', label: 'Models' },
  { id: 'contact', label: 'Contact Messages' },
  { id: 'scouted', label: 'Get Scouted' },
  { id: 'accounts', label: 'Accounts' },
];

const emptyArticle = { title: '', author: '', dateWritten: '', content: '', cover: '', coverFileName: '', showOnArticlesPage: true };
const emptyModel = {
  firstName: '',
  middleName: '',
  lastName: '',
  name: '',
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
  coverImage: '',
  photoFileName: '',
  showOnModelsPage: true,
};

const demoContactSubmission = {
  id: 'demo-contact-message',
  name: 'Ava Example',
  email: 'ava.example@email.com',
  subject: 'Booking Inquiry',
  message: 'Hello, I would like to ask about booking a model for an upcoming creative project in Calgary.',
  submittedAt: new Date('2026-08-01T11:15:00'),
};
const demoScoutSubmission = {
  id: 'demo-get-scouted-submission',
  firstName: 'Mia',
  lastName: 'Example',
  email: 'mia.example@email.com',
  phone: '(403) 555-0198',
  countryOfResidence: 'Canada',
  dateOfBirth: '2006-04-18',
  gender: 'Female',
  instagramHandle: '@miaexample',
  isCurrentlyModel: 'No',
  height: '173',
  bustChest: '82',
  waist: '64',
  hips: '90',
  shoeSize: '39',
  hairColor: 'Brown',
  eyeColor: 'Hazel',
  submittedAt: new Date('2026-08-01T10:30:00'),
  photoUrl: getScoutedDemoPhoto,
};
const demoAccount = {
  id: 'demo-account',
  firstName: 'Nobles',
  lastName: 'Admin',
  email: 'noblesadmintest@gmail.com',
  phoneNumber: '(403) 555-0124',
  createdAt: new Date('2026-08-01T09:00:00'),
};

const makeSlug = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const formatDate = (value) => {
  if (!value) return 'No date';
  if (value.toDate) return value.toDate().toLocaleString();
  if (value.seconds) return new Date(value.seconds * 1000).toLocaleString();
  return String(value);
};

const buildModelName = ({ firstName, middleName, lastName, name = '' }) => (
  [firstName, middleName, lastName].filter(Boolean).join(' ').trim() || name.trim()
);


// Gives the temporary admin account a dashboard for adding/removing frontend content.
const AdminPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const startingTab = TABS.some((tab) => tab.id === requestedTab) ? requestedTab : 'articles';
  const [activeTab, setActiveTab] = useState(startingTab);
  const [articles, setArticles] = useState([]);
  const [models, setModels] = useState([]);
  const [articleForm, setArticleForm] = useState(emptyArticle);
  const [modelForm, setModelForm] = useState(emptyModel);
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [adminModelDivisionFilter, setAdminModelDivisionFilter] = useState('international');
  const [draggedAdminCard, setDraggedAdminCard] = useState(null);
  const [dragOverAdminCard, setDragOverAdminCard] = useState(null);
  const [contactSubmissions, setContactSubmissions] = useState([]);
  const [scoutSubmissions, setScoutSubmissions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [scoutDetailedView, setScoutDetailedView] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();
  const currentEmail = authUser?.email?.toLowerCase() || '';
  const isAdmin = ADMIN_EMAILS.includes(currentEmail);
  const normalizedArticleSearch = articleSearchTerm.trim().toLowerCase();
  const normalizedModelSearch = modelSearchTerm.trim().toLowerCase();
  const normalizedAccountSearch = accountSearchTerm.trim().toLowerCase();
  const visibleAdminArticles = articles.filter((article) => (
    !normalizedArticleSearch
    || article.title?.toLowerCase().includes(normalizedArticleSearch)
    || article.author?.toLowerCase().includes(normalizedArticleSearch)
    || article.content?.toLowerCase().includes(normalizedArticleSearch)
  ));
  const visibleAdminModels = models.filter((model) => (
    model.division === adminModelDivisionFilter
    && (
      !normalizedModelSearch
      || model.name?.toLowerCase().includes(normalizedModelSearch)
      || model.location?.toLowerCase().includes(normalizedModelSearch)
      || model.basedIn?.toLowerCase().includes(normalizedModelSearch)
    )
  ));
  const displayedContactSubmissions = contactSubmissions.length > 0 ? contactSubmissions : [demoContactSubmission];
  const displayedScoutSubmissions = scoutSubmissions.length > 0 ? scoutSubmissions : [demoScoutSubmission];
  const displayedAccounts = accounts.length > 0 ? accounts : [demoAccount];
  const visibleAccounts = displayedAccounts.filter((account) => (
    !normalizedAccountSearch
    || account.email?.toLowerCase().includes(normalizedAccountSearch)
    || account.firstName?.toLowerCase().includes(normalizedAccountSearch)
    || account.lastName?.toLowerCase().includes(normalizedAccountSearch)
    || account.phoneNumber?.toLowerCase().includes(normalizedAccountSearch)
  ));

  useEffect(() => {
    if (TABS.some((tab) => tab.id === requestedTab) && requestedTab !== activeTab) {
      setActiveTab(requestedTab);
    }
  }, [activeTab, requestedTab]);

  const openAdminTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'articles' ? {} : { tab: tabId });
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    getAdminArticles().then(setArticles);
    getAdminModels().then(setModels);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadAccounts = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setAccounts(snap.docs.map((accountDoc) => ({
          id: accountDoc.id,
          ...accountDoc.data(),
        })));
      } catch (error) {
        setSubmissionError(error.message);
      }
    };

    loadAccounts();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadSubmissions = async () => {
      setLoadingSubmissions(true);
      setSubmissionError('');

      try {
        const [contactRecords, scoutRecords] = await Promise.all([
          getContactSubmissions(),
          getScoutSubmissions(),
        ]);
        setContactSubmissions(contactRecords);
        setScoutSubmissions(scoutRecords);
      } catch (error) {
        setSubmissionError(error.message);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    loadSubmissions();
  }, [isAdmin]);

  const handleDeleteScout = async (id) => {
    if (!window.confirm('Delete this submission? This cannot be undone.')) return;
    await deleteScoutSubmission(id);
    setScoutSubmissions((prev) => prev.filter((s) => s.id !== id));
  };


  const handleArticleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setArticleForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleModelChange = (e) => {
    const { name, value, checked, type } = e.target;
    setModelForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

 const handleArticleCoverChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setSubmissionError('');

    const cover = await uploadToAzureBlob(file, 'articles');

    setArticleForm((prev) => ({
      ...prev,
      cover,
      coverFileName: file.name,
    }));
  } catch (error) {
    console.error(error);
    window.alert(error.message);
  }
};

  const handleModelPhotoChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setSubmissionError('');

    const coverImage = await uploadToAzureBlob(file, 'models');

    setModelForm((prev) => ({
      ...prev,
      coverImage,
      photoFileName: file.name,
    }));
  } catch (error) {
    console.error(error);
    window.alert(error.message);
  }
};

  const addArticle = async (e) => {
    e.preventDefault();
    const slug = makeSlug(articleForm.title);
    if (!slug) return;

    const nextArticle = {
      ...articleForm,
      slug,
      dateWritten: articleForm.dateWritten || new Date().toISOString().split('T')[0],
    };
    const nextArticles = [
      ...articles.filter((article) => article.slug !== slug),
      nextArticle,
    ];
    setArticles(nextArticles);
    await saveAdminArticles(nextArticles);
    setArticleForm(emptyArticle);
  };

  const removeArticle = async (slug) => {
    const nextArticles = articles.filter((article) => article.slug !== slug);
    setArticles(nextArticles);
    await saveAdminArticles(nextArticles);
  };

  const openArticleEditor = (article) => {
    navigate(`/admin/articles/${article.slug}/edit`);
  };

  const toggleArticleVisibility = async (slug) => {
    const nextArticles = articles.map((article) => (
      article.slug === slug
        ? { ...article, showOnArticlesPage: article.showOnArticlesPage === false }
        : article
    ));
    setArticles(nextArticles);
    await saveAdminArticles(nextArticles);
  };

  const addModel = async (e) => {
    e.preventDefault();
    const modelName = buildModelName(modelForm);
    const slug = makeSlug(modelName);
    if (!slug) return;

    const nextModel = {
      slug,
      name: modelName,
      division: modelForm.division,
      location: modelForm.location,
      basedIn: modelForm.basedIn,
      agency: 'The Nobles Management',
      coverImage: modelForm.coverImage,
      portfolio: modelForm.coverImage ? [modelForm.coverImage] : [],
      stats: {
        height: modelForm.height,
        bust: modelForm.bust,
        waist: modelForm.waist,
        hips: modelForm.hips,
        shoeSize: modelForm.shoeSize,
        hairColor: modelForm.hairColor,
        eyeColor: modelForm.eyeColor,
      },
      bio: null,
      instagramHandle: null,
      runwayShows: [],
      featured: false,
      showOnModelsPage: modelForm.showOnModelsPage,
    };
    const nextModels = [...models.filter((model) => model.slug !== slug), nextModel];
    setModels(nextModels);
    await saveAdminModels(nextModels);
    setModelForm(emptyModel);
  };

  const removeModel = async (slug) => {
    const nextModels = models.filter((model) => model.slug !== slug);
    setModels(nextModels);
    await saveAdminModels(nextModels);
};

  const openModelEditor = (model) => {
    navigate(`/admin/models/${model.slug}/edit`);
  };
  const toggleModelVisibility = async (slug) => {
    const nextModels = models.map((model) => (
      model.slug === slug
        ? { ...model, showOnModelsPage: model.showOnModelsPage === false }
        : model
    ));
    setModels(nextModels);
    await saveAdminModels(nextModels);
  };

  const moveAdminCard = async (type, fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === toIndex) return;

    if (type === 'articles') {
      const fromArticle = visibleAdminArticles[fromIndex];
      const toArticle = visibleAdminArticles[toIndex];
      const fromArticleIndex = articles.findIndex((article) => article.slug === fromArticle?.slug);
      const toArticleIndex = articles.findIndex((article) => article.slug === toArticle?.slug);

      if (fromArticleIndex < 0 || toArticleIndex < 0) return;

      const nextArticles = [...articles];
      const [movedArticle] = nextArticles.splice(fromArticleIndex, 1);
      const adjustedToIndex = fromArticleIndex < toArticleIndex ? toArticleIndex - 1 : toArticleIndex;
      nextArticles.splice(adjustedToIndex, 0, movedArticle);
      setArticles(nextArticles);
      await saveAdminArticles(nextArticles);
      return;
    }

    const fromModel = visibleAdminModels[fromIndex];
    const toModel = visibleAdminModels[toIndex];
    const fromModelIndex = models.findIndex((model) => model.slug === fromModel?.slug);
    const toModelIndex = models.findIndex((model) => model.slug === toModel?.slug);

    if (fromModelIndex < 0 || toModelIndex < 0) return;

    const nextModels = [...models];
    const [movedModel] = nextModels.splice(fromModelIndex, 1);
    const adjustedToIndex = fromModelIndex < toModelIndex ? toModelIndex - 1 : toModelIndex;
    nextModels.splice(adjustedToIndex, 0, movedModel);
    setModels(nextModels);
    await saveAdminModels(nextModels);
  };

  const handleAdminCardDragStart = (e, type, index) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAdminCard({ type, index });
  };

  const handleAdminCardDragOver = (e, type, index) => {
    if (draggedAdminCard?.type !== type) return;

    e.preventDefault();
    setDragOverAdminCard({ type, index });
  };

  const handleAdminCardDrop = (e, type, index) => {
    e.preventDefault();

    if (draggedAdminCard?.type === type) {
      moveAdminCard(type, draggedAdminCard.index, index);
    }

    setDraggedAdminCard(null);
    setDragOverAdminCard(null);
  };

  const clearAdminCardDrag = () => {
    setDraggedAdminCard(null);
    setDragOverAdminCard(null);
  };

  const getAdminCardClassName = (type, index, isHidden = false) => [
    'admin-model-card',
    isHidden ? 'admin-model-card-hidden' : '',
    draggedAdminCard?.type === type && draggedAdminCard.index === index ? 'admin-model-card-dragging' : '',
    dragOverAdminCard?.type === type && dragOverAdminCard.index === index && draggedAdminCard?.index !== index
      ? 'admin-model-card-drop-target'
      : '',
  ].filter(Boolean).join(' ');
  if (!authReady) {
    return (
      <MainLayout>
        <main className="admin-page admin-page-centered">
          <section className="admin-access-panel">
            <p>Admin</p>
            <h1>Loading</h1>
            <span>Checking your account...</span>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <main className="admin-page admin-page-centered">
          <section className="admin-access-panel">
            <p>Admin</p>
            <h1>Access Required</h1>
            <span>Log in with an admin account to view this page. Current account: {currentEmail || 'not logged in'}.</span>
          </section>
        </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="admin-page">
        <header className="admin-header">
          <p>Admin</p>
          <h1>Content Dashboard</h1>
        </header>

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          {TABS.map((tab) => (
            <button
              type="button"
              className={`admin-tab${activeTab === tab.id ? ' admin-tab-active' : ''}`}
              onClick={() => openAdminTab(tab.id)}
              key={tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'articles' && (
          <section className="admin-section">
            <form className="admin-form" onSubmit={addArticle}>
              <h2>Add Article</h2>
              <input name="title" placeholder="Title" value={articleForm.title} onChange={handleArticleChange} required />
              <input name="author" placeholder="Author" value={articleForm.author} onChange={handleArticleChange} required />
              <input type="date" name="dateWritten" value={articleForm.dateWritten} onChange={handleArticleChange} />
              <div className="admin-upload-field">
                <span className="admin-upload-title">Cover Image</span>
                <label className="upload-label-btn">
                  <span>Add a File</span>
                  <input type="file" accept="image/*" onChange={handleArticleCoverChange} />
                </label>
                <span className="upload-filename">{articleForm.coverFileName || 'No file chosen'}</span>
              </div>
              {articleForm.cover && <img src={articleForm.cover} alt="Article cover preview" className="admin-image-preview" />}
              <textarea name="content" placeholder="Article content" value={articleForm.content} onChange={handleArticleChange} required />
              <label className="admin-toggle-row">
                <input
                  type="checkbox"
                  name="showOnArticlesPage"
                  checked={articleForm.showOnArticlesPage}
                  onChange={handleArticleChange}
                />
                <span>Show on articles page</span>
              </label>
              <div className="admin-form-actions">
                <button type="submit">Add Article</button>
              </div>
            </form>

            <div className="admin-list admin-model-list">
              <h2>Added Articles</h2>
              <input
                type="text"
                className="admin-search"
                placeholder="Search articles"
                value={articleSearchTerm}
                onChange={(e) => setArticleSearchTerm(e.target.value)}
                aria-label="Search admin articles"
              />
              {visibleAdminArticles.length > 0 ? visibleAdminArticles.map((article, index) => (
                <article
                  className={getAdminCardClassName('articles', index, article.showOnArticlesPage === false)}
                  draggable
                  onDragStart={(e) => handleAdminCardDragStart(e, 'articles', index)}
                  onDragOver={(e) => handleAdminCardDragOver(e, 'articles', index)}
                  onDrop={(e) => handleAdminCardDrop(e, 'articles', index)}
                  onDragEnd={clearAdminCardDrag}
                  key={article.slug}
                  role="button"
                  tabIndex={0}
                  onClick={() => openArticleEditor(article)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openArticleEditor(article);
                    }
                  }}
                >
                  {article.cover ? (
                    <img src={article.cover} alt={article.title} className="admin-model-card-image" />
                  ) : (
                    <div className="admin-model-card-placeholder" />
                  )}
                  <div className="admin-model-card-body">
                    <h3>{article.title}</h3>
                    <p>{article.author} / {article.dateWritten}</p>
                    <label className="admin-model-toggle" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={article.showOnArticlesPage !== false}
                        onChange={() => toggleArticleVisibility(article.slug)}
                      />
                      <span>Show on articles page</span>
                    </label>
                    <div className="admin-model-actions">
                      <button type="button" onClick={(e) => { e.stopPropagation(); openArticleEditor(article); }}>Edit</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeArticle(article.slug); }}>Remove</button>
                    </div>
                  </div>
                </article>
              )) : <p className="admin-empty">No admin articles found.</p>}
            </div>
          </section>
        )}

        {activeTab === 'models' && (
          <section className="admin-section">
            <form className="admin-form" onSubmit={addModel}>
              <h2>Add Model</h2>

              <div className="admin-name-grid">
                <input name="firstName" placeholder="First name" value={modelForm.firstName} onChange={handleModelChange} required />
                <input name="middleName" placeholder="Middle" value={modelForm.middleName} onChange={handleModelChange} />
                <input name="lastName" placeholder="Last name" value={modelForm.lastName} onChange={handleModelChange} required />
              </div>
              <select name="division" value={modelForm.division} onChange={handleModelChange}>
                <option value="international">International</option>
                <option value="local">Local</option>
                <option value="junior">Junior</option>
              </select>
              <input name="location" placeholder="Location" value={modelForm.location} onChange={handleModelChange} />
              <input name="basedIn" placeholder="Based in" value={modelForm.basedIn} onChange={handleModelChange} />
              <div className="admin-upload-field">
                <span className="admin-upload-title">Model Photo</span>
                <label className="upload-label-btn">
                  <span>Add a File</span>
                  <input type="file" accept="image/*" onChange={handleModelPhotoChange} />
                </label>
                <span className="upload-filename">{modelForm.photoFileName || 'No file chosen'}</span>
              </div>
              {modelForm.coverImage && <img src={modelForm.coverImage} alt="Model preview" className="admin-image-preview" />}
              <div className="admin-form-grid">
                <input name="height" placeholder="Height" value={modelForm.height} onChange={handleModelChange} />
                <input name="bust" placeholder="Bust" value={modelForm.bust} onChange={handleModelChange} />
                <input name="waist" placeholder="Waist" value={modelForm.waist} onChange={handleModelChange} />
                <input name="hips" placeholder="Hips" value={modelForm.hips} onChange={handleModelChange} />
                <input name="shoeSize" placeholder="Shoe" value={modelForm.shoeSize} onChange={handleModelChange} />
                <input name="hairColor" placeholder="Hair" value={modelForm.hairColor} onChange={handleModelChange} />
                <input name="eyeColor" placeholder="Eyes" value={modelForm.eyeColor} onChange={handleModelChange} />
              </div>
              <label className="admin-toggle-row">
                <input
                  type="checkbox"
                  name="showOnModelsPage"
                  checked={modelForm.showOnModelsPage}
                  onChange={handleModelChange}
                />
                <span>Show on models page</span>
              </label>
              <div className="admin-form-actions">
                <button type="submit">Add Model</button>
              </div>
            </form>

            <div className="admin-list admin-model-list">
              <input
                type="text"
                className="admin-search"
                placeholder="Search models"
                value={modelSearchTerm}
                onChange={(e) => setModelSearchTerm(e.target.value)}
                aria-label="Search admin models"
              />
              <div className="admin-model-category-tabs" aria-label="Filter models by division">
                {['international', 'local', 'junior'].map((division) => (
                  <button
                    type="button"
                    className={adminModelDivisionFilter === division ? 'admin-model-category-tab admin-model-category-tab-active' : 'admin-model-category-tab'}
                    onClick={() => setAdminModelDivisionFilter(division)}
                    key={division}
                  >
                    {division === 'junior' ? 'Junior' : division.charAt(0).toUpperCase() + division.slice(1)}
                  </button>
                ))}
              </div>
              <h2>Added Models</h2>
              {visibleAdminModels.length > 0 ? visibleAdminModels.map((model, index) => (
                <article
                  className={getAdminCardClassName('models', index, model.showOnModelsPage === false)}
                  draggable
                  onDragStart={(e) => handleAdminCardDragStart(e, 'models', index)}
                  onDragOver={(e) => handleAdminCardDragOver(e, 'models', index)}
                  onDrop={(e) => handleAdminCardDrop(e, 'models', index)}
                  onDragEnd={clearAdminCardDrag}
                  key={model.slug}
                  role="button"
                  tabIndex={0}
                  onClick={() => openModelEditor(model)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openModelEditor(model);
                    }
                  }}
                >
                  {model.coverImage ? (
                    <img src={model.coverImage} alt={model.name} className="admin-model-card-image" />
                  ) : (
                    <div className="admin-model-card-placeholder" />
                  )}
                  <div className="admin-model-card-body">
                    <h3>{model.name}</h3>
                    <p>{model.division} / {model.location || 'No location'}</p>
                    <label className="admin-model-toggle" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={model.showOnModelsPage !== false}
                        onChange={() => toggleModelVisibility(model.slug)}
                      />
                      <span>Show on models page</span>
                    </label>
                    <div className="admin-model-actions">
                      <button type="button" onClick={(e) => { e.stopPropagation(); openModelEditor(model); }}>Edit</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeModel(model.slug); }}>Remove</button>
                    </div>
                  </div>
                </article>
              )) : <p className="admin-empty">No {adminModelDivisionFilter} models added yet.</p>}
            </div>
          </section>
        )}

        {activeTab === 'contact' && (
          <section className="admin-panel">
            <h2>Contact Messages</h2>
            {loadingSubmissions && <p className="admin-empty">Loading submissions...</p>}
            {submissionError && <p className="admin-error">{submissionError}</p>}
            {displayedContactSubmissions.length > 0 ? displayedContactSubmissions.map((submission) => (
              <article
                className="admin-submission"
                key={submission.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/admin/contact-messages/${submission.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/admin/contact-messages/${submission.id}`);
                  }
                }}
              >
                <h3>{submission.name}</h3>
                <p>{submission.email}</p>
                <p>{submission.subject || 'No subject'}</p>
                <span>{formatDate(submission.submittedAt)}</span>
                <p>{submission.message}</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/contact-messages/${submission.id}`); }}>View Message</button>
              </article>
            )) : !loadingSubmissions && <p className="admin-empty">No contact messages found.</p>}
          </section>
        )}

        {activeTab === 'accounts' && (
          <section className="admin-panel">
            <div className="admin-panel-header-row">
              <h2>Accounts ({visibleAccounts.length})</h2>
              <input
                type="text"
                className="admin-search admin-search-panel"
                placeholder="Search accounts"
                value={accountSearchTerm}
                onChange={(e) => setAccountSearchTerm(e.target.value)}
                aria-label="Search accounts"
              />
            </div>

            {submissionError && <p className="admin-error">{submissionError}</p>}
            {visibleAccounts.length > 0 ? (
              <div className="admin-account-list">
                {visibleAccounts.map((account) => (
                  <article
                    className="admin-account-card"
                    key={account.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/admin/accounts/${account.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/admin/accounts/${account.id}`);
                      }
                    }}
                  >
                    <div>
                      <h3>{[account.firstName, account.lastName].filter(Boolean).join(' ') || 'Unnamed Account'}</h3>
                      <p>{account.email || 'No email'}</p>
                    </div>
                    <div className="admin-account-meta">
                      <span>{account.phoneNumber || 'No phone'}</span>
                      <span>{formatDate(account.createdAt)}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/admin/accounts/${account.id}`); }}>View / Edit</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="admin-empty">No accounts found.</p>
            )}
          </section>
        )}
        {activeTab === 'scouted' && (
          <section className="admin-panel">
            <div className="scout-panel-header">
              <h2>Get Scouted Submissions ({displayedScoutSubmissions.length})</h2>
              <div className="scout-view-toggle">
                <button
                  type="button"
                  className={scoutDetailedView ? 'scout-view-btn active' : 'scout-view-btn'}
                  onClick={() => setScoutDetailedView(true)}
                >
                  Detailed
                </button>
                <button
                  type="button"
                  className={!scoutDetailedView ? 'scout-view-btn active' : 'scout-view-btn'}
                  onClick={() => setScoutDetailedView(false)}
                >
                  Compact
                </button>
              </div>
            </div>

            {loadingSubmissions && <p className="admin-empty">Loading submissions...</p>}
            {submissionError && <p className="admin-error">{submissionError}</p>}

            {displayedScoutSubmissions.length > 0 ? (
              scoutDetailedView ? (
                <div className="scout-cards">
                  {displayedScoutSubmissions.map((s) => (
                    <article className="scout-card" key={s.id}>
                      {s.photoUrl && (
                        <button type="button" className="scout-card-photo" onClick={() => navigate(`/admin/get-scouted/${s.id}/media`)}>
                          <img src={s.photoUrl} alt={`${s.firstName} ${s.lastName}`} />
                        </button>
                      )}
                      <div className="scout-card-body">
                        <div className="scout-card-header">
                          <div>
                            <h3 className="scout-card-name">{s.firstName} {s.lastName}</h3>
                            <span className="scout-card-date">{formatDate(s.submittedAt)}</span>
                          </div>
                          {s.id !== demoScoutSubmission.id && (<button className="scout-delete-btn" onClick={() => handleDeleteScout(s.id)}>Delete</button>)}
                        </div>

                        <div className="scout-info-grid">
                          <div className="scout-info-row"><span className="scout-label">Email</span><span>{s.email}</span></div>
                          <div className="scout-info-row"><span className="scout-label">Phone</span><span>{s.phone}</span></div>
                          <div className="scout-info-row"><span className="scout-label">Country</span><span>{s.countryOfResidence}</span></div>
                          <div className="scout-info-row"><span className="scout-label">DOB</span><span>{s.dateOfBirth}</span></div>
                          <div className="scout-info-row"><span className="scout-label">Gender</span><span>{s.gender}</span></div>
                          {s.instagramHandle && (
                            <div className="scout-info-row"><span className="scout-label">Instagram</span><span>{s.instagramHandle}</span></div>
                          )}
                          <div className="scout-info-row"><span className="scout-label">Currently a model</span><span>{s.isCurrentlyModel}</span></div>
                        </div>

                        <div className="scout-measurements">
                          {[
                            ['Height', s.height, 'cm'],
                            ['Bust / Chest', s.bustChest, 'cm'],
                            ['Waist', s.waist, 'cm'],
                            ['Hips', s.hips, 'cm'],
                            ['Shoe (EU)', s.shoeSize, ''],
                            ['Hair', s.hairColor, ''],
                            ['Eyes', s.eyeColor, ''],
                          ].map(([label, val, unit]) => (
                            <div className="scout-meas-item" key={label}>
                              <span className="scout-label">{label}</span>
                              <span>{val}{unit ? ` ${unit}` : ''}</span>
                            </div>
                          ))}
                        </div>

                        <div className="scout-card-actions">
                          <button type="button" className="scout-action-link" onClick={() => navigate(`/admin/get-scouted/${s.id}/media`)}>View Photos/Videos</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="scout-compact-list">
                  {displayedScoutSubmissions.map((s) => (
                    <div className="scout-compact-row" key={s.id}>
                      {s.photoUrl && (
                        <img src={s.photoUrl} alt="" className="scout-compact-thumb" />
                      )}
                      <div className="scout-compact-name">
                        <span>{s.firstName} {s.lastName}</span>
                        <span className="scout-compact-meta">{s.countryOfResidence} · {s.dateOfBirth} · {s.gender}</span>
                      </div>
                      <span className="scout-compact-email">{s.email}</span>
                      <span className="scout-compact-date">{formatDate(s.submittedAt)}</span>
                      <div className="scout-compact-actions">
                        {s.photoUrl && (
                          <button type="button" className="scout-action-link" onClick={() => navigate(`/admin/get-scouted/${s.id}/media`)}>View Photos/Videos</button>
                        )}
                        {s.id !== demoScoutSubmission.id && (<button className="scout-delete-btn" onClick={() => handleDeleteScout(s.id)}>Delete</button>)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : !loadingSubmissions && <p className="admin-empty">No get scouted submissions found.</p>}
          </section>
        )}
      </main>
    </MainLayout>
  );
};

export default AdminPage;










