import React, { useEffect, useMemo, useState } from 'react'
import cfg from '../../../../config'
import { SiteMatrix } from '../../../../options/v2'
import { calcMaxColumns } from '../../../../utils/base'
import { getCurrentDisplayLimit } from '../../../../utils/base/limit'
import { calcWindowsTotalWidth } from '../../../../utils/pos'

import s from './WarningLine.module.css'

export default function WarningLine({ siteMatrix }: { siteMatrix: SiteMatrix }) {
  const [maxWindowPerLine, setMaxWindowPerLine] = useState(-1)

  useEffect(() => {
    getCurrentDisplayLimit().then(limit => {
      const [max_window_per_line] = calcMaxColumns(
        limit.width, cfg.SEARCH_WINDOW_WIDTH, cfg.SEARCH_WINDOW_GAP_HORIZONTAL
      )
      setMaxWindowPerLine(max_window_per_line)
    })
  }, [])

  const hasMaxCol = useMemo(() => {
    return !siteMatrix.every((cols) => {
      if (maxWindowPerLine === -1) {
        return false
      } else {
        console.log(cols.length, maxWindowPerLine, cols.length < maxWindowPerLine)
        return cols.length <= maxWindowPerLine
      }
    })
  }, [maxWindowPerLine, siteMatrix])

  const left = useMemo(() => {
    const SiteWindowWidth = 128
    const SiteWindowGap = 16
    const SiteWindowGapHalf = SiteWindowGap / 2
    const SettingItemPadding = 20
    const HandlerWidth = 34
    const LineWidthHalf = 1 / 2
    
    const width = calcWindowsTotalWidth(
      maxWindowPerLine, SiteWindowWidth, SiteWindowGap
    )
  
    const BaseLeft = SiteWindowGapHalf + SettingItemPadding + HandlerWidth
    return `${BaseLeft + width + SiteWindowGapHalf - LineWidthHalf}px`
  }, [maxWindowPerLine])

  return (
    <div
      className={`${s.WarningLineWrapper} ${hasMaxCol ? s.WarningEnable : ''}`}
      style={{ left }}
    >
      <div className={s.WarningLine}></div>
      <div className={s.WarningDescription}>超过屏幕所能并列显示的窗口数</div>
    </div>
  )
}
