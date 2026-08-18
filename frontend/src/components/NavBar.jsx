import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import './NavBar.css';
import instagramIcon from '../assets/images/instagram-icon.svg';
import logo from '../assets/images/logo.svg';
import logoDark from '../assets/images/logo-dark.svg';
import { ROUTES } from '../constants';
import { auth } from '../firebase';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];

const NavBar = () => {
  const location = useLocation();
  const path = location.pathname;

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  const [currentUser, setCurrentUser] = useState(() =>
    JSON.parse(localStorage.getItem('noblesTestUser') || 'null')
  );

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
          <Link to={ROUTES.CLUB_NOBLES} className="nav-link">Club Nobles</Link>
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
      <div className="navbar-mobile">
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
        <Link to={ROUTES.GET_SCOUTED} className={`mobile-tab${path === ROUTES.GET_SCOUTED ? ' mobile-tab--active' : ''}`}>
          <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <span>Scout</span>
        </Link>
        <Link to={currentUser ? (isAdmin ? ROUTES.ADMIN : ROUTES.SETTINGS) : ROUTES.LOGIN} className={`mobile-tab${path === ROUTES.LOGIN || path === ROUTES.SIGNUP || path === ROUTES.SETTINGS || path === ROUTES.ADMIN ? ' mobile-tab--active' : ''}`}>
          <svg className="mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 3h6v18h-6M10 17l5-5-5-5M3 12h12" />
          </svg>
          <span>{currentUser ? (isAdmin ? 'Admin' : 'Settings') : 'Login'}</span>
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;





