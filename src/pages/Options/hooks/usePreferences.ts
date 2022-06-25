import { curry } from 'ramda'
import { useCallback, useState } from 'react'

import { Preferences } from '../../../preferences'
import { controlIsLaunched } from '../../../x-state/control-window-launched'
import { sendMessage } from '../../../message'

type SafelyPreferencesKeys = Exclude<keyof Preferences, '__is_poker__' | 'version'>

const RequireCloseControlWindow = <A extends unknown[]>(
  callback: (...args: A) => void
) => (
  async (...args: A) => {
    if (await controlIsLaunched()) {
      alert('修改这个设置项需要先关闭 Poker 控制窗')
      sendMessage('Refocus', null)
    } else {
      return callback(...args)
    }
  }
)

export default function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences | undefined>(undefined)

  const setPreferencesItem = curry(
    useCallback(function <F extends SafelyPreferencesKeys>(
      field: F,
      new_value: Preferences[F]
    ) {
      setPreferences((latest) => {
        if (latest === undefined) {
          return undefined
        } else {
          return {
            ...latest,
            [field]: new_value
          }
        }
      })
    }, [])
  )

  const HandleSettingFieldChange = useCallback((f: SafelyPreferencesKeys) => {
    return RequireCloseControlWindow(setPreferencesItem(f))
  }, [setPreferencesItem])

  return { preferences, setPreferences, HandleSettingFieldChange }
}