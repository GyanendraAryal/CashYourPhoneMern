import bcrypt from "bcrypt";
import AdminUser from "../models/AdminUser.js";

export async function ensureAdminSeeded() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@cashyourphone.com")
    .toLowerCase()
    .trim();
  const adminPass = process.env.ADMIN_PASSWORD || "Admin@12345";

  const exists = await AdminUser.findOne({ email: adminEmail });
  if (exists) return { created: false };

  const passwordHash = await bcrypt.hash(adminPass, 10);

  await AdminUser.create({
    email: adminEmail,
    passwordHash,
    role: "owner", // Phase 3: seed as owner
  });

  return { created: true };
}
