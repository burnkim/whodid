import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from './useStore.js'
import { buildExport } from '../lib/backup.js'
import { migrateChores, migrateLogs, migrateMembers } from '../store/migrate.js'
import {
  canonicalSig,
  chooseRepull,
  chooseSync,
  connectFile,
  docTimestamp,
  forgetHandle,
  permissionState,
  readFileDoc,
  requestPermission,
  restoreHandle,
  syncSupported,
  writeFileDoc,
} from '../lib/cloudsync.js'

const WRITE_DEBOUNCE_MS = 900

// Migrate a parsed cloud doc into the app's shape (chores/logs/members only).
// Signatures are always compared in this migrated space so a v1 or hand-edited
// file never disagrees with our normalized state.
function migratedView(doc) {
  return {
    chores: migrateChores(doc?.chores),
    logs: migrateLogs(doc?.logs),
    members: migrateMembers(doc?.members),
  }
}

function errText(e) {
  if (e?.name === 'NotAllowedError') return '파일 접근 권한이 필요해요. 다시 연결해주세요.'
  return '파일 동기화 중 문제가 생겼어요.'
}

// useCloudSync — binds the shared record (chores/logs/members) to a JSON file in
// an iCloud Drive folder via the File System Access API. Settings stay
// device-local. Returns a small interface the Settings screen drives; the whole
// hook is inert (status stays 'off', all actions no-op) where the API is absent.
export function useCloudSync() {
  const { state, actions } = useStore()
  const supported = syncSupported()

  const [status, setStatus] = useState('off') // off | connected | reconnect | error
  const [busy, setBusy] = useState(false)
  const [fileName, setFileName] = useState(null)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [error, setError] = useState(null)

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state // keep async callbacks reading the latest state
  })
  const handleRef = useRef(null)
  const baseSigRef = useRef(null) // signature both sides shared at last sync
  const writeTimerRef = useRef(null)
  const startedRef = useRef(false)

  const makeDoc = useCallback(
    (s) => ({ ...buildExport(s), syncedAt: new Date().toISOString() }),
    [],
  )

  // Load a cloud doc into the app; return the signature now in force.
  const adopt = useCallback(
    (doc) => {
      const payload = migratedView(doc)
      actions.importData(payload) // settings omitted → device prefs preserved
      return canonicalSig(payload)
    },
    [actions],
  )

  const pushLocal = useCallback(
    async (handle) => {
      const s = stateRef.current
      await writeFileDoc(handle, makeDoc(s))
      baseSigRef.current = canonicalSig(s)
      setLastSyncedAt(Date.now())
    },
    [makeDoc],
  )

  // Reconcile local state with the file. On the first pass after a connect
  // (baseSig unset) we may adopt/push/ask; later passes only move the side that
  // changed. Throws on IO/permission failure so callers can surface it.
  const reconcile = useCallback(
    async (handle, { interactive = false } = {}) => {
      const { doc: cloudDoc } = await readFileDoc(handle)
      const s = stateRef.current
      const localDoc = makeDoc(s)
      const localSig = canonicalSig(s)
      const cloudSig = canonicalSig(migratedView(cloudDoc || {}))

      const applyAdopt = () => {
        adopt(cloudDoc)
        baseSigRef.current = cloudSig
        setLastSyncedAt(Date.now())
      }

      if (baseSigRef.current == null) {
        // First reconcile for this connection.
        let decision = chooseSync(localDoc, cloudDoc)
        if (decision === 'conflict') {
          const adoptCloud = interactive
            ? window.confirm(
                '이 파일에도 데이터가 있어요.\n\n확인 = 파일 데이터 불러오기 (이 기기 데이터는 대체돼요)\n취소 = 이 기기 데이터로 파일 덮어쓰기',
              )
            : docTimestamp(cloudDoc) >= docTimestamp(localDoc)
          decision = adoptCloud ? 'adopt' : 'push'
        }
        if (decision === 'adopt') applyAdopt()
        else if (decision === 'push') await pushLocal(handle)
        else {
          baseSigRef.current = localSig
          setLastSyncedAt(Date.now())
        }
        return
      }

      // Later pass: only reconcile if something actually moved.
      let decision = chooseRepull(baseSigRef.current, localSig, cloudSig, localDoc, cloudDoc)
      if (decision === 'conflict') {
        decision = docTimestamp(cloudDoc) > docTimestamp(localDoc) ? 'adopt' : 'push'
      }
      if (decision === 'adopt') applyAdopt()
      else if (decision === 'push') await pushLocal(handle)
    },
    [adopt, makeDoc, pushLocal],
  )

  // Debounced push when the shared record changes locally.
  const scheduleWrite = useCallback(() => {
    const handle = handleRef.current
    if (!handle) return
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    writeTimerRef.current = setTimeout(async () => {
      writeTimerRef.current = null
      try {
        setBusy(true)
        await pushLocal(handle)
        setStatus('connected')
        setError(null)
      } catch (e) {
        setStatus('error')
        setError(errText(e))
      } finally {
        setBusy(false)
      }
    }, WRITE_DEBOUNCE_MS)
  }, [pushLocal])

  const { chores, logs, members } = state
  useEffect(() => {
    if (!handleRef.current || baseSigRef.current == null) return
    // nothing new to push (also the no-op right after an adopt/push)
    if (canonicalSig({ chores, logs, members }) === baseSigRef.current) return
    scheduleWrite()
  }, [chores, logs, members, scheduleWrite])

  // --- user actions (all require a click / user gesture) ---

  const connect = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const handle = await connectFile()
      handleRef.current = handle
      baseSigRef.current = null
      setFileName(handle.name)
      await reconcile(handle, { interactive: true })
      setStatus('connected')
    } catch (e) {
      if (e?.name !== 'AbortError') {
        setStatus(handleRef.current ? 'error' : 'off')
        setError(errText(e))
      }
    } finally {
      setBusy(false)
    }
  }, [reconcile])

  const reconnect = useCallback(async () => {
    const handle = handleRef.current
    if (!handle) return
    setBusy(true)
    setError(null)
    try {
      if (!(await requestPermission(handle))) {
        setStatus('reconnect')
        return
      }
      baseSigRef.current = null
      await reconcile(handle, { interactive: true })
      setStatus('connected')
    } catch (e) {
      setStatus('error')
      setError(errText(e))
    } finally {
      setBusy(false)
    }
  }, [reconcile])

  const syncNow = useCallback(async () => {
    const handle = handleRef.current
    if (!handle) return
    setBusy(true)
    setError(null)
    try {
      await reconcile(handle, { interactive: true })
      setStatus('connected')
    } catch (e) {
      setStatus('error')
      setError(errText(e))
    } finally {
      setBusy(false)
    }
  }, [reconcile])

  const disconnect = useCallback(async () => {
    if (writeTimerRef.current) {
      clearTimeout(writeTimerRef.current)
      writeTimerRef.current = null
    }
    handleRef.current = null
    baseSigRef.current = null
    await forgetHandle()
    setStatus('off')
    setFileName(null)
    setLastSyncedAt(null)
    setError(null)
  }, [])

  // On load, silently restore a remembered handle; re-grant needs a click.
  useEffect(() => {
    if (!supported || startedRef.current) return
    startedRef.current = true
    let cancelled = false
    ;(async () => {
      const handle = await restoreHandle()
      if (!handle || cancelled) return
      handleRef.current = handle
      setFileName(handle.name)
      if ((await permissionState(handle)) === 'granted') {
        try {
          baseSigRef.current = null
          await reconcile(handle)
          if (!cancelled) setStatus('connected')
        } catch (e) {
          if (!cancelled) {
            setStatus('error')
            setError(errText(e))
          }
        }
      } else if (!cancelled) {
        setStatus('reconnect')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supported, reconcile])

  // Pull in changes another device saved while we were away.
  useEffect(() => {
    if (!supported) return
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      if (status !== 'connected' || !handleRef.current || busy) return
      reconcile(handleRef.current).catch(() => {})
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [supported, status, busy, reconcile])

  // Flush any pending debounced write on unmount.
  useEffect(
    () => () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    },
    [],
  )

  return {
    supported,
    status,
    busy,
    fileName,
    lastSyncedAt,
    error,
    connect,
    reconnect,
    disconnect,
    syncNow,
  }
}
