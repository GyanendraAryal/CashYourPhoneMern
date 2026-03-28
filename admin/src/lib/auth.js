// Admin auth now uses httpOnly cookies issued by the backend.
// This module keeps a lightweight in-memory auth hint for routing UX.
// The source of truth is `/api/admin/auth/me`.

let _authed = false;

export const getToken = () => ""; // legacy no-op
export const setToken = () => { _authed = true; }; // legacy no-op
export const clearToken = () => { _authed = false; }; // legacy no-op

export const setAuthed = (v) => { _authed = Boolean(v); };
export const isAuthed = () => _authed;
