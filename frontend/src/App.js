import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ModelsPage from './pages/ModelsPage';
import GetScoutedPage from './pages/GetScoutedPage';
import ClubNoblesPage from './pages/ClubNoblesPage';
import ClubNoblesCheckoutPage from './pages/ClubNoblesCheckoutPage';
import ClubNoblesSuccessPage from './pages/ClubNoblesSuccessPage';
import ContactPage from './pages/ContactPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import AdminArticleEditPage from './pages/AdminArticleEditPage';
import AdminModelEditPage from './pages/AdminModelEditPage';
import AdminModelPreviewPage from './pages/AdminModelPreviewPage';
import AdminModelImagesPage from './pages/AdminModelImagesPage';
import AdminAccountPage from './pages/AdminAccountPage';
import AdminContactMessagePage from './pages/AdminContactMessagePage';
import AdminScoutMediaPage from './pages/AdminScoutMediaPage';
import ArticlesPage from './pages/ArticlesPage';
import Article from './pages/Article';
import TestModelPage from './pages/TestModelPage';
import ModelProfilePage from './pages/ModelProfilePage';
import { ROUTES } from './constants';
import './theme.css';

function App() {

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Home */}
          <Route path={ROUTES.HOME} element={<HomePage />} />

          {/* Model categories */}
          <Route
            path={ROUTES.INTERNATIONAL}
            element={<ModelsPage category="International" />}
          />
          <Route
            path={ROUTES.LOCAL}
            element={<ModelsPage category="Local" />}
          />
          <Route
            path={ROUTES.JUNIOR}
            element={<ModelsPage category="Junior" />}
          />
          <Route
            path={ROUTES.CAPCON}
            element={<ModelsPage category="CapCon" />}
          />
          <Route
            path={ROUTES.GET_SCOUTED}
            element={<GetScoutedPage />}
          />
          <Route
            path={ROUTES.CLUB_NOBLES}
            element={<ClubNoblesPage />}
          />
          <Route
            path={ROUTES.CLUB_NOBLES_CHECKOUT}
            element={<ClubNoblesCheckoutPage />}
          />
          <Route
            path={ROUTES.CLUB_NOBLES_SUCCESS}
            element={<ClubNoblesSuccessPage />}
          />
          <Route
            path={ROUTES.CONTACT}
            element={<ContactPage />}
          />
          <Route
            path={ROUTES.SIGNUP}
            element={<SignupPage />}
          />
          <Route
            path={ROUTES.LOGIN}
            element={<LoginPage />}
          />
          <Route
            path={ROUTES.SETTINGS}
            element={<SettingsPage />}
          />
          <Route
            path={ROUTES.ADMIN}
            element={<AdminPage />}
          />
          <Route
            path={ROUTES.ADMIN_ARTICLE_EDIT}
            element={<AdminArticleEditPage />}
          />
          <Route
            path={ROUTES.ADMIN_MODEL_EDIT}
            element={<AdminModelEditPage />}
          />
          <Route
            path={ROUTES.ADMIN_MODEL_PREVIEW}
            element={<AdminModelPreviewPage />}
          />
          <Route
            path={ROUTES.ADMIN_MODEL_IMAGES}
            element={<AdminModelImagesPage />}
          />
          <Route
            path={ROUTES.ADMIN_ACCOUNT}
            element={<AdminAccountPage />}
          />
          <Route
            path={ROUTES.ADMIN_CONTACT_MESSAGE}
            element={<AdminContactMessagePage />}
          />
          <Route
            path={ROUTES.ADMIN_SCOUT_MEDIA}
            element={<AdminScoutMediaPage />}
          />
          <Route
            path={ROUTES.ARTICLES}
            element={<ArticlesPage requireAdmin />}
          />
          <Route
            path={ROUTES.ARTICLE}
            element={<Article />}
          />
          <Route
            path={ROUTES.MODEL_PROFILE}
            element={<ModelProfilePage />}
          />
          <Route
            path={ROUTES.MODEL_PAGE}
            element={<TestModelPage />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;










