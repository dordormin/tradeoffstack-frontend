const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@tradeoffstack.com',
      password: 'Admin123!Secure'
    });
    console.log('Login Response:', loginRes.data);
    const token = loginRes.data.token || loginRes.data.Token;
    const userId = loginRes.data.userId || loginRes.data.UserId;
    
    const userRes = await axios.get(`http://localhost:5000/api/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('User Profile:', userRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
test();
