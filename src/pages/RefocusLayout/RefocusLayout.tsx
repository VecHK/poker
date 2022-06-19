import React from 'react'
import { sendMessage } from '../../message'

import s from './RefocusLayout.module.css'

const Popup = () => {
  return (
    <div className={s.App}>
      <AppMain />
    </div>
  )
}

function AppMain() {
  return (
    <footer className={s.AppMain}>
      <button
        className={s.Button}
        onClick={(e) => {
          e.preventDefault()
          sendMessage('Refocus', null)
        }}
      >还原 Poker 窗口</button>
    </footer>
  )
}

export default Popup
