export function getOrCreateGuestId() {
  const key = "cyp_guest_id";
  let id = localStorage.getItem(key);
  if (!id) {
    // simple random id (not a secret)
    id = Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
    localStorage.setItem(key, id);
  }
  return id;
}
