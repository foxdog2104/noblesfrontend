const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyCPtefja6ggkbWi5QyelIowls_qX_gead4';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'nobelsmanagment';
const ADMIN_EMAILS = ['televisionneverenough@gmail.com', 'test@nobles.com', 'noblesadmintest@gmail.com'];
const dataDir = path.join(__dirname, 'data');
const membershipsFile = path.join(dataDir, 'memberships.json');

const ensureDataFile = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(membershipsFile)) {
    fs.writeFileSync(membershipsFile, '[]');
  }
};

const readMemberships = () => {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(membershipsFile, 'utf8'));
};

const writeMemberships = (memberships) => {
  ensureDataFile();
  fs.writeFileSync(membershipsFile, JSON.stringify(memberships, null, 2));
};

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data));
};

const readBody = (req) => new Promise((resolve, reject) => {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    try {
      resolve(body ? JSON.parse(body) : {});
    } catch (error) {
      reject(error);
    }
  });
});

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
};

const verifyAdminToken = async (req) => {
  const idToken = getBearerToken(req);

  if (!idToken) {
    return { ok: false, status: 401, error: 'Missing Firebase login token.' };
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    return { ok: false, status: 401, error: 'Invalid Firebase login token.' };
  }

  const data = await response.json();
  const email = data.users?.[0]?.email?.toLowerCase();

  if (!ADMIN_EMAILS.includes(email)) {
    return { ok: false, status: 403, error: 'This account is not an admin: ' + (email || 'unknown email') + '.' };
  }

  return { ok: true, email, idToken };
};

const convertFirestoreValue = (value) => {
  if (!value || typeof value !== 'object') return value;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(convertFirestoreValue);
  if ('mapValue' in value) {
    return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, nestedValue]) => [key, convertFirestoreValue(nestedValue)]));
  }
  return value;
};

const convertFirestoreDocument = (doc) => {
  const fields = doc.fields || {};
  const id = doc.name.split('/').pop();
  return Object.fromEntries([
    ['id', id],
    ...Object.entries(fields).map(([key, value]) => [key, convertFirestoreValue(value)]),
  ]);
};

const getFirestoreCollection = async (collectionName, idToken) => {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}?orderBy=submittedAt%20desc`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load ${collectionName}.`);
  }

  const data = await response.json();
  return (data.documents || []).map(convertFirestoreDocument);
};

const handleAdminCollection = async (req, res, collectionName) => {
  try {
    const admin = await verifyAdminToken(req);

    if (!admin.ok) {
      sendJson(res, admin.status, { error: admin.error });
      return;
    }

    const submissions = await getFirestoreCollection(collectionName, admin.idToken);
    sendJson(res, 200, { submissions });
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Unable to load submissions.' });
  }
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, {});
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/check') {
    const admin = await verifyAdminToken(req);
    sendJson(res, admin.ok ? 200 : admin.status, admin.ok ? { admin: true, email: admin.email } : { admin: false, error: admin.error });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/contact-submissions') {
    await handleAdminCollection(req, res, 'contactSubmissions');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/scout-submissions') {
    await handleAdminCollection(req, res, 'scoutSubmissions');
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/memberships/')) {
    const email = decodeURIComponent(url.pathname.replace('/api/memberships/', '')).toLowerCase();
    const memberships = readMemberships();
    const membership = memberships.find((item) => item.email.toLowerCase() === email);

    sendJson(res, 200, {
      active: Boolean(membership?.active),
      membership: membership || null,
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/memberships') {
    try {
      const body = await readBody(req);

      if (!body.email) {
        sendJson(res, 400, { error: 'Email is required.' });
        return;
      }

      const memberships = readMemberships();
      const email = body.email.toLowerCase();
      const existingIndex = memberships.findIndex((item) => item.email.toLowerCase() === email);
      const membership = {
        active: true,
        email,
        plan: body.plan || 'one',
        planLabel: body.planLabel || 'One time payment',
        price: body.price || '$450.00',
        purchasedAt: body.purchasedAt || new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        memberships[existingIndex] = membership;
      } else {
        memberships.push(membership);
      }

      writeMemberships(memberships);
      sendJson(res, 201, { active: true, membership });
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid JSON body.' });
    }
    return;
  }

  sendJson(res, 404, { error: 'Route not found.' });
});

server.listen(PORT, () => {
  console.log(`Membership API running at http://localhost:${PORT}`);
});

