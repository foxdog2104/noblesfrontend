import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { checkClubNoblesMembership } from '../services/membershipService';
import './SettingsPage.css';

// Shows account and membership details using the active light or dark theme.
const SettingsPage = () => {
  const [status, setStatus] = useState(null);
  const user = JSON.parse(localStorage.getItem('noblesTestUser') || 'null');

  useEffect(() => {
    checkClubNoblesMembership().then(setStatus);
  }, []);

  const membership = status?.membership;

  return (
    <MainLayout scrollTarget=".settings-page">
      <main className="settings-page">
        <section className="settings-shell">
          <p className="settings-eyebrow">Account</p>
          <h1>Settings</h1>

          <div className="settings-list">
            <div className="settings-row">
              <span>Email</span>
              <strong>{user?.email || 'Not logged in'}</strong>
            </div>

            <div className="settings-row">
              <span>Club Nobles Membership</span>
              <strong>{status?.active ? 'Active' : 'Not Active'}</strong>
            </div>

            {membership && (
              <>
                <div className="settings-row">
                  <span>Plan</span>
                  <strong>{membership.planLabel}</strong>
                </div>
                <div className="settings-row">
                  <span>Price</span>
                  <strong>{membership.price}</strong>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </MainLayout>
  );
};

export default SettingsPage;
