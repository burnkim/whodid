import { TodayScreen } from './today/TodayScreen.jsx'
import { HistoryScreen } from './history/HistoryScreen.jsx'
import { StatsScreen } from './stats/StatsScreen.jsx'
import { ManageScreen } from './manage/ManageScreen.jsx'
import { SettingsScreen } from './settings/SettingsScreen.jsx'

export function ScreenRouter({ view, onOpenSettings, onBack, onGoManage }) {
  switch (view) {
    case 'history':
      return <HistoryScreen />
    case 'stats':
      return <StatsScreen />
    case 'manage':
      return <ManageScreen onOpenSettings={onOpenSettings} />
    case 'settings':
      return <SettingsScreen onBack={onBack} />
    case 'today':
    default:
      return <TodayScreen onOpenSettings={onOpenSettings} onGoManage={onGoManage} />
  }
}
