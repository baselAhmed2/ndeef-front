const fetch = require('node-fetch'); // Next.js context has global fetch usually, but just in case
async function testLogin() {
  const url = 'https://ndeefapp.runasp.net/api/auth/login';
  try {
    const res = await globalThis.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'menna.moustafa868@gmail.com', password: 'wrongpassword' })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
testLogin();
