const axios = require('axios');
async function test() {
  try {
    const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'admin@stockflow.com',
      password: 'password'
    });
    const token = loginRes.data.accessToken;
    console.log('Got token');
    
    const reportRes = await axios.get('http://localhost:8080/api/reports/stocktake-variance?from=2026-08-01T00:00:00.000Z&to=2026-08-31T23:59:59.000Z', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Report data:', JSON.stringify(reportRes.data, null, 2).substring(0, 1000));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
