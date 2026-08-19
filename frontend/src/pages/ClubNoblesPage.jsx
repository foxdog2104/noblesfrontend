import React, { useEffect, useRef, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import clubNoblesOne from '../assets/images/club-nobles-01.png';
import clubNoblesTwo from '../assets/images/club-nobles-02.png';
import clubNoblesThree from '../assets/images/club-nobles-03.png';
import clubNoblesFour from '../assets/images/club-nobles-04.png';
import clubNoblesFive from '../assets/images/club-nobles-05.png';
import clubNoblesSix from '../assets/images/club-nobles-06.png';
import ArticlesPage from './ArticlesPage';
import { auth } from '../firebase';
import { checkClubNoblesMembership } from '../services/membershipService';
import './ClubNoblesPage.css';

const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];

// Renders the Club Nobles membership page with gallery, timeline, and checkout selection.
async function openCheckoutPage() {
  //my internet is down rn but please add the api key here when it's back up, or figure out the env file stuff
  const stripe = require('stripe') ('sk_test_51U0sYv3CVGunXYJaqJi0uAXnpSkB8FsI7Mtg2RG6bMoqSlhJkAMoUVLP9nBGq08n9pPfCZW1MQr3GtRsu6CqqNtz00IENWi1bS')
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Club Nobles Membership',
          },
          unit_amount: 450 * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: 'https://white-cliff-0d1d7a20f.7.azurestaticapps.net',
    cancel_url: 'https://white-cliff-0d1d7a20f.7.azurestaticapps.net',
  });
  window.location.replace(session.url);
}

