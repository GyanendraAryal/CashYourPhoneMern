# CashYourPhone Admin (Vite + React)

This `admin/` folder is the **Admin Dashboard UI** for the CashYourPhone project.

✅ Important:
- There is **NO separate admin API** inside `admin/`
- The admin backend routes live in: `server/` (Node + Express)
- Admin authentication uses JWT via the server API

---

## 1) Prerequisites
- Node 18+ (or 20+)
- Running API server (`server/`)
- MongoDB Atlas (recommended for staging/production)

---

## 2) Environment Variables

Create `admin/.env` locally (do NOT commit it).  
Use `admin/.env.example` as the template.

Required:
```env
VITE_ADMIN_API_URL=http://localhost:4000
