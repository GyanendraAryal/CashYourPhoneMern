const BASE_URL = 'http://localhost:4000/api';

async function check() {
  const endpoints = [
    { name: 'Admin Devices', url: `${BASE_URL}/admin/devices?page=1&limit=20&sort=newest` },
    { name: 'Pricing Config', url: `${BASE_URL}/v1/pricing/config` },
    { name: 'Admin Sell Requests', url: `${BASE_URL}/admin/sell-requests` }
  ];

  for (const e of endpoints) {
    const res = await fetch(e.url);
    console.log(`${e.name}: ${res.status} ${res.statusText}`);
  }
}
check();