const ClubNoblesPage = () => {
  const [hasClubMembership, setHasClubMembership] = useState(null);
  const [activeClubImageIndex, setActiveClubImageIndex] = useState(null);
  const [selectedPaymentPlan] = useState('one');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const carouselRef = useRef(null);
  const pathwayRef = useRef(null);

  // const openCheckoutPage = async () => {
  //   const selectedPriceId = selectedPaymentPlan === 'two'
  //     ? 'price_placeholder_two_payment_plan'
  //     : 'price_placeholder_one_payment_plan';

  //   const checkoutSession = await stripe.checkout.sessions.create({
  //     mode: 'payment',
  //     line_items: [
  //       {
  //         price: selectedPriceId,
  //         quantity: 1,
  //       },
  //     ],
  //     success_url: `${window.location.origin}${ROUTES.CLUB_NOBLES_SUCCESS}?plan=${selectedPaymentPlan}`,
  //     cancel_url: `${window.location.origin}${ROUTES.CLUB_NOBLES}?plan=${selectedPaymentPlan}`,
  //   });

  //   window.location.href = checkoutSession.url;
  // };
  // Not sure who did this or why but this is redundant code. Keeping it here just in case but this shouldn't do anything the func i wrote doesn't.
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsSignedIn(Boolean(user));
      setIsAdmin(ADMIN_EMAILS.includes(user?.email?.toLowerCase() || ''));
    });

    return unsubscribe;
  }, []);
  const clubNoblesImages = [
    clubNoblesOne,
    clubNoblesTwo,
    clubNoblesThree,
    clubNoblesFour,
    clubNoblesFive,
    clubNoblesSix,
  ];

  const activeClubImage = activeClubImageIndex === null
    ? null
    : clubNoblesImages[activeClubImageIndex];
  const isTwoPaymentPlan = selectedPaymentPlan === 'two';

  if (hasClubMembership === null) {
    return null;
  }

  if (hasClubMembership && !isAdmin) {
    return <ArticlesPage />;
  }

  const showPreviousClubImage = (event) => {
    event.stopPropagation();
    setActiveClubImageIndex((currentIndex) => (
      currentIndex === 0 ? clubNoblesImages.length - 1 : currentIndex - 1
    ));
  };

  const showNextClubImage = (event) => {
    event.stopPropagation();
    setActiveClubImageIndex((currentIndex) => (
      currentIndex === clubNoblesImages.length - 1 ? 0 : currentIndex + 1
    ));
  };

  const scrollToClubNoblesGallery = () => {
    pathwayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <MainLayout>
      <main className="club-nobles-page">
        <section className="club-nobles-intro">
          <div className="club-nobles-hero-copy">
            <p className="club-nobles-eyebrow">The Nobles Management</p>
            <h1 className="club-nobles-title">Club Nobles</h1>
            <p className="club-nobles-copy">
              where confidence meets opportunity
            </p>
          </div>

          <div className="club-nobles-details">
            <h2>Club Nobles</h2>
            <p>
              Club Nobles is part of The Nobles, a discovery and development
              community for youth and young adults ages 12-21 to explore their
              confidence, creativity, and potential through fashion, beauty,
              wellness, and personal development.
            </p>
            <p>
              Built on the belief that confidence can be developed and
              opportunity can be earned, Club Nobles provides a supportive
              "Beauty Bestie" environment where participants are encouraged to
              learn, connect, and grow.
            </p>
            <p>
              Through workshops, mentorship, classes, and immersive experiences,
              members gain practical life skills, industry knowledge, and
              self-assurance that extend far beyond the runway.
            </p>
            <button
              type="button"
              className="club-nobles-learn-more-button"
              onClick={scrollToClubNoblesGallery}
            >
              Learn More <span aria-hidden="true">↓</span>
            </button>
          </div>
        </section>

        <section
          className="club-nobles-carousel"
          aria-label="Club Nobles moments"
          ref={carouselRef}
        >
          <h2 className="club-nobles-carousel-heading">
            A modern model club shaping the next generation
          </h2>
          <div className="club-nobles-carousel-track">
            {[...clubNoblesImages, ...clubNoblesImages].map((image, index) => (
              <button
                type="button"
                className="club-nobles-carousel-frame"
                onClick={() => setActiveClubImageIndex(index % clubNoblesImages.length)}
                aria-label={`View Club Nobles image ${(index % clubNoblesImages.length) + 1} full size`}
                key={`${image}-${index}`}
              >
                <img src={image} alt="" className="club-nobles-carousel-image" />
              </button>
            ))}
          </div>
          <p className="club-nobles-carousel-subheading">
            of talent in fashion, beauty, and personal growth.
          </p>
        </section>

        <section
          className="club-nobles-pathway"
          aria-labelledby="club-nobles-pathway-title"
          ref={pathwayRef}
        >
          <div className="club-nobles-pathway-header">
            <p className="club-nobles-pathway-eyebrow">Pathway</p>
            <h2 id="club-nobles-pathway-title">The Club Nobles Timeline</h2>
            <h3>Requires account</h3>
            <div className={isSignedIn ? 'club-nobles-prep-card' : 'club-nobles-prep-card-blurred'}>
              <p className="club-nobles-prep-kicker">Empowering the next generation of talent</p>
              <div className="club-nobles-prep-card-header">
                <div className="club-nobles-prep-title-group">
                  <h3>The Prep</h3>
                </div>
                <div className="club-nobles-prep-purchase-group">
                  <p>{isTwoPaymentPlan ? '$475.00' : '$450.00'}</p>
                  <span>{isTwoPaymentPlan ? 'For 2 months' : 'One time'}</span>
                  <button
                    type="button"
                    className={isSignedIn ? 'club-nobles-purchase-button' : 'club-nobles-purchase-button-disabled'}
                    onClick={openCheckoutPage}
                    disabled={!isSignedIn}
                  > 
                    Purchase
                  </button>
                </div>
              </div>
              <p className="club-nobles-prep-description">
                The Prep is the foundation of The Nobles experience.
                Participants receive development in professionalism and
                industry etiquette, goal setting, and mindset. Completion of The
                Prep is required before advancing to The Showcase pathway.
              </p>
              <ul className="club-nobles-prep-list">
                <li>Confidence and communication</li>
                <li>Posture and presence</li>
                <li>Runway and movement</li>
                <li>Personal style and grooming</li>
                <li>Social media and personal branding</li>
              </ul>
            </div>
          </div>

          <div className="club-nobles-timeline">
            <div className="club-nobles-timeline-item">
              <span className="club-nobles-timeline-number">01</span>
              <div className="club-nobles-timeline-content">
                <p className="club-nobles-timeline-meta">Ages 14+ / Investment: $450</p>
                <h3>The Prep</h3>
                <p>
                  The Prep is the foundation of The Nobles experience.
                  Participants receive development in professionalism and
                  industry etiquette, goal setting, and mindset.
                </p>
                <p>
                  Completion of The Prep is required before advancing to The
                  Showcase pathway.
                </p>
              </div>
            </div>

            <div className="club-nobles-timeline-item">
              <span className="club-nobles-timeline-number">02</span>
              <div className="club-nobles-timeline-content">
                <p className="club-nobles-timeline-meta">Ages 16+ / Invitation Only</p>
                <h3>Image Athlete Program</h3>
                <p>
                  For a select few, the journey continues. Participants who
                  demonstrate exceptional professionalism, work ethic, and
                  potential may be invited to join The Nobles Management's
                  exclusive Image Athlete Program.
                </p>
                <p>
                  The Image Athlete Program is designed for individuals who are
                  serious about pursuing a professional career in modeling,
                  media, and entertainment. Members receive advanced mentorship,
                  industry guidance, and opportunities for commercial,
                  editorial, and international development.
                </p>
                <p>
                  Only a handful of individuals are accepted each year, and
                  there is no fee to participate.
                </p>
              </div>
            </div>

            <div className="club-nobles-timeline-item">
              <span className="club-nobles-timeline-number">03</span>
              <div className="club-nobles-timeline-content">
                <p className="club-nobles-timeline-meta">Representation Pathway</p>
                <h3>The Nobles Management</h3>
                <p>
                  The final stage of The Nobles pathway is representation
                  through The Nobles Management.
                </p>
                <p>
                  As one of Canada's leading talent agencies, The Nobles
                  Management represents select models and talent for commercial,
                  editorial, and international opportunities.
                </p>
                <p>
                  Agency representation is never guaranteed and is reserved for
                  those who consistently demonstrate talent, professionalism,
                  and readiness for the next level.
                </p>
              </div>
            </div>
          </div>
        </section>

        {activeClubImage && (
          <div
            className="club-nobles-lightbox"
            role="dialog"
            aria-modal="true"
            onClick={() => setActiveClubImageIndex(null)}
          >
            <button
              type="button"
              className="club-nobles-lightbox-close"
              onClick={() => setActiveClubImageIndex(null)}
              aria-label="Close Club Nobles image"
            >
              Close
            </button>
            <button
              type="button"
              className="club-nobles-lightbox-arrow club-nobles-lightbox-arrow-left"
              onClick={showPreviousClubImage}
              aria-label="View previous Club Nobles image"
            >
              &lsaquo;
            </button>
            <div
              className="club-nobles-lightbox-content"
              onClick={(event) => event.stopPropagation()}
            >
              <img src={activeClubImage} alt="" className="club-nobles-lightbox-image" />
              <div className="club-nobles-lightbox-caption">
                <p className="club-nobles-lightbox-name">full name here</p>
                <p className="club-nobles-lightbox-credit">@ photography location</p>
              </div>
            </div>
            <button
              type="button"
              className="club-nobles-lightbox-arrow club-nobles-lightbox-arrow-right"
              onClick={showNextClubImage}
              aria-label="View next Club Nobles image"
            >
              &rsaquo;
            </button>
          </div>
        )}
      </main>
    </MainLayout>
  );
};

export default ClubNoblesPage;




