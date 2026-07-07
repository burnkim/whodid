// backup.js — JSON export/import helpers (pure; persistence stays in the store).

export const BACKUP_VERSION = 2

export function buildExport({ chores, logs, settings, members }) {
  return {
    app: 'whodid',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    chores,
    logs,
    settings,
    members: members || [],
  }
}

export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke on next tick so the click has time to register.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportFilename() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `whodid-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`
}

// Parse + shape-validate an import file. Throws Error with a Korean message on failure.
export function parseImport(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('파일을 읽을 수 없어요. 올바른 백업 파일인지 확인해주세요.')
  }
  if (!data || typeof data !== 'object') {
    throw new Error('백업 형식이 올바르지 않아요.')
  }
  if (!Array.isArray(data.chores)) {
    throw new Error('집안일 목록을 찾을 수 없어요.')
  }
  if (!data.logs || typeof data.logs !== 'object' || Array.isArray(data.logs)) {
    throw new Error('기록 데이터를 찾을 수 없어요.')
  }
  return {
    chores: data.chores,
    logs: data.logs,
    settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
    members: Array.isArray(data.members) ? data.members : [],
  }
}

// "집안일 12개 · 기록 240일"
export function importSummary(payload) {
  const choreCount = Array.isArray(payload.chores) ? payload.chores.length : 0
  const dayCount = payload.logs ? Object.keys(payload.logs).length : 0
  return `집안일 ${choreCount}개 · 기록 ${dayCount}일`
}
