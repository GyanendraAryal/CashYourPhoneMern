// DEPRECATED: This file existed in older iterations of the project.
// The production CSRF gate is implemented in `requireCsrf.js` and applied from `server.js`.
// Keep this re-export to avoid accidental imports breaking builds.
// Please import from: `../middleware/requireCsrf.js`

export { requireCsrf } from "./requireCsrf.js";
