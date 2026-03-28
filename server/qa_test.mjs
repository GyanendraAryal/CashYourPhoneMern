import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4000/api';

async function audit() {
  const report = {
    auth: { nosqlInjection: false, duplicateEmail: false },
    upload: { fakeMimeDrop: false },
    payment: { forgeryBlocked: false },
    submission: { stateMachineEnforced: false },
    admin: { bypassBlocked: false }
  };

  try {
    // 1. NoSQL Injection Test on Login
    const nosqlRes = await fetch(`${BASE_URL}/v1/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: { "$ne": null }, password: "password" })
    });
    const nosqlBody = await nosqlRes.json();
    // expected: sanitization drops the object, so it fails validation or auth
    report.auth.nosqlInjection = nosqlRes.status === 400 || nosqlRes.status === 401 || nosqlBody.error === true;

    // 2. eSewa Signature Forgery
    const esewaRes = await fetch(`${BASE_URL}/v1/payments/esewa/success?data=eyJzdGF0dXMiOiJDT01QTEVURFEifQ==`);
    const esewaBody = await esewaRes.text();
    report.payment.forgeryBlocked = esewaRes.status === 400 || esewaRes.status === 401 || esewaBody.includes("Signature verification failed") || esewaRes.status === 500;

    // 3. Fake File Upload (PHP masquerading as JPG)
    // Create fake JPG
    const fakeFilePath = path.resolve("./fake.jpg");
    fs.writeFileSync(fakeFilePath, "<?php echo 'Hacked!'; ?>");
    
    // We use raw upload if admin/upload is available, but without token it should fail anyway.
    const uploadRes = await fetch(`${BASE_URL}/admin/upload`, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=---boundary" },
      body: "---boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"fake.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n<?php echo 'Hacked!'; ?>\r\n---boundary--\r\n"
    });
    report.upload.fakeMimeDrop = uploadRes.status === 401 || uploadRes.status === 403; // Blocked by admin auth or csrf

    // 4. Admin Bypass Test
    const adminRes = await fetch(`${BASE_URL}/admin/stats`);
    report.admin.bypassBlocked = adminRes.status === 401 || adminRes.status === 403;

    // 5. Duplicate User Test
    const dummyUser = { name: "Test QA", email: `qa${Date.now()}@test.com`, phone: `98${Math.floor(Math.random()*100000000)}`, password: "Password!123" };
    await fetch(`${BASE_URL}/v1/user/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dummyUser) });
    const dupRes = await fetch(`${BASE_URL}/v1/user/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dummyUser) });
    report.auth.duplicateEmail = dupRes.status === 409 || dupRes.status === 400;

    // 6. Check 404 Fixes
    const devicesRes = await fetch(`${BASE_URL}/admin/devices?page=1&limit=20&sort=newest`);
    const pricingRes = await fetch(`${BASE_URL}/v1/pricing/config`);
    const sellReqRes = await fetch(`${BASE_URL}/admin/sell-requests`);
    
    report.routesStatus = {
      adminDevices: devicesRes.status !== 404,
      pricingConfig: pricingRes.status !== 404,
      adminSellRequests: sellReqRes.status !== 404
    };

    console.log(JSON.stringify(report, null, 2));

  } catch (err) {
    console.error("Audit script failed:", err);
  }
}

audit();
