import api from "../lib/api";

// Step 1: request reset (OTP or Email link)
export async function requestPasswordReset({ identifier, method }) {
  // method: "otp" | "email"
  // identifier: email or phone
  const res = await api.post("/api/v1/user/forgot-password", {
    identifier,
    method,
  });
  return res.data; // should be a message; don't depend on user-existence
}

// Step 2: verify + set new password
export async function resetPassword({ identifier, otp, token, newPassword }) {
  // For OTP flow: identifier + otp + newPassword
  // For Email link flow: token + newPassword
  const res = await api.post("/api/v1/user/reset-password", {
    identifier,
    otp,
    token,
    newPassword,
  });
  return res.data;
}
