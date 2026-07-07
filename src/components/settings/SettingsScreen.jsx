import { useRef } from 'react'
import { useStore } from '../../hooks/useStore.js'
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js'
import { useCloudSync } from '../../hooks/useCloudSync.js'
import {
  buildExport,
  downloadJSON,
  exportFilename,
  importSummary,
  parseImport,
} from '../../lib/backup.js'
import {
  migrateChores,
  migrateLogs,
  migrateMembers,
  migrateSettings,
} from '../../store/migrate.js'
import { Icon } from '../common/Icon.jsx'

function Segmented({ value, options, onChange }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          className={`segmented__btn ${value === o.value ? 'segmented__btn--active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Switch({ on, onChange, label }) {
  return (
    <button
      className={`switch ${on ? 'switch--on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    >
      <span className="switch__knob" />
    </button>
  )
}

function relTime(ms) {
  if (!ms) return null
  const diff = Date.now() - ms
  if (diff < 60_000) return '방금 전'
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${p(d.getHours())}:${p(d.getMinutes())}`
}

// iCloud 파일 동기화. On Chromium desktop we hold a live handle to a JSON file
// in an iCloud Drive folder and keep the shared record (집안일·기록·구성원) in
// step across devices. On Safari/iOS the API is absent, so we point the user at
// the manual 내보내기/가져오기 flow against the same iCloud file.
function CloudSyncSection() {
  const sync = useCloudSync()
  const synced = relTime(sync.lastSyncedAt)

  if (!sync.supported) {
    return (
      <>
        <div className="settings-group__title">기기 간 동기화</div>
        <div className="settings-group">
          <div className="settings-row">
            <div>
              <div className="settings-row__label">iCloud Drive로 맞추기</div>
              <div className="settings-row__desc">
                이 브라우저는 자동 연결을 지원하지 않아요. 아래 <b>백업</b>의 내보내기로 iCloud
                Drive의 whodid 폴더에 저장하고, 다른 기기에선 가져오기로 불러오세요.
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const statusDesc =
    sync.status === 'connected' ? (
      <>
        {sync.fileName || '파일'} · {synced ? `${synced} 동기화` : '연결됨'}
      </>
    ) : sync.status === 'reconnect' ? (
      '권한을 다시 허용하면 자동으로 이어져요.'
    ) : sync.status === 'error' ? (
      sync.error || '문제가 생겼어요.'
    ) : (
      'iCloud Drive에 둔 파일과 자동으로 맞춰요.'
    )

  return (
    <>
      <div className="settings-group__title">기기 간 동기화</div>
      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row__label">
              iCloud 파일 연결
              {sync.status === 'connected' && <span className="sync-pill">동기화 켜짐</span>}
            </div>
            <div className="settings-row__desc">{statusDesc}</div>
          </div>
          {sync.status === 'off' && (
            <button className="settings-row__btn" onClick={sync.connect} disabled={sync.busy}>
              {sync.busy ? '연결 중…' : '연결'}
            </button>
          )}
          {sync.status === 'reconnect' && (
            <button className="settings-row__btn" onClick={sync.reconnect} disabled={sync.busy}>
              다시 허용
            </button>
          )}
          {(sync.status === 'connected' || sync.status === 'error') && (
            <button className="settings-row__btn" onClick={sync.syncNow} disabled={sync.busy}>
              {sync.busy ? '동기화 중…' : '지금 동기화'}
            </button>
          )}
        </div>
        {sync.status !== 'off' && (
          <div className="settings-row">
            <div>
              <div className="settings-row__label">연결 해제</div>
              <div className="settings-row__desc">이 기기에서만 끊어요 (파일·기록은 유지)</div>
            </div>
            <button
              className="settings-row__btn settings-row__btn--danger"
              onClick={sync.disconnect}
              disabled={sync.busy}
            >
              해제
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export function SettingsScreen({ onBack }) {
  const { state, actions } = useStore()
  const { settings } = state
  const fileRef = useRef(null)
  const { canInstall, promptInstall } = useInstallPrompt()

  function handleExport() {
    downloadJSON(buildExport(state), exportFilename())
    actions.markExport()
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const payload = parseImport(String(reader.result))
        if (window.confirm(`가져올 데이터: ${importSummary(payload)}\n현재 데이터를 덮어쓸까요?`)) {
          actions.importData({
            chores: migrateChores(payload.chores),
            logs: migrateLogs(payload.logs),
            settings: migrateSettings(payload.settings),
            members: migrateMembers(payload.members),
          })
          window.alert('가져오기를 완료했어요.')
        }
      } catch (err) {
        window.alert(err.message || '가져오기에 실패했어요.')
      }
    }
    reader.readAsText(file)
  }

  function handleReset() {
    if (!window.confirm('정말 모든 데이터를 삭제할까요?\n집안일과 모든 기록이 사라져요.')) return
    if (!window.confirm('되돌릴 수 없어요. 먼저 내보내기를 권장해요.\n그래도 삭제할까요?')) return
    actions.resetAll()
    window.alert('모든 데이터를 삭제했어요.')
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="icon-btn" onClick={onBack} aria-label="뒤로">
          <Icon name="chevron-left" />
        </button>
        <h1 className="screen__title" style={{ margin: 0 }}>
          설정
        </h1>
        <span style={{ width: 40 }} />
      </div>

      {canInstall && (
        <>
          <div className="settings-group__title">앱</div>
          <div className="settings-group">
            <div className="settings-row">
              <div>
                <div className="settings-row__label">홈 화면에 추가</div>
                <div className="settings-row__desc">앱처럼 전체화면으로, 오프라인에서도 실행</div>
              </div>
              <button className="settings-row__btn" onClick={promptInstall}>
                설치
              </button>
            </div>
          </div>
        </>
      )}

      <div className="settings-group__title">화면</div>
      <div className="settings-group">
        <div className="settings-row">
          <span className="settings-row__label">테마</span>
          <Segmented
            value={settings.theme}
            onChange={(v) => actions.updateSettings({ theme: v })}
            options={[
              { value: 'system', label: '시스템' },
              { value: 'light', label: '라이트' },
              { value: 'dark', label: '다크' },
            ]}
          />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">오늘 목록 정렬</div>
            <div className="settings-row__desc">완료한 항목을 아래로 내릴지</div>
          </div>
          <Segmented
            value={settings.sortMode}
            onChange={(v) => actions.updateSettings({ sortMode: v })}
            options={[
              { value: 'undone-first', label: '미완료 우선' },
              { value: 'manual', label: '수동' },
            ]}
          />
        </div>
      </div>

      <div className="settings-group__title">동작</div>
      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row__label">진동 피드백</div>
            <div className="settings-row__desc">체크할 때 가볍게 진동 (지원 기기)</div>
          </div>
          <Switch
            on={settings.hapticEnabled}
            label="진동 피드백"
            onChange={(v) => actions.updateSettings({ hapticEnabled: v })}
          />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">삭제 전 확인</div>
            <div className="settings-row__desc">집안일 삭제 시 한 번 더 묻기</div>
          </div>
          <Switch
            on={settings.confirmDelete}
            label="삭제 전 확인"
            onChange={(v) => actions.updateSettings({ confirmDelete: v })}
          />
        </div>
      </div>

      <CloudSyncSection />

      <div className="settings-group__title">백업</div>
      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row__label">내보내기</div>
            <div className="settings-row__desc">백업 파일(JSON)로 저장 · iCloud Drive 폴더에 두면 공유돼요</div>
          </div>
          <button className="settings-row__btn" onClick={handleExport}>
            내보내기
          </button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">가져오기</div>
            <div className="settings-row__desc">백업 파일에서 복원 (덮어쓰기)</div>
          </div>
          <button className="settings-row__btn" onClick={() => fileRef.current?.click()}>
            가져오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>
      </div>

      <div className="danger-zone">
        <button className="btn btn--danger btn--block" onClick={handleReset}>
          <Icon name="trash" size={18} /> 모든 데이터 삭제
        </button>
      </div>

      <p className="app-meta">whodid · 집안일 체크 · 모든 데이터는 이 기기에만 저장돼요</p>
    </div>
  )
}
