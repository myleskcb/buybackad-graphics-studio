/* A separate IndexedDB keeps business drafts and their photos out of the
   customer's Studio draft, shared WE BUY library, and posting feed. */
const DATABASE = "iphonesla-social-drafts-v1";
let opened;
function database() {
  if (opened) return opened;
  opened = new Promise((resolve, reject) => {
    const r = indexedDB.open(DATABASE, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("drafts", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => { opened = null; reject(new Error("Browser storage is unavailable. Download the draft JSON to keep the words.")); };
    r.onblocked = () => { opened = null; reject(new Error("Close another Social Studio tab and try saving again.")); };
  });
  return opened;
}
async function transact(mode, run) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", mode);
    const r = run(tx.objectStore("drafts"));
    tx.oncomplete = () => resolve(r.result);
    tx.onabort = tx.onerror = () => reject(new Error("The draft could not be saved in this browser. Storage may be full; download its JSON to keep the words."));
  });
}
export const listDrafts = async () => (await transact("readonly", s => s.getAll())).sort((a, b) => b.updated.localeCompare(a.updated));
export const getDraft = id => transact("readonly", s => s.get(id));
export const deleteDraft = id => transact("readwrite", s => s.delete(id));
export async function saveDraft(draft, photo) {
  const id = draft.id || crypto.randomUUID();
  const value = { ...draft, id, photo: photo || null, updated: new Date().toISOString() };
  await transact("readwrite", s => s.put(value));
  return value;
}
