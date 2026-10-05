import fetch from 'node-fetch';

const BASE = 'http://localhost:3000';

async function waitForDb() {
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(BASE + '/api/health');
      const data = await res.json() as any;
      if (data.dbReady) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function runTests() {
  await waitForDb();
  console.log('=== Starting Phase 1 CV API & Ownership Tests ===');

  const email = 'testcv_' + Date.now() + '@kayan.com';
  const password = 'Password123!';
  const name = 'مهندس تجريبي';

  const regRes = await fetch(BASE + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName: name })
  });
  const regData = await regRes.json() as any;
  const token = regData.token;
  if (!token) {
    console.error('Failed to obtain token');
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const createRes = await fetch(BASE + '/api/cv', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'سيرة ذاتية لهندسة البرمجيات',
      language: 'ar',
      template: 'professional',
      status: 'draft',
      personalInfo: {
        fullName: 'أحمد محمد علي',
        email: email,
        phone: '+967770000000',
        location: 'صنعاء، اليمن',
        headline: 'مطور برمجيات أول'
      },
      summary: 'خبرة 5 سنوات في تطوير الويب.',
      experiences: []
    })
  });
  console.log('Create CV status:', createRes.status);
  const createText = await createRes.text();
  console.log('Create CV body:', createText);
}
runTests();
