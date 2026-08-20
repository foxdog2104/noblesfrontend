import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import './NavBar.css';
import instagramIcon from '../assets/images/instagram-icon.svg';
import logo from '../assets/images/logo.svg';
import logoDark from '../assets/images/logo-dark.svg';
import { ROUTES } from '../constants';
import { auth } from '../firebase';
import { checkClubNoblesMembership } from '../services/membershipService';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];
const ADMIN_MOBILE_TABS = [
  { id: 'articles', label: 'Articles', to: ROUTES.ADMIN },
  { id: 'club-nobles', label: 'Model League', to: `${ROUTES.ADMIN}?tab=club-nobles` },
  { id: 'models', label: 'Models', to: `${ROUTES.ADMIN}?tab=models` },
  { id: 'contact', label: 'Contact', to: `${ROUTES.ADMIN}?tab=contact` },
  { id: 'scouted', label: 'Scouted', to: `${ROUTES.ADMIN}?tab=scouted` },
  { id: 'accounts', label: 'Accounts', to: `${ROUTES.ADMIN}?tab=accounts` },
];

const NavBar = () => {
  const location = useLocation();
  const path = location.pathname;
  const activeAdminTab = new URLSearchParams(location.search).get('tab') || 'articles';

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  const [currentUser, setCurrentUser] = useState(() =>
    JSON.parse(localStorage.getItem('noblesTestUser') || 'null')
  );
  const [hasClubMembership, setHasClubMembership] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(JSON.parse(localStorage.getItem('noblesTestUser') || 'null'));
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('nobles-auth-change', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('nobles-auth-change', syncUser);
    };
  }, []);

  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email?.toLowerCase());
  const showAdminMobileTabs = isAdmin && path.startsWith(ROUTES.ADMIN);
  const modelLeagueRoute = hasClubMembership && !isAdmin ? ROUTES.ARTICLES : ROUTES.CLUB_NOBLES;

  useEffect(() => {
    let cancelled = false;

    const syncMembership = async () => {
      const membershipStatus = await checkClubNoblesMembership(auth.currentUser);
      if (!cancelled) {
        setHasClubMembership(Boolean(membershipStatus.active));
      }
    };

    syncMembership();
    window.addEventListener('storage', syncMembership);
    window.addEventListener('nobles-auth-change', syncMembership);
    window.addEventListener('nobles-membership-change', syncMembership);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', syncMembership);
      window.removeEventListener('nobles-auth-change', syncMembership);
      window.removeEventListener('nobles-membership-change', syncMembership);
    };
  }, [currentUser?.email]);

  const handleLogout = async () => {
    await signOut(auth).catch(() => null);
    localStorage.removeItem('noblesTestUser');
    window.dispatchEvent(new Event('nobles-auth-change'));
    window.dispatchEvent(new Event('nobles-membership-change'));
    window.location.href = ROUTES.LOGIN;
  };

  return (
    <nav className="navbar">
      {/* Desktop */}
      <div className="navbar-container">

        <div className="navbar-left">
          <Link to={ROUTES.INTERNATIONAL} className="nav-link">International</Link>
          <Link to={ROUTES.LOCAL} className="nav-link">Local</Link>
          <Link to={ROUTES.JUNIOR} className="nav-link">Junior</Link>
          <Link to={ROUTES.CAPCON} className="nav-link">CapCon</Link>
          <Link to={ROUTES.CONTACT} className="nav-link">Contact</Link>
        </div>

        <div className="navbar-center">
          <Link to={ROUTES.HOME} className="logo">
            <img src={isDark ? logoDark : logo} alt="The Nobles Management" className="logo-image" />
          </Link>
        </div>

        <div className="navbar-right">
          <Link to={ROUTES.GET_SCOUTED} className="nav-link">Get Scouted</Link>
          <Link to={modelLeagueRoute} className="nav-link">Model League</Link>
          {currentUser ? (
            <>
              <button type="button" className="nav-link nav-button" onClick={handleLogout}>Log Out</button>
              <Link to={ROUTES.SETTINGS} className="nav-link">Settings</Link>
              {isAdmin && <Link to={ROUTES.ADMIN} className="nav-link">Admin</Link>}
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="nav-link">Login</Link>
              <Link to={ROUTES.SIGNUP} className="nav-link">Sign Up</Link>
            </>
          )}
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {isDark ? 'Light' : 'Dark'}
          </button>
          <a
            href="https://www.instagram.com/thenoblesmgmt/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on Instagram"
            className="icon-btn"
          >
            <img src={instagramIcon} alt="Instagram" className="icon-img" />
          </a>
        </div>

      </div>

      {/* Mobile bottom tab bar */}
      {!showAdminMobileTabs && (
        <div className="navbar-mobile-top">
          {currentUser ? (
            <>
              <Link to={ROUTES.SETTINGS} className={`mobile-top-link${path === ROUTES.SETTINGS ? ' mobile-top-link--active' : ''}`}>
                Settings
              </Link>
              <button type="button" className="mobile-top-link mobile-top-button" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className={`mobile-top-link${path === ROUTES.LOGIN ? ' mobile-top-link--active' : ''}`}>
                Login
              </Link>
              <Link to={ROUTES.SIGNUP} className={`mobile-top-link${path === ROUTES.SIGNUP ? ' mobile-top-link--active' : ''}`}>
                Sign Up
              </Link>
            </>
          )}
          <Link
            to={modelLeagueRoute}
            className={`mobile-top-link${path === ROUTES.CLUB_NOBLES || path === ROUTES.ARTICLES ? ' mobile-top-link--active' : ''}`}
          >
            Model League
          </Link>
          {isAdmin && (
            <Link to={ROUTES.ADMIN} className={`mobile-top-link${path === ROUTES.ADMIN ? ' mobile-top-link--active' : ''}`}>
              Admin
            </Link>
          )}
        </div>
      )}

      <div className={`navbar-mobile${showAdminMobileTabs ? ' navbar-mobile-admin' : ''}`}>
        {showAdminMobileTabs ? (
          <>
            <Link to={ROUTES.HOME} className="mobile-tab mobile-tab-admin-home">
              <span>Home</span>
            </Link>
            {ADMIN_MOBILE_TABS.map((tab) => (
              <Link
                key={tab.id}
                to={tab.to}
                className={`mobile-tab${activeAdminTab === tab.id ? ' mobile-tab--active' : ''}`}
              >
                <span>{tab.label}</span>
              </Link>
            ))}
          </>
        ) : (
          <>
        <Link to={ROUTES.HOME} className={`mobile-tab${path === ROUTES.HOME ? ' mobile-tab--active' : ''}`}>
          <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
            <path d="M9 22V12h6v10" />
          </svg>
          <span>Home</span>
        </Link>
        <Link to={ROUTES.INTERNATIONAL} className={`mobile-tab${path === ROUTES.INTERNATIONAL ? ' mobile-tab--active' : ''}`}>
          <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3c-2 3.5-3 5.5-3 9s1 5.5 3 9M12 3c2 3.5 3 5.5 3 9s-1 5.5-3 9M3 12h18" />
          </svg>
          <span>Int'l</span>
        </Link>
        <Link to={ROUTES.LOCAL} className={`mobile-tab${path === ROUTES.LOCAL ? ' mobile-tab--active' : ''}`}>
          <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span>Local</span>
        </Link>
        <Link to={ROUTES.JUNIOR} className={`mobile-tab${path === ROUTES.JUNIOR ? ' mobile-tab--active' : ''}`}>
          <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="7" r="4" />
            <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
          </svg>
          <span>Junior</span>
        </Link>
        <Link to={ROUTES.CAPCON} className={`mobile-tab${path === ROUTES.CAPCON ? ' mobile-tab--active' : ''}`}>
          <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 7h16M6 7l1.5 13h9L18 7M9 7V5a3 3 0 016 0v2" />
            <path d="M9.5 12h5" />
          </svg>
          <span>CapCon</span>
        </Link>
        <Link to={ROUTES.CONTACT} className={`mobile-tab${path === ROUTES.CONTACT ? ' mobile-tab--active' : ''}`}>
          <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 5h16v14H4z" />
            <path d="M4 7l8 6 8-6" />
          </svg>
          <span>Contact</span>
        </Link>
        <Link to={ROUTES.GET_SCOUTED} className={`mobile-tab${path === ROUTES.GET_SCOUTED ? ' mobile-tab--active' : ''}`}>
          <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <span>Scout</span>
        </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;





