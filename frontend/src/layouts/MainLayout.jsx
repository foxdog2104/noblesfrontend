import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import ChatWidget from '../components/ChatWidget';
import './MainLayout.css';

// Wraps each page with the shared navbar and scroll-based navbar movement.
const MainLayout = ({ children, scrollTarget = '.scrolling-text-wrapper' }) => {
  const [navbarTranslate, setNavbarTranslate] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (document.documentElement.classList.contains('is-mobile')) {
        setNavbarTranslate(0);
        return;
      }
      const targetElement = document.querySelector(scrollTarget);
      if (targetElement) {
        const elementBottom = targetElement.getBoundingClientRect().bottom;
        const navbarHeight = 80;
        if (elementBottom <= navbarHeight) {
          setNavbarTranslate(Math.min(0, elementBottom - navbarHeight));
        } else {
          setNavbarTranslate(0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollTarget]);

  return (
    <>
      <div className="navbar-wrapper" style={{ transform: `translateY(${navbarTranslate}px)` }}>
        <NavBar />
      </div>
      <main className="main-content">
        {children}
      </main>
      <ChatWidget />
    </>
  );
};

export default MainLayout;
