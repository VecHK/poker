import cfg from '../config'
import { createPlainMatrix, MapMatrix } from '../utils/layout/matrix'

type URLPattern = string
export type SiteOption = {
  icon: string
  name: string
  url_pattern: URLPattern
}

export type SiteRow = Array<SiteOption>
export type SiteMatrix = Array<SiteRow>

export function toSearchURL(urlPattern: URLPattern, keyword: string) {
  return urlPattern.replace('[[]]', encodeURIComponent(keyword))
}

export function getDefaultSiteMatrix(): SiteMatrix {
  const maxWindowPerLine = 8
  const plainMatrix = createPlainMatrix(cfg.PRESET_SEARCH_LIST.length, maxWindowPerLine)

  return MapMatrix(plainMatrix, (u, row, col) => {
    const idx = (row * maxWindowPerLine) + col
    const search = cfg.PRESET_SEARCH_LIST[idx]
    if (search) {
      return {
        icon: '_DEFAULT_ICON_',
        name: '_DEFAULT_NAME_',
        ...search,
      }
    } else {
      return {
        icon: '_DEFAULT_ICON_',
        name: '_DEFAULT_NAME_',
        url_pattern: cfg.PLAIN_WINDOW_URL_PATTERN
      }
    }
  })
}
