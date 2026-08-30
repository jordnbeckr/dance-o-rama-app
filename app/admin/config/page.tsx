import { db } from '@/lib/db'
import { getSettings } from '@/lib/deadline'
import DancesConfig from './DancesConfig'
import StudiosConfig from './StudiosConfig'
import SettingsConfig from './SettingsConfig'

export default async function ConfigPage() {
  const [dances, studios, settings] = await Promise.all([
    db.dance.findMany({ orderBy: [{ style: 'asc' }, { order: 'asc' }] }),
    db.studio.findMany({ orderBy: { order: 'asc' } }),
    getSettings(),
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Admin Config</h1>
      <SettingsConfig settings={settings} />
      <StudiosConfig studios={studios} />
      <DancesConfig dances={dances} />
    </div>
  )
}
