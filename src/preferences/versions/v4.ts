import { PreferencesV3 } from './v3-type'
import { PreferencesV4 } from './v4-type'

export function updater(v3: PreferencesV3): PreferencesV4 {
  return {
    __is_poker__: true,
    version: 4,

    launch_poker_contextmenu: true,

    fill_empty_window: false,
    refocus_window: false,

    site_settings: v3.site_settings.map(settings_row => {
      return {
        ...settings_row,
        row: settings_row.row.map(opt => {
          return {
            id: opt.id,
            icon: opt.icon,
            name: opt.name,
            url_pattern: opt.url_pattern,
            enable_mobile: true,
            access_mode: 'MOBILE'
          }
        })
      }
    }),
  }
}