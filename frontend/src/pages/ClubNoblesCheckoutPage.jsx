import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { createClubNoblesMembership } from '../services/membershipService';
import { ROUTES } from '../constants';
import './ClubNoblesCheckoutPage.css';

// Renders the placeholder Club Nobles checkout page and routes to success after payment.
const ClubNoblesCheckoutPage = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [paymentError, setPaymentError] = useState('');
  const paymentPlan = new URLSearchParams(search).get('plan');
  const isTwoPaymentPlan = paymentPlan === 'two';
  const price = isTwoPaymentPlan ? '$475.00' : '$450.00';
  const planLabel = isTwoPaymentPlan ? '2 monthly payments' : 'One time payment';
  const paymentButtonLabel = isTwoPaymentPlan ? 'Pay $283' : 'Pay $450.00';
  const handlePaymentSuccess = async () => {
    const savedUser = JSON.parse(localStorage.getItem('noblesTestUser') || 'null');

    try {
      await createClubNoblesMembership({
        email: savedUser?.email || 'guest',
        plan: paymentPlan || 'one',
        planLabel,
        price,
      });
    } catch (error) {
      setPaymentError('Membership API is not running. Start it with npm.cmd run api.');
      return;
    }

    window.dispatchEvent(new Event('nobles-membership-change'));
    navigate(`${ROUTES.CLUB_NOBLES_SUCCESS}?plan=${paymentPlan || 'one'}`);
  };

  return (
    <MainLayout>
      <main className="club-checkout-page">
        <section className="club-checkout-shell" aria-labelledby="club-checkout-title">
          <Link to={ROUTES.CLUB_NOBLES} className="club-checkout-back">
            Back to Club Nobles
          </Link>
          <div className="club-checkout-summary">
            <p className="club-checkout-brand">Square Checkout</p>
            <h1 id="club-checkout-title">The Prep</h1>
            <p className="club-checkout-price">{price}</p>
            <p className="club-checkout-plan">{planLabel}</p>
            <div className="club-checkout-line-item">
              <span>Club Nobles development program</span>
              <strong>{price}</strong>
            </div>
          </div>

          <form className="club-checkout-form">
            <h2>Payment</h2>
            <label>
              Email
              <input type="email" placeholder="you@example.com" />
            </label>
            <label>
              Name on card
              <input type="text" placeholder="Full name" />
            </label>
            <label>
              Card number
              <input type="text" inputMode="numeric" placeholder="1234 1234 1234 1234" />
            </label>
            <div className="club-checkout-row">
              <label>
                Expiry
                <input type="text" inputMode="numeric" placeholder="MM / YY" />
              </label>
              <label>
                CVC
                <input type="text" inputMode="numeric" placeholder="CVC" />
              </label>
            </div>
            <button
              type="button"
              className="club-checkout-submit"
              onClick={handlePaymentSuccess}
            >
              {paymentButtonLabel}
            </button>
            {paymentError && (
              <p className="club-checkout-error" role="alert">
                {paymentError}
              </p>
            )}
          </form>
        </section>
      </main>
    </MainLayout>
  );
};

export default ClubNoblesCheckoutPage;
