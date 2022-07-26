import { thunkify } from 'ramda'
import cfg from '../../config'
import { createBase, createLayoutInfo, RevertContainerID, selectSiteSettingsByFiltered } from '../../core/base'
import { getControlWindowHeight } from '../../core/base/control-window-height'
import { calcControlWindowPos } from '../../core/layout/control-window'
import { controlIsLaunched, setControlLaunch } from '../../x-state/control-window-launched'

async function controlBounds() {
  const base = await createBase(undefined)
  const site_settings = selectSiteSettingsByFiltered(
    base.preferences.site_settings,
    base.init_filtered_floor
  )

  const info = createLayoutInfo(base.environment, base.limit, site_settings)

  const control_window_height = getControlWindowHeight(site_settings)

  const [ top, left ] = calcControlWindowPos(
    control_window_height,
    info.total_height,
    base.limit
  )

  return {
    top,
    left,
    width: cfg.CONTROL_WINDOW_WIDTH,
    height: control_window_height,
  } as const
}

export const getControlWindowUrl = thunkify(chrome.runtime.getURL)(
  `/control.html`
)

function generateUrl({ text, revert_container_id }: {
  text?: string
  revert_container_id: RevertContainerID
}): string {
  const usp = new URLSearchParams()
  if (text !== undefined) {
    usp.append(cfg.CONTROL_QUERY_TEXT, text)
  }
  if (revert_container_id !== undefined) {
    usp.append(cfg.CONTROL_QUERY_REVERT, String(revert_container_id))
  }

  const param_string = usp.toString()
  if (param_string.length !== 0) {
    return `${getControlWindowUrl()}?${param_string}`
  } else {
    return getControlWindowUrl()
  }
}

export default async function launchControlWindow({ text, revert_container_id }: {
  text: string | undefined
  revert_container_id: RevertContainerID
}) {
  if (await controlIsLaunched()) {
    throw Error('control window is Launched')
  } else {
    const { top, left, height, width } = await controlBounds()

    const controlWindow = await chrome.windows.create({
      url: generateUrl({ text, revert_container_id }),
      type: 'popup',
      state: 'normal',
      focused: true,

      width: Math.round(width),
      height: Math.round(height),
      left: Math.round(left),
      top: Math.round(top),
    })

    const { id: control_window_id, state } = controlWindow

    if (control_window_id === undefined) {
      throw Error('launchControlWindow: control_window_id is undefined')
    } else {
      await setControlLaunch(control_window_id)

      if (state === 'fullscreen') {
        // prevent fullscreen
        await chrome.windows.update(control_window_id, { focused: true, state: 'normal' })
      }

      return {
        controlWindow
      }
    }
  }
}
