import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { ROUTES } from '../constants';
import './ClubNoblesSuccessPage.css';

// Renders the Club Nobles payment confirmation page.
const ClubNoblesSuccessPage = () => {
  const { search } = useLocation();
  const paymentPlan = new URLSearchParams(search).get('plan');
  const isTwoPaymentPlan = paymentPlan === 'two';
  const paidAmount = isTwoPaymentPlan ? '$283.00' : '$450.00';

  return (
    <MainLayout>
      <main className="club-success-page">
        <section className="club-success-card" aria-labelledby="club-success-title">
          <p className="club-success-eyebrow">Payment Successful</p>
          <h1 id="club-success-title">Thank You</h1>
          <p className="club-success-welcome">Welcome to the Club of Nobles</p>
          <p className="club-success-amount">{paidAmount}</p>
          <p className="club-success-message">
            Your payment was successful. Instructions will be emailed to you.
          </p>
          <Link to={ROUTES.CLUB_NOBLES} className="club-success-link">
            Back to Club Nobles
          </Link>
        </section>
      </main>
    </MainLayout>
  );
};

export default ClubNoblesSuccessPage;
