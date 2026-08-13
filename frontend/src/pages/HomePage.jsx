import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HighlightLightbox from '../components/HighlightLightbox';
import heroVideo from '../videos/The Nobles Management Calgary AB.mp4';
import internationalImage from '../assets/images/international-talent.png';
import localImage from '../assets/images/local-talent.png';
import getScoutedImage from '../assets/images/get-scouted-bg.png';
import clubMembershipImage from '../assets/images/club-membership-bg.png';
import highlightOne from '../assets/images/highlight-01.png';
import highlightTwo from '../assets/images/highlight-02.png';
import highlightThree from '../assets/images/highlight-03.png';
import highlightFour from '../assets/images/highlight-04.png';
import highlightFive from '../assets/images/highlight-05.png';
import highlightSix from '../assets/images/highlight-06.png';
import { checkClubNoblesMembership } from '../services/membershipService';
import { ROUTES } from '../constants';
import './HomePage.css';

const HomePage = () => {
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(null);
  const [hasClubMembership, setHasClubMembership] = useState(false);

  useEffect(() => {
    const checkMembership = async () => {
      const membershipStatus = await checkClubNoblesMembership();
      setHasClubMembership(membershipStatus.active);
    };

    checkMembership();

    window.addEventListener('storage', checkMembership);
    window.addEventListener('nobles-auth-change', checkMembership);
    window.addEventListener('nobles-membership-change', checkMembership);

    return () => {
      window.removeEventListener('storage', checkMembership);
      window.removeEventListener('nobles-auth-change', checkMembership);
      window.removeEventListener('nobles-membership-change', checkMembership);
    };
  }, []);

  const highlights = [
    { src: highlightThree, className: 'highlight-image-frame' },
    { src: highlightOne, className: 'highlight-image-frame' },
    { src: highlightFive, className: 'highlight-image-frame highlight-image-frame-short-wide' },
    { src: highlightFour, className: 'highlight-image-frame highlight-image-frame-large' },
    { src: highlightSix, className: 'highlight-image-frame highlight-image-frame-short-wide' },
    { src: highlightTwo, className: 'highlight-image-frame highlight-image-frame-short-wide' },
  ];

  return (
    <MainLayout scrollTarget=".hero-section">
      <div className="home-page">

        {/* Hero */}
        <section className="hero-section">
          <video className="hero-bg" autoPlay muted loop playsInline>
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="hero-overlay" />
          <div className="hero-caption">
            <p className="hero-eyebrow">Calgary, Alberta</p>
            <h1 className="hero-title">The Nobles<br />Management</h1>
          </div>
        </section>

        {/* Highlights */}
        <section className="highlights-section">
          <h2 className="highlights-title">Highlights</h2>
          <div className="highlights-gallery">

            <div className="highlights-stack">
              <div className="highlights-stack-top">
                {highlights.slice(0, 2).map((h, i) => (
                  <button
                    key={h.src}
                    type="button"
                    className={h.className}
                    onClick={() => setActiveHighlightIndex(i)}
                    aria-label={`View highlight ${i + 1}`}
                  >
                    <img src={h.src} alt="" className="highlight-image" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={highlights[2].className}
                onClick={() => setActiveHighlightIndex(2)}
                aria-label="View highlight 3"
              >
                <img src={highlights[2].src} alt="" className="highlight-image" />
              </button>
            </div>

            <button
              type="button"
              className={highlights[3].className}
              onClick={() => setActiveHighlightIndex(3)}
              aria-label="View highlight 4"
            >
              <img src={highlights[3].src} alt="" className="highlight-image" />
            </button>

            <div className="highlights-stack">
              {highlights.slice(4).map((h, i) => (
                <button
                  key={h.src}
                  type="button"
                  className={h.className}
                  onClick={() => setActiveHighlightIndex(i + 4)}
                  aria-label={`View highlight ${i + 5}`}
                >
                  <img src={h.src} alt="" className="highlight-image" />
                </button>
              ))}
            </div>

          </div>
        </section>

        <HighlightLightbox
          highlights={highlights}
          activeIndex={activeHighlightIndex}
          onClose={() => setActiveHighlightIndex(null)}
          onIndexChange={setActiveHighlightIndex}
        />

        {/* Roster */}
        <section className="roster-section">
          <div className="roster-header">
            <span className="section-tag">The Roster</span>
            <div className="section-line" />
            <Link to={ROUTES.INTERNATIONAL} className="roster-view-all">View All →</Link>
          </div>
          <div className="talent-categories">
            <Link to={ROUTES.INTERNATIONAL} className="talent-card">
              <img src={internationalImage} alt="International" className="talent-image" />
              <div className="talent-info">
                <span className="talent-division">01</span>
                <span className="talent-name">International</span>
              </div>
            </Link>
            <Link to={ROUTES.LOCAL} className="talent-card">
              <img src={localImage} alt="Local" className="talent-image" />
              <div className="talent-info">
                <span className="talent-division">02</span>
                <span className="talent-name">Local</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Club Nobles */}
        <section className="club-membership-section">
          <img src={clubMembershipImage} alt="" className="club-membership-bg" />
          <div className="club-membership-overlay" />
          <div className="club-membership-content">
            <p className="club-membership-eyebrow">
              {hasClubMembership ? 'Articles' : 'Membership'}
            </p>
            <h2 className="club-membership-title">Club Nobles</h2>
            <p className="club-membership-quote">
              {hasClubMembership ? 'keep up with the nobles' : 'develop your confidence'}
            </p>
            <Link to={ROUTES.CLUB_NOBLES} className="club-membership-link">
              Learn More <span className="arrow">→</span>
            </Link>
          </div>
        </section>

        {/* Get Scouted */}
        <section className="get-scouted-section">
          <img src={getScoutedImage} alt="" className="get-scouted-bg" />
          <div className="get-scouted-overlay" />
          <div className="get-scouted-content">
            <p className="get-scouted-eyebrow">Submit Your Application</p>
            <h2 className="get-scouted-title">Get Scouted</h2>
            <Link to="/get-scouted" className="get-scouted-link">
              Apply Now <span className="arrow">→</span>
            </Link>
          </div>
        </section>

      </div>
    </MainLayout>
  );
};

export default HomePage;
