const MEMBERSHIP_API_URL = process.env.REACT_APP_MEMBERSHIP_API_URL || 'http://localhost:5000';

export const getCurrentUser = async () =>
  JSON.parse(localStorage.getItem('noblesTestUser') || 'null');

export const getClubNoblesMembership = async (email) => {
  const response = await fetch(`${MEMBERSHIP_API_URL}/api/memberships/${encodeURIComponent(email)}`);

  if (!response.ok) {
    throw new Error('Unable to check Club Nobles membership.');
  }

  return response.json();
};

export const createClubNoblesMembership = async ({
  email,
  plan,
  planLabel,
  price,
}) => {
  const response = await fetch(`${MEMBERSHIP_API_URL}/api/memberships`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      plan,
      planLabel,
      price,
      purchasedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error('Unable to save Club Nobles membership.');
  }

  return response.json();
};

export const checkClubNoblesMembership = async () => {
  const user = await getCurrentUser();

  if (!user?.email) {
    return {
      active: false,
      membership: null,
      user: null,
    };
  }

  try {
    const membershipStatus = await getClubNoblesMembership(user.email);

    return {
      active: Boolean(membershipStatus.active),
      membership: membershipStatus.membership,
      user,
    };
  } catch (error) {
    return {
      active: false,
      membership: null,
      user,
      error: error.message,
    };
  }
};
