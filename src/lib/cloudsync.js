// cloudsync.js — bind the app's data to a single JSON file the user keeps in an
// iCloud Drive folder, so the family's records follow them across devices with
// no server and no account. Built on the File System Access API.
//
// Platform reality (why the UI has two paths):
//   • Chromium desktop (Chrome/Edge on macOS) — full auto-sync: we hold a
//     persistent handle to the file and read/write it directly.
//   • Safari (macOS + all iOS browsers, which are WebKit) — the API is absent.
//     There the Settings screen falls back to one-tap 저장/불러오기 against the
//     same iCloud file via the download + file-picker flow.
//
// The file handle can't live in localStorage (handles aren't serialisable), so
// we stash it in IndexedDB; it survives reloads and, for installed PWAs,
// re-grants without a fresh picker.
//
// Only chores / logs / members sync — they're the shared family record.
// settings (theme, haptics, who's active on THIS device) stay device-local.

const DB_NAME = 'whodid-sync'
const STORE = 'handles'
const HANDLE_KEY = 'cloudFile'

// ---- feature detection -----------------------------------------------------

export function syncSupported() {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

// ---- tiny IndexedDB key/value (no dependency; one store, one key) ----------

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbRun(mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

// ---- handle lifecycle ------------------------------------------------------

// Open the file picker (a user gesture is required) and remember the handle.
// showSaveFilePicker lets the user pick an existing file too — we always read
// before writing, so joining an existing family file never clobbers it.
export async function connectFile() {
  const handle = await window.showSaveFilePicker({
    suggestedName: 'whodid.json',
    types: [
      { description: 'whodid 데이터', accept: { 'application/json': ['.json'] } },
    ],
  })
  await idbRun('readwrite', (s) => s.put(handle, HANDLE_KEY))
  return handle
}

export async function restoreHandle() {
  try {
    return (await idbRun('readonly', (s) => s.get(HANDLE_KEY))) || null
  } catch {
    return null
  }
}

export async function forgetHandle() {
  try {
    await idbRun('readwrite', (s) => s.delete(HANDLE_KEY))
  } catch {
    /* nothing to forget */
  }
}

// 'granted' | 'prompt' | 'denied'. On reload the browser usually reports
// 'prompt' (needs a re-grant via a click) unless the app is an installed PWA.
export async function permissionState(handle) {
  try {
    return await handle.queryPermission({ mode: 'readwrite' })
  } catch {
    return 'denied'
  }
}

export async function requestPermission(handle) {
  try {
    return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted'
  } catch {
    return false
  }
}

// ---- file read / write -----------------------------------------------------

// Returns { doc, lastModified, corrupt }. doc is null for an empty or unparseable
// file (corrupt=true only for the unparseable case).
export async function readFileDoc(handle) {
  const file = await handle.getFile()
  const text = await file.text()
  if (!text.trim()) return { doc: null, lastModified: file.lastModified }
  try {
    return { doc: JSON.parse(text), lastModified: file.lastModified }
  } catch {
    return { doc: null, lastModified: file.lastModified, corrupt: true }
  }
}

export async function writeFileDoc(handle, doc) {
  const writable = await handle.createWritable()
  await writable.write(JSON.stringify(doc, null, 2))
  await writable.close()
  const file = await handle.getFile()
  return file.lastModified
}

// ---- pure sync logic (unit-tested) -----------------------------------------

// The shared record only — theme/haptics/active member are device-local.
// logs keys are sorted so two devices holding identical data always produce
// the same signature regardless of insertion order.
export function canonicalSig(src) {
  const chores = Array.isArray(src?.chores) ? src.chores : []
  const members = Array.isArray(src?.members) ? src.members : []
  const rawLogs = src?.logs && typeof src.logs === 'object' ? src.logs : {}
  const logs = {}
  for (const k of Object.keys(rawLogs).sort()) logs[k] = rawLogs[k]
  return JSON.stringify({ chores, members, logs })
}

export function isEmptyDoc(doc) {
  if (!doc || typeof doc !== 'object') return true
  const noChores = !Array.isArray(doc.chores) || doc.chores.length === 0
  const noLogs =
    !doc.logs || typeof doc.logs !== 'object' || Object.keys(doc.logs).length === 0
  return noChores && noLogs
}

export function docTimestamp(doc) {
  if (!doc || typeof doc !== 'object') return 0
  const t = Date.parse(doc.syncedAt || doc.exportedAt || '')
  return Number.isNaN(t) ? 0 : t
}

// What to do when connecting this device's state to the cloud file:
//   'push'     — write local into the file (seed it, or local is the only data)
//   'adopt'    — load the file into the app (this device is joining/behind)
//   'noop'     — already the same, or nothing anywhere
//   'conflict' — both hold different data with no clear timestamp winner; the
//                caller must ask the user which side wins
export function chooseSync(localDoc, cloudDoc) {
  const cloudEmpty = isEmptyDoc(cloudDoc)
  const localEmpty = isEmptyDoc(localDoc)
  if (cloudEmpty && localEmpty) return 'noop'
  if (cloudEmpty) return 'push'
  if (localEmpty) return 'adopt'
  if (canonicalSig(localDoc) === canonicalSig(cloudDoc)) return 'noop'
  const ct = docTimestamp(cloudDoc)
  const lt = docTimestamp(localDoc)
  if (ct > lt) return 'adopt'
  if (lt > ct) return 'push'
  return 'conflict'
}

// After a connect, decide how a later re-read (window focus / 지금 동기화)
// should reconcile. `baseSig` is the signature both sides shared at last sync.
//   localDirty  = local changed since  (sig(state) !== baseSig)
//   cloudDirty  = file changed since   (sig(file)  !== baseSig)
// Returns 'adopt' | 'push' | 'noop' | 'conflict'.
export function chooseRepull(baseSig, localSig, cloudSig, localDoc, cloudDoc) {
  const localDirty = localSig !== baseSig
  const cloudDirty = cloudSig !== baseSig
  if (localSig === cloudSig) return 'noop' // already agree
  if (cloudDirty && !localDirty) return 'adopt'
  if (localDirty && !cloudDirty) return 'push'
  // both moved independently → last save wins by timestamp
  const ct = docTimestamp(cloudDoc)
  const lt = docTimestamp(localDoc)
  if (ct > lt) return 'adopt'
  if (lt > ct) return 'push'
  return 'conflict'
}
