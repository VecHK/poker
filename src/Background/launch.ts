import { WatchMemo } from 'vait'
import cfg from '../config'
import { createBase, RevertContainerID } from '../core/base'
import { calcControlWindowPos } from '../core/layout/control-window'
import { ApplyChromeEvent } from '../utils/chrome-event'

function detectUrl({ text, revert_container_id }: {
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
    return chrome.runtime.getURL(`/control.html?${param_string}`)
  } else {
    return chrome.runtime.getURL(`/control.html`)
  }
}

async function getControlPos() {
  const base = await createBase(undefined)

  const [ top, left ] = calcControlWindowPos(base.layout_height, base.limit)
  return [ top, left ] as const
}

export const controlWindowMemo = WatchMemo(false)

export default async function launchControlWindow({ text, revert_container_id }: {
  text: string | undefined
  revert_container_id: RevertContainerID
}) {
  const [ isLaunched, setLaunch ] = controlWindowMemo

  if (isLaunched()) {
    throw Error('control window is Launched')
  } else {
    const [ top, left ] = await getControlPos()
    const controlWindow = await chrome.windows.create({
      type: 'popup',
      width: Math.round(cfg.CONTROL_WINDOW_WIDTH),
      height: Math.round(cfg.CONTROL_WINDOW_HEIGHT),
      left: Math.round(left),
      top: Math.round(top),
      url: detectUrl({ text, revert_container_id }),
      focused: true,
    })

    setLaunch(true)

    const cancelRemoveEvent = ApplyChromeEvent(
      chrome.windows.onRemoved,
      (id) => {
        if (id === controlWindow.id) {
          cancelRemoveEvent()
          setLaunch(false)
        }
      }
    )

    return {
      controlWindow
    }
  }
}
