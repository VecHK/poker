import { curry, partial } from 'ramda'
import cfg from '../../config'
import { load as loadEnvironment, Environment } from '../../environment'
import { load as loadOptions, Options } from '../../options'
import { calcWindowsTotalHeight, calcWindowsTotalWidth } from './../pos'
import { getCurrentDisplayLimit, Limit } from './limit'
import { createSearchMatrix, SearchMatrix } from './search-matrix'

const getPlatformInfo = () => (new Promise<chrome.runtime.PlatformInfo>(
  res => chrome.runtime.getPlatformInfo(res)
))

// 计算横向最大能容纳的窗口数
type totalWidth = number
type count = number
function calcMaxColumns(
  limit_width: number, window_width: number, gap_horizontal: number
) {
  function c(count: number): Readonly<[count, totalWidth]> {
    const total_width = calcWindowsTotalWidth(count + 1, window_width, gap_horizontal)
    if (total_width > limit_width) {
      return [count, calcWindowsTotalWidth(count, window_width, gap_horizontal)]
    } else {
      return c(count + 1)
    }
  } 

  return c(1)
}

export function autoAdjustWidth(
  gap_horizontal: number,
  limit_width: number,
): {
  max_window_per_line: number
  total_width: number
  window_width: number
} {
  const window_width = cfg.SEARCH_WINDOW_WIDTH_NORMAL
  const [max_window_per_line, total_width] = calcMaxColumns(
    limit_width, window_width, gap_horizontal
  )

  if (max_window_per_line >= cfg.NORMAL_WINDOW_WINDOW_COUNT) {
    return { max_window_per_line, total_width, window_width }
  } else {
    const window_width = cfg.SEARCH_WINDOW_WIDTH_SMALL
    const [max_window_per_line, total_width] = calcMaxColumns(
      limit_width, window_width, gap_horizontal
    )
    return { max_window_per_line, total_width, window_width }
  }
}

const dimAdd = curry((offset: number, dimension: number) => {
  return Math.round(offset + dimension)
})
const ToRealPos = (
  limit: Limit,
  total_width: number,
  total_height: number
) => {
  const base_x = (limit.width - total_width) / 2
  const base_y = calcBaseY(total_height, limit.height)

  const offset_x = base_x + limit.minX
  const offset_y = base_y + limit.minY

  const toRealLeft = dimAdd(offset_x)
  const toRealTop = dimAdd(offset_y)

  return [toRealLeft, toRealTop] as const
}

function basePos(...args: Parameters<typeof ToRealPos>) {
  const [ toRealLeft, toRealTop ] = ToRealPos(...args)
  return { toRealLeft, toRealTop }
}

const calcTotalHeight = partial(function calcTotalHeight(
  control_window_gap: number,
  control_window_height: number,
  o: {
    row: number,
    window_height: number,
    titlebar_height: number,
  }
) {
  const windows_height = calcWindowsTotalHeight(
    o.row, o.window_height, o.titlebar_height
  )

  return windows_height + control_window_gap + control_window_height
}, [cfg.SEARCH_WINDOW_GAP_HORIZONTAL, cfg.CONTROL_WINDOW_HEIGHT])

const autoAdjustHeight = partial(function autoAdjustHeight(
  height_list: number[],
  total_row: number,
  titlebar_height: number,
  limit_height: number,
): { window_height: number; total_height: number } {
  if (height_list.length === 0) {
    throw Error('none available window height')
  } else {
    const [window_height, ...remain_height_list] = height_list

    const total_height = calcTotalHeight({
      row: total_row,
      window_height,
      titlebar_height,
    })

    if (total_height < limit_height) {
      return { window_height, total_height }
    } else {
      return autoAdjustHeight(
        remain_height_list, total_row, titlebar_height, limit_height
      )
    }
  }
}, [cfg.SEARCH_WINDOW_HEIGHT_LIST])

const calcBaseY = (total_height: number, limit_height: number) =>
  Math.round((limit_height - total_height) / 2)

const baseControl = partial(function baseControl(
  control_window_height: number,
  control_window_width: number,
  limit: Limit,
  total_height: number
) {
  return {
    calcControlWindowPos() {
      const base_y = calcBaseY(total_height, limit.height)

      const top = total_height - control_window_height + base_y + limit.minY
      const left = ((limit.width - control_window_width) / 2) + limit.minX
      return [Math.round(top), Math.round(left)] as const
    }
  }
}, [cfg.CONTROL_WINDOW_HEIGHT, cfg.CONTROL_WINDOW_WIDTH])

type BaseInfo = {
  window_height: number
  window_width: number
  gap_horizontal: number
  titlebar_height: number
}
export type Base = {
  limit: Limit,
  platform: chrome.runtime.PlatformInfo,
  info: BaseInfo,
  options: Options,
  max_window_per_line: number
  search_matrix: SearchMatrix
} & ReturnType<typeof basePos> & ReturnType<typeof baseControl>

async function initBase(
  environment: Environment,
  options: Options,
): Promise<Base> {
  const [limit, platform] = await Promise.all([
    getCurrentDisplayLimit(),
    getPlatformInfo()
  ])

  const gap_horizontal = cfg.SEARCH_WINDOW_GAP_HORIZONTAL

  const {
    max_window_per_line, total_width, window_width
  } = autoAdjustWidth(gap_horizontal, limit.width)

  const search_matrix = createSearchMatrix(
    cfg.PLAIN_SEARCH_WINDOW_URL_PATTERN,
    max_window_per_line,
    options.site_matrix,
  )
  const search_count = search_matrix.flat().length
  const total_row = Math.ceil(search_count / max_window_per_line)

  const { window_height, total_height } = autoAdjustHeight(
    total_row,
    environment.titlebar_height,
    limit.height
  )

  return Object.freeze({
    limit,
    platform,
    info: {
      window_height,
      window_width,
      gap_horizontal,
      titlebar_height: environment.titlebar_height,
    },
    options,
    max_window_per_line,
    search_matrix,

    ...basePos(limit, total_width, total_height),
    ...baseControl(limit, total_height),
  })
}

export async function createBase() {
  const [environment, options] = await Promise.all([
    loadEnvironment(),
    loadOptions()
  ])

  return initBase(environment, options)
}
