import { test as setup, request } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

setup('create default users', async () => {
  const apiContext = await request.newContext({
    baseURL: API_BASE_URL,
  });

  // Try to register the admin user
  const adminRegister = await apiContext.post('/api/Auth/register', {
    data: {
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@tradeoffstack.com',
      password: 'Admin123!Secure',
    }
  });

  if (adminRegister.ok()) {
    console.log('Successfully seeded admin user for tests.');
  } else {
    console.log('Admin user might already exist or API error:', await adminRegister.text());
  }
});
